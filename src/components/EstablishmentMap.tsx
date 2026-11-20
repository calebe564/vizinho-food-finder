import { useState } from "react";
import { ExternalLink, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bestMapsLink, osmEmbedUrl, validCoordinates } from "@/lib/mapLinks";

interface EstablishmentMapProps {
  name: string;
  address: string;
  referencePoint?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsLink?: string | null;
}

/**
 * Localização da empresa: endereço, "Como chegar" e mapa.
 * O mapa (OpenStreetMap) só é carregado quando a pessoa pede, para a página abrir rápido
 * e para não enviar dados a terceiros sem necessidade.
 */
export function EstablishmentMap({ name, address, referencePoint, latitude, longitude, googleMapsLink }: EstablishmentMapProps) {
  const [showMap, setShowMap] = useState(false);
  const hasCoordinates = validCoordinates(latitude, longitude);
  const embed = hasCoordinates ? osmEmbedUrl(latitude as number, longitude as number) : null;
  const directions = bestMapsLink(googleMapsLink, latitude, longitude);

  return (
    <section className="bg-card border border-border rounded-xl p-4 mb-6" aria-labelledby="localizacao-titulo">
      <h2 id="localizacao-titulo" className="text-sm font-semibold mb-2 flex items-center gap-1.5">
        <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
        Localização
      </h2>
      <p className="text-sm text-foreground">{address}</p>
      {referencePoint && <p className="text-xs text-muted-foreground mt-0.5">Referência: {referencePoint}</p>}

      <div className="flex flex-wrap gap-2 mt-3">
        {directions && (
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <a href={directions} target="_blank" rel="noopener noreferrer">
              <Navigation className="h-4 w-4" aria-hidden="true" />
              Como chegar
              <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
            </a>
          </Button>
        )}
        {embed && (
          <Button size="sm" variant="secondary" onClick={() => setShowMap((v) => !v)} aria-expanded={showMap}>
            {showMap ? "Esconder mapa" : "Ver no mapa"}
          </Button>
        )}
      </div>

      {embed && showMap && (
        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <iframe
            title={`Mapa da localização de ${name}`}
            src={embed}
            loading="lazy"
            className="w-full h-56 md:h-72"
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
          />
          <p className="px-2 py-1 text-[10px] text-muted-foreground bg-muted">Mapa: © colaboradores do OpenStreetMap</p>
        </div>
      )}
    </section>
  );
}
