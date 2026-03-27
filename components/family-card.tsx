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

  const photoSrc = !imgError && member.photo ? member.photo : null

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
      {/* Photo area with subtle gradient background */}
      <div className={cn("relative w-full h-56 flex items-end justify-center", colors.bg)}>
        {/* Radial gradient glow behind person */}
        <div
          className={cn(
            "absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-300"
          )}
          style={{
            background: 'radial-gradient(ellipse at 50% 60%, currentColor 0%, transparent 70%)',
          }}
        />

        {photoSrc ? (
          <Image
            src={photoSrc}
            alt={member.name}
            width={600}
            height={600}
            className="relative z-10 h-full w-auto object-contain object-bottom group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={cn("relative z-10 flex items-center justify-center h-full w-full text-5xl font-bold", colors.text)}>
            {member.name[0]}
          </div>
        )}
      </div>

      {/* Content below photo */}
      <div className="p-4 space-y-3">
        <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>

        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {member.bio}
        </p>

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
