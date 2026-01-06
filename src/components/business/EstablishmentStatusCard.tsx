import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EstablishmentStatusCardProps {
  isActive: boolean;
  profileComplete: number;
  hasPendingChanges?: boolean;
}

export function EstablishmentStatusCard({ 
  isActive, 
  profileComplete,
  hasPendingChanges = false 
}: EstablishmentStatusCardProps) {
  const getStatus = () => {
    if (!isActive) {
      return {
        icon: AlertCircle,
        label: 'Incompleto',
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/20',
        message: 'Complete as informações para aumentar sua visibilidade.'
      };
    }
    if (hasPendingChanges) {
      return {
        icon: Clock,
        label: 'Em análise',
        color: 'text-amber-600',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        message: 'Suas alterações estão sendo analisadas.'
      };
    }
    if (profileComplete < 80) {
      return {
        icon: AlertCircle,
        label: 'Incompleto',
        color: 'text-amber-600',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        message: 'Complete seu perfil para melhorar sua visibilidade na busca.'
      };
    }
    return {
      icon: CheckCircle2,
      label: 'Ativo',
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      message: 'Sua empresa está visível para clientes próximos.'
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <Card className={cn(
      "border-0 shadow-elevated rounded-2xl overflow-hidden",
      status.borderColor,
      "border-l-4"
    )}>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", status.bgColor)}>
            <StatusIcon className={cn("h-5 w-5", status.color)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">Status da Empresa</span>
              <Badge 
                variant="outline" 
                className={cn("text-xs", status.bgColor, status.color, "border-0")}
              >
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {status.message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
