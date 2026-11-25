import { useId } from "react";
import { cn } from "@/lib/utils";

// Logotipo do Comércio Vizinho: pin azul com um círculo vazado e um anel na base.
// Desenhado em vetor (SVG): fica nítido em qualquer tamanho e usa a cor da marca, que muda
// sozinha no tema escuro (variável --brand-blue em index.css).
// O anel é "recortado" em volta da ponta do pin com máscara, então o logotipo não tem
// fundo branco e funciona sobre qualquer cor.

const VIEW_BOX = "167.5 24.5 67 99";
const PIN_PATH = "M172.27 56.41A28.71 28.71 0 0 1 229.69 56.41C229.69 67.18 214.17 96.06 204.93 102.77Q200.98 106.33 197.03 102.77C187.79 96.06 172.27 67.18 172.27 56.41Z";
const HOLE_PATH = "M186.65 56.41a14.33 14.33 0 1 0 28.66 0a14.33 14.33 0 1 0 -28.66 0Z";
const RING = { cx: 200.98, cy: 107.8, rx: 27.74, ry: 11.4, strokeWidth: 5.77 };
const GAP = 5.45;

export function BrandMark({ className }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const maskId = `pin-recorte-${id}`;
  return (
    <svg viewBox={VIEW_BOX} className={cn("shrink-0", className)} aria-hidden="true" focusable="false">
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="167.5" y="24.5" width="67.0" height="99.0">
          <rect x="167.5" y="24.5" width="67.0" height="99.0" fill="white" />
          <path d={PIN_PATH} fill="black" stroke="black" strokeWidth={GAP * 2} strokeLinejoin="round" />
        </mask>
      </defs>
      <ellipse
        cx={RING.cx}
        cy={RING.cy}
        rx={RING.rx}
        ry={RING.ry}
        fill="none"
        strokeWidth={RING.strokeWidth}
        style={{ stroke: "var(--brand-blue)" }}
        mask={`url(#${maskId})`}
      />
      <path d={`${PIN_PATH}${HOLE_PATH}`} fillRule="evenodd" style={{ fill: "var(--brand-blue)" }} />
    </svg>
  );
}

const SIZES = {
  sm: { icon: "h-7", text: "text-[11px]" },
  md: { icon: "h-8 md:h-9", text: "text-[13px] md:text-[15px]" },
  lg: { icon: "h-12", text: "text-xl" },
} as const;

interface BrandLogoProps {
  size?: keyof typeof SIZES;
  className?: string;
}

/** Logotipo + nome em duas linhas ("Comércio" / "Vizinho"). */
export function BrandLogo({ size = "md", className }: BrandLogoProps) {
  const s = SIZES[size];
  return (
    <span role="img" aria-label="Comércio Vizinho" className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark className={cn(s.icon, "w-auto")} />
      <span className={cn("flex flex-col font-bold leading-[1.05] tracking-tight text-foreground", s.text)} aria-hidden="true">
        <span>Comércio</span>
        <span>Vizinho</span>
      </span>
    </span>
  );
}
