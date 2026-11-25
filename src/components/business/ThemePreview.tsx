import { DARK_SURFACE, LIGHT_SURFACE, hslToRgb, toHex, type BuiltTheme } from '@/lib/themeColors';

// Prévia da página da empresa com as cores escolhidas. Usa só estilos diretos (não depende das
// variáveis do site), por isso dá para ver o tema claro e o escuro lado a lado, seja qual for o
// tema que a pessoa está usando agora.

const FIXED = {
  light: { surface: toHex(LIGHT_SURFACE), text: '#0F1B2D', muted: '#5B6B7F', border: '#D9E0E8', brand: '#1048E8', brandFg: '#FFFFFF' },
  dark: { surface: toHex(DARK_SURFACE), text: '#F1F5F9', muted: '#9FB0C3', border: '#2A3A4C', brand: '#4C7DFF', brandFg: toHex(hslToRgb([209, 40, 8])) },
} as const;

const css = (triplet: string | undefined, fallback: string) => (triplet ? `hsl(${triplet})` : fallback);

interface ThemePreviewProps {
  theme: BuiltTheme | null;
  mode: 'light' | 'dark';
  name?: string;
}

export function ThemePreview({ theme, mode, name = 'Sua empresa' }: ThemePreviewProps) {
  const base = FIXED[mode];
  const vars = theme?.[mode] ?? {};
  const primary = css(vars['--primary'], base.brand);
  const primaryFg = css(vars['--primary-foreground'], base.brandFg);
  const accent = css(vars['--accent'], primary);
  const accentFg = css(vars['--accent-foreground'], primaryFg);
  const radius = vars['--radius'] ?? '0.75rem';

  return (
    <div
      aria-hidden="true"
      data-testid="theme-preview"
      style={{ background: base.surface, color: base.text, borderRadius: radius, border: `1px solid ${base.border}` }}
      className="p-4 space-y-3 text-sm"
    >
      <div className="flex items-center gap-3">
        <div
          style={{ background: primary, color: primaryFg, borderRadius: radius }}
          className="h-11 w-11 flex items-center justify-center font-bold text-lg"
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="font-bold truncate">{name}</p>
          <p style={{ color: base.muted }} className="text-xs">Padaria · Barreiro</p>
        </div>
        <span style={{ background: accent, color: accentFg, borderRadius: radius }} className="ml-auto px-2 py-0.5 text-[11px] font-medium">
          Aberto agora
        </span>
      </div>

      <div className="flex gap-2">
        <span style={{ background: primary, color: primaryFg, borderRadius: radius }} className="flex-1 text-center py-2 font-medium">
          Chamar no WhatsApp
        </span>
        <span style={{ color: primary, border: `1px solid ${primary}`, borderRadius: radius }} className="flex-1 text-center py-2 font-medium">
          Como chegar
        </span>
      </div>

      <div style={{ border: `1px solid ${base.border}`, borderRadius: radius }} className="p-3 flex items-center justify-between gap-2">
        <div>
          <p className="font-medium">Pão francês</p>
          <p style={{ color: primary }} className="font-bold">R$ 1,50</p>
        </div>
        <span style={{ background: accent, color: accentFg, borderRadius: radius }} className="px-2 py-0.5 text-[11px] font-medium">
          Promoção
        </span>
      </div>

      <p style={{ color: primary }} className="text-xs underline">www.suaempresa.com.br</p>
    </div>
  );
}
