'use client'

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
} from 'lucide-react'
import { FamilyCard } from '@/components/family-card'
import { FAMILY_MEMBERS } from '@/lib/family-data'
import { cn } from '@/lib/utils'

const FEATURE_LINKS = [
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, color: 'text-amber-400' },
  { href: '/travel', label: 'Travel', icon: Plane, color: 'text-emerald-400' },
  { href: '/pins', label: 'Pins', icon: MapPin, color: 'text-blue-400' },
  { href: '/polls', label: 'Polls', icon: Vote, color: 'text-violet-400' },
  { href: '/wishlists', label: 'Wishlists', icon: Gift, color: 'text-rose-400' },
  { href: '/recommendations', label: 'Recs', icon: ThumbsUp, color: 'text-orange-400' },
  { href: '/tools', label: 'Tools', icon: Zap, color: 'text-cyan-400' },
  { href: '/quicklinks', label: 'Links', icon: Link2, color: 'text-zinc-400' },
]

interface HomeClientProps {
  userName: string
}

export function HomeClient({ userName }: HomeClientProps) {
  const firstName = userName.split(' ')[0]

  // Split family into two rows for a natural arrangement
  const topRow = FAMILY_MEMBERS.slice(0, 4)    // Gabe, David, Jonathan, Daniel
  const bottomRow = FAMILY_MEMBERS.slice(4)     // Dad, Mom

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col gap-4 overflow-hidden">
      {/* Title */}
      <div className="text-center shrink-0 pt-2">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          The Bouslovs
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Welcome back, {firstName}
        </p>
      </div>

      {/* Family — two organic rows */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 min-h-0">
        {/* Row 1: the four brothers */}
        <div className="flex items-start justify-center gap-4 md:gap-8 lg:gap-12">
          {topRow.map((member) => (
            <FamilyCard key={member.email} member={member} />
          ))}
        </div>

        {/* Row 2: parents, centered beneath */}
        <div className="flex items-start justify-center gap-4 md:gap-8 lg:gap-12">
          {bottomRow.map((member) => (
            <FamilyCard key={member.email} member={member} />
          ))}
        </div>
      </div>

      {/* Nav links — compact row */}
      <div className="shrink-0 flex flex-wrap items-center justify-center gap-1.5 px-4 pb-2">
        {FEATURE_LINKS.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs",
                "border border-border bg-card/50",
                "transition-all duration-200",
                "hover:bg-accent hover:-translate-y-0.5"
              )}
            >
              <Icon className={cn("h-3 w-3", link.color)} />
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                {link.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
