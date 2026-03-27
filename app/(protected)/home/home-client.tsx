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
  ArrowRight,
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

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden">
      {/* Top — Title */}
      <div className="text-center shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          The Bouslovs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, {firstName}
        </p>
      </div>

      {/* Middle — Family members flowing naturally */}
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-wrap items-end justify-center gap-x-6 gap-y-2 md:gap-x-10 lg:gap-x-14 max-w-4xl px-4">
          {FAMILY_MEMBERS.map((member, i) => (
            <div
              key={member.email}
              className={cn(
                // Stagger heights for organic feel
                i % 3 === 0 && 'self-end',
                i % 3 === 1 && 'self-start',
                i % 3 === 2 && 'self-center',
              )}
            >
              <FamilyCard member={member} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom — Compact nav links */}
      <div className="shrink-0 flex flex-wrap items-center justify-center gap-2 px-4">
        {FEATURE_LINKS.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm",
                "border border-border bg-card/50",
                "transition-all duration-200",
                "hover:bg-accent hover:-translate-y-0.5"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", link.color)} />
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
