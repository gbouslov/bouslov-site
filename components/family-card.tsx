'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { type FamilyMember, getMemberColors } from '@/lib/family-data'
import { cn } from '@/lib/utils'

interface FamilyCardProps {
  member: FamilyMember
}

export function FamilyCard({ member }: FamilyCardProps) {
  const [imgError, setImgError] = useState(false)
  const colors = getMemberColors(member.color)

  const photoSrc = !imgError && member.photo ? member.photo : null

  return (
    <div className="group flex flex-col items-center text-center w-32 md:w-36 lg:w-40 transition-transform duration-300 hover:-translate-y-1">
      {/* Cutout photo */}
      <div className="relative w-full aspect-square">
        {photoSrc ? (
          <Image
            src={photoSrc}
            alt={member.name}
            width={400}
            height={400}
            className="h-full w-full object-contain object-bottom drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={cn("h-full w-full flex items-center justify-center text-3xl font-bold rounded-full", colors.bg, colors.text)}>
            {member.name[0]}
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-sm font-semibold text-foreground mt-1">{member.name}</span>

      {/* Bio */}
      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">
        {member.bio}
      </p>

      {/* Trait tags */}
      <div className="flex flex-wrap justify-center gap-1 mt-1">
        {member.traits.map((trait) => {
          const Icon = trait.icon
          return (
            <Badge
              key={trait.label}
              variant="outline"
              className={cn(
                "text-[10px] font-normal gap-0.5 py-0 px-1.5 h-[18px]",
                colors.border,
                colors.text,
                "bg-transparent"
              )}
            >
              <Icon className="h-2.5 w-2.5" />
              {trait.label}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
