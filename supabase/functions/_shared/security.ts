// Helpers de segurança compartilhados pelas edge functions.
// Uso: import { ... } from "../_shared/security.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
// Defina o secret ALLOWED_ORIGINS (separado por vírgula) para restringir quem
// pode chamar as funções a partir de um navegador. Exemplos:
//   https://comerciovizinho.com.br,*.lovable.app
// Sem o secret, o comportamento antigo (qualquer origem) é mantido.
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function originAllowed(origin: string): boolean {
  if (!origin) return false;
  let host = "";
  try {
    host = new URL(origin).hostname;
  } catch {
    return false;
  }
  return ALLOWED_ORIGINS.some((rule) => {
    if (rule.startsWith("*.")) return host === rule.slice(2) || host.endsWith(rule.slice(1));
    return rule === origin;
  });
}

export function corsFor(req: Request): Record<string, string> {
  const base: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (ALLOWED_ORIGINS.length === 0) return { ...base, "Access-Control-Allow-Origin": "*" };
  const origin = req.headers.get("origin") ?? "";
  if (originAllowed(origin)) return { ...base, "Access-Control-Allow-Origin": origin };
  return base; // sem Access-Control-Allow-Origin: o navegador bloqueia
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsFor(req), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Envolve o handler: preflight, só POST, e erros nunca vazam detalhes internos. */
export function handle(fn: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsFor(req) });
    if (req.method !== "POST") return json(req, { error: "Método não permitido" }, 405);
    try {
      return await fn(req);
    } catch (err) {
      if (err instanceof HttpError) return json(req, { error: err.message }, err.status);
      console.error("Unhandled error:", err);
      return json(req, { error: "Erro interno. Tente novamente." }, 500);
    }
  };
}

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------
export async function readJson(req: Request, maxBytes = 16_000): Promise<Record<string, unknown>> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > maxBytes) throw new HttpError(413, "Requisição muito grande");
  const text = await req.text();
  if (text.length > maxBytes) throw new HttpError(413, "Requisição muito grande");
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // cai no erro abaixo
  }
  throw new HttpError(400, "Requisição inválida");
}

/**
 * Normaliza texto vindo do usuário antes de ir para prompt de IA:
 * remove caracteres de controle, troca aspas duplas e limita o tamanho.
 * Nunca lança erro; devolve "" se não for string.
 */
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  // deno-lint-ignore no-control-regex
  return value.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/"/g, "'").trim().slice(0, max);
}

// ---------------------------------------------------------------------------
// Clientes Supabase
// ---------------------------------------------------------------------------
export function serviceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Cliente com a chave pública: as políticas de RLS valem (use para leituras públicas). */
export function anonClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface AuthedUser {
  id: string;
  email: string | null;
}

/** Devolve o usuário logado (JWT de usuário real; a chave anon NÃO conta) ou null. */
export async function getUser(req: Request): Promise<AuthedUser | null> {
  const header = req.headers.get("Authorization") ?? "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  const { data, error } = await serviceClient().auth.getUser(token);
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}

export async function requireUser(req: Request): Promise<AuthedUser> {
  const user = await getUser(req);
  if (!user) throw new HttpError(401, "Faça login para continuar.");
  return user;
}

// ---------------------------------------------------------------------------
// Rate limit
// ---------------------------------------------------------------------------
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

// Fallback em memória (por instância) caso o banco esteja indisponível.
const memory = new Map<string, { count: number; reset: number }>();
function memoryHit(key: string, max: number, windowSec: number): boolean {
  const now = Date.now();
  const rec = memory.get(key);
  if (!rec || now > rec.reset) {
    memory.set(key, { count: 1, reset: now + windowSec * 1000 });
    return true;
  }
  rec.count += 1;
  return rec.count <= max;
}

/**
 * Conta uma tentativa. Retorna true se ainda está dentro do limite.
 * Usa a função SQL rl_hit (migration de segurança), compartilhada entre instâncias.
 * failClosed=true  -> se o banco falhar, BLOQUEIA (use em login/recuperação/admin).
 * failClosed=false -> se o banco falhar, usa o contador em memória.
 */
export async function rateLimit(
  key: string,
  max: number,
  windowSec: number,
  failClosed = false,
): Promise<boolean> {
  try {
    const { data, error } = await serviceClient().rpc("rl_hit", {
      _key: key,
      _max: max,
      _window_seconds: windowSec,
    });
    if (error) throw error;
    return data === true;
  } catch (err) {
    console.error("rateLimit RPC failed:", err);
    if (failClosed) return false;
    return memoryHit(key, max, windowSec);
  }
}

export const tooMany = (req: Request, message = "Muitas tentativas. Aguarde um momento e tente novamente.") =>
  json(req, { error: message }, 429);

// ---------------------------------------------------------------------------
// Criptografia
// ---------------------------------------------------------------------------
const enc = new TextEncoder();
const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

export async function sha256Hex(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", enc.encode(input)));
}

export async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

/** Comparação em tempo constante (compara os hashes SHA-256 dos dois valores). */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256Hex(a), sha256Hex(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0;
}

export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
