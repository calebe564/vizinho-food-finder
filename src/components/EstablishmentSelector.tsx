import { Store, ChevronDown, Check } from 'lucide-react';
import { useActiveEstablishment } from '@/contexts/ActiveEstablishmentContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  proprietario: 'Proprietário',
  socio: 'Sócio',
  gerente: 'Gerente',
  representante: 'Representante',
};

export function EstablishmentSelector() {
  const { activeEstablishment, setActiveEstablishment, establishments } = useActiveEstablishment();

  if (establishments.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[200px]">
          <Store className="h-4 w-4 shrink-0" />
          <span className="truncate text-xs">
            {activeEstablishment?.establishment.name || 'Selecionar'}
          </span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <div className="px-2 py-1.5">
          <p className="text-xs font-medium text-muted-foreground">Suas Empresas</p>
        </div>
        {establishments.map((est) => (
          <DropdownMenuItem
            key={est.id}
            onClick={() => setActiveEstablishment(est)}
            className="flex items-center gap-3 py-2.5 cursor-pointer"
          >
            {est.establishment.profile_image ? (
              <img
                src={est.establishment.profile_image}
                alt={est.establishment.name}
                className="w-8 h-8 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Store className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{est.establishment.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {roleLabels[est.role] || est.role}
              </p>
            </div>
            {activeEstablishment?.establishment_id === est.establishment_id && (
              <Check className="h-4 w-4 text-primary shrink-0" />
            )}
            {!est.establishment.active && (
              <Badge variant="outline" className="text-[10px] shrink-0">Inativa</Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
