'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

  // Use local photo first, fall back to Google profile pic, then initials
  const photoSrc = !imgError && member.photo ? member.photo : googlePhoto || null

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border bg-card p-5",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-lg",
        colors.glow,
        "hover:border-border/80"
      )}
    >
      {/* Subtle top accent line */}
      <div
        className={cn(
          "absolute top-0 left-4 right-4 h-px",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          colors.bg
        )}
      />

      <div className="flex flex-col items-center text-center gap-3">
        {/* Photo */}
        <Avatar className="h-20 w-20 ring-2 ring-border group-hover:ring-border/60 transition-all duration-300">
          {photoSrc ? (
            <AvatarImage
              src={photoSrc}
              alt={member.name}
              onError={() => setImgError(true)}
            />
          ) : null}
          <AvatarFallback className={cn("text-lg font-semibold", colors.bg, colors.text)}>
            {member.name[0]}
          </AvatarFallback>
        </Avatar>

        {/* Name */}
        <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>

        {/* Bio */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {member.bio}
        </p>

        {/* Trait tags */}
        <div className="flex flex-wrap justify-center gap-1.5 mt-1">
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
