'use client'

import { useState } from 'react'
import Image from 'next/image'
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
    <div className="group flex flex-col items-center gap-1 transition-transform duration-300 hover:-translate-y-1">
      {/* Cutout photo */}
      <div className="relative h-36 md:h-44 lg:h-52 aspect-square">
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
          <div className={cn("h-full w-full flex items-center justify-center text-4xl font-bold rounded-full", colors.bg, colors.text)}>
            {member.name[0]}
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-sm font-semibold text-foreground">{member.name}</span>
    </div>
  )
}
