'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { type FamilyMember, getMemberColors } from '@/lib/family-data'
import { cn } from '@/lib/utils'

interface FamilyCardProps {
  member: FamilyMember
  googlePhoto?: string | null
}

export function FamilyCard({ member, googlePhoto }: FamilyCardProps) {
  const [imgError, setImgError] = useState(false)
  const colors = getMemberColors(member.color)

  const photoSrc = !imgError && member.photo ? member.photo : googlePhoto || null

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card overflow-hidden",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-lg",
        colors.glow,
        "hover:border-border/80"
      )}
    >
      {/* Large cover photo */}
      <div className="relative w-full h-48 bg-muted">
        {photoSrc ? (
          <Image
            src={photoSrc}
            alt={member.name}
            fill
            className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={cn("absolute inset-0 flex items-center justify-center text-4xl font-bold", colors.bg, colors.text)}>
            {member.name[0]}
          </div>
        )}
        {/* Gradient overlay at bottom for name readability */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent" />
        {/* Name overlaid on photo */}
        <h3 className="absolute bottom-3 left-4 text-lg font-semibold text-foreground">
          {member.name}
        </h3>
      </div>

      {/* Content below photo */}
      <div className="p-4 space-y-3">
        {/* Bio */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {member.bio}
        </p>

        {/* Trait tags */}
        <div className="flex flex-wrap gap-1.5">
          {member.traits.map((trait) => {
            const Icon = trait.icon
            return (
              <Badge
                key={trait.label}
                variant="outline"
                className={cn(
                  "text-xs font-normal gap-1 py-0.5",
                  colors.border,
                  colors.text,
                  "bg-transparent"
                )}
              >
                <Icon className="h-3 w-3" />
                {trait.label}
              </Badge>
            )
          })}
        </div>
      </div>
    </div>
  )
}
