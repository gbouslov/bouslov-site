'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Trophy,
  Plane,
  MapPin,
  Gift,
  Vote,
  ThumbsUp,
  Zap,
  Link2,
  ArrowRight,
} from 'lucide-react'
import { PhotoCarousel } from '@/components/photo-carousel'
import { FamilyCard } from '@/components/family-card'
import { FAMILY_MEMBERS } from '@/lib/family-data'
import { cn } from '@/lib/utils'

const FEATURE_LINKS = [
  {
    href: '/leaderboard',
    label: 'Leaderboard',
    description: 'Scores and rankings',
    icon: Trophy,
    color: 'text-amber-400',
  },
  {
    href: '/travel',
    label: 'Travel',
    description: 'Countries and states',
    icon: Plane,
    color: 'text-emerald-400',
  },
  {
    href: '/pins',
    label: 'Pins',
    description: 'Saved places',
    icon: MapPin,
    color: 'text-blue-400',
  },
  {
    href: '/polls',
    label: 'Polls',
    description: 'Family votes',
    icon: Vote,
    color: 'text-violet-400',
  },
  {
    href: '/wishlists',
    label: 'Wishlists',
    description: 'Gift ideas',
    icon: Gift,
    color: 'text-rose-400',
  },
  {
    href: '/recommendations',
    label: 'Recs',
    description: 'Shared favorites',
    icon: ThumbsUp,
    color: 'text-orange-400',
  },
  {
    href: '/tools',
    label: 'Tools',
    description: 'AI and utilities',
    icon: Zap,
    color: 'text-cyan-400',
  },
  {
    href: '/quicklinks',
    label: 'Quicklinks',
    description: 'Bookmarks',
    icon: Link2,
    color: 'text-zinc-400',
  },
]

// Scan for carousel photos in public/family/carousel/
// Since we can't read the filesystem at runtime in a client component,
// we use a static list that David can update as he adds photos.
const CAROUSEL_PHOTOS: string[] = [
  // Add paths here as photos are dropped in:
  // '/family/carousel/photo1.jpg',
  // '/family/carousel/photo2.jpg',
]

interface HomeClientProps {
  userName: string
}

export function HomeClient({ userName }: HomeClientProps) {
  const firstName = userName.split(' ')[0]

  return (
    <div className="space-y-10 pb-8">
      {/* Hero Section */}
      <PhotoCarousel photos={CAROUSEL_PHOTOS} />

      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Welcome back, {firstName}
        </h2>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what the family is up to.
        </p>
      </div>

      {/* Family Members */}
      <section>
        <h3 className="text-lg font-medium text-foreground mb-4">Family</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FAMILY_MEMBERS.map((member) => (
            <FamilyCard key={member.email} member={member} />
          ))}
        </div>
      </section>

      {/* Feature Navigation */}
      <section>
        <h3 className="text-lg font-medium text-foreground mb-4">Explore</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {FEATURE_LINKS.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "group flex flex-col gap-2 rounded-xl border border-border bg-card p-4",
                  "transition-all duration-200",
                  "hover:bg-accent hover:border-border/80 hover:-translate-y-0.5"
                )}
              >
                <Icon className={cn("h-5 w-5", link.color)} />
                <div>
                  <p className="text-sm font-medium text-foreground flex items-center gap-1">
                    {link.label}
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-200" />
                  </p>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
