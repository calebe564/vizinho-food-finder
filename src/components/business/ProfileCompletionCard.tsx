import { CheckCircle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProfileCompletionCardProps {
  hasLogo: boolean;
  hasDescription: boolean;
  hasCategory: boolean;
  hasPhotos: boolean;
  hasSchedule: boolean;
  hasProducts: boolean;
}

export function ProfileCompletionCard({
  hasLogo,
  hasDescription,
  hasCategory,
  hasPhotos,
  hasSchedule,
  hasProducts,
}: ProfileCompletionCardProps) {
  const items = [
    { label: 'Logo', completed: hasLogo },
    { label: 'Descrição', completed: hasDescription },
    { label: 'Categoria', completed: hasCategory },
    { label: 'Fotos', completed: hasPhotos },
    { label: 'Horário', completed: hasSchedule },
    { label: 'Produtos', completed: hasProducts },
  ];

  const completedCount = items.filter(item => item.completed).length;
  const percentage = Math.round((completedCount / items.length) * 100);

  const getEducationalMessage = () => {
    if (percentage === 100) {
      return '✅ Parabéns! Seu perfil está completo e otimizado.';
    }
    if (!hasProducts) {
      return 'Cadastre mais produtos para aparecer mais vezes na busca.';
    }
    if (!hasPhotos) {
      return 'Adicionar mais fotos aumenta a visibilidade da sua empresa.';
    }
    const missing = items.filter(item => !item.completed).map(item => item.label.toLowerCase());
    return `Complete seu perfil adicionando: ${missing.join(', ')}.`;
  };

  return (
    <Card className="border-0 shadow-elevated rounded-2xl">
      <CardContent className="p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className={cn(
              "h-5 w-5",
              percentage === 100 ? 'text-green-500' : 'text-primary'
            )} />
            <span className="font-semibold text-sm">Perfil da empresa completo:</span>
          </div>
          <Badge 
            variant={percentage === 100 ? "default" : "secondary"} 
            className={cn(
              "text-sm",
              percentage === 100 && "bg-green-500"
            )}
          >
            {percentage}%
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
          <div
            className={cn(
              "h-full transition-all duration-500",
              percentage === 100 
                ? "bg-green-500" 
                : "bg-gradient-to-r from-primary to-accent"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Checklist visual */}
        <div className="flex flex-wrap gap-2 mb-3">
          {items.map((item) => (
            <Badge
              key={item.label}
              variant="outline"
              className={cn(
                "text-xs",
                item.completed 
                  ? "bg-green-500/10 text-green-700 border-green-500/20" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {item.completed && <CheckCircle className="h-3 w-3 mr-1" />}
              {item.label}
            </Badge>
          ))}
        </div>

        {/* Educational message */}
        <div className={cn(
          "flex items-start gap-2 text-xs p-2 rounded-lg",
          percentage === 100 
            ? "bg-green-500/10 text-green-700" 
            : "bg-primary/5 text-muted-foreground"
        )}>
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>{getEducationalMessage()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
