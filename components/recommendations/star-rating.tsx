'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  onChange?: (rating: number) => void
  size?: 'sm' | 'md'
}

export function StarRating({ rating, onChange, size = 'md' }: StarRatingProps) {
  const interactive = !!onChange
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5'

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(value)}
          className={cn(
            'transition-colors',
            interactive && 'cursor-pointer hover:scale-110',
            !interactive && 'cursor-default'
          )}
        >
          <Star
            className={cn(
              iconSize,
              value <= rating
                ? 'fill-yellow-500 text-yellow-500'
                : 'fill-none text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  )
}
