import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export function StarRating({ value, onChange, size = 'md', readOnly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-0.5" onMouseLeave={() => !readOnly && setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            className={cn(
              'transition-colors',
              readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            )}
            onMouseEnter={() => !readOnly && setHovered(star)}
            onClick={() => onChange?.(star)}
          >
            <Star
              className={cn(
                sizeMap[size],
                filled ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

const ratingLabels: Record<number, string> = {
  1: 'Muito ruim',
  2: 'Ruim',
  3: 'Regular',
  4: 'Bom',
  5: 'Excelente',
};

export function RatingLabel({ rating }: { rating: number }) {
  return <span className="text-xs text-muted-foreground">{ratingLabels[rating] || ''}</span>;
}

interface RatingBadgeProps {
  average: number;
  count: number;
  size?: 'sm' | 'md';
}

export function RatingBadge({ average, count, size = 'md' }: RatingBadgeProps) {
  if (count === 0) return null;

  return (
    <div className={cn('flex items-center gap-1', size === 'sm' ? 'text-xs' : 'text-sm')}>
      <Star className={cn('fill-amber-400 text-amber-400', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
      <span className="font-semibold">{average.toFixed(1)}</span>
      <span className="text-muted-foreground">({count})</span>
    </div>
  );
}
