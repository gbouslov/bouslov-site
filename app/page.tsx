'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowRight } from 'lucide-react'

const Globe = dynamic(() => import('@/components/globe').then(mod => ({ default: mod.Globe })), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
})

export default function LandingPage() {
  const { data: session, status } = useSession()

  return (
    <div className="fixed inset-0 bg-[#09090b] overflow-hidden">
      <div className="absolute inset-0">
        <Globe />
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-[#09090b]/50" />
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-between py-12 md:py-20">
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white">
            BOUSLOV
          </h1>
          <p className="text-zinc-500 text-sm tracking-[0.3em] uppercase">
            Connected worldwide
          </p>
        </div>

        <div className="flex-1" />

        <div className="pointer-events-auto animate-fade-in-up">
          {status === 'loading' ? (
            <div className="h-10 w-32 bg-zinc-800/50 rounded-lg animate-pulse" />
          ) : session ? (
            <Link
              href="/leaderboard"
              className="group inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 hover:border-zinc-600/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              Enter
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/50 hover:border-zinc-600/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              Sign In
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>

        <div className="mt-8 flex items-center gap-6 text-zinc-600 text-xs">
          <span>Gabe</span>
          <span className="w-1 h-1 bg-zinc-700 rounded-full" />
          <span>David</span>
          <span className="w-1 h-1 bg-zinc-700 rounded-full" />
          <span>Jonathan</span>
          <span className="w-1 h-1 bg-zinc-700 rounded-full" />
          <span>Daniel</span>
        </div>
      </div>
    </div>
  )
}
