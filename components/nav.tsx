'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, User, LogOut, Home, Zap } from 'lucide-react'

export function Nav() {
  const { data: session, status } = useSession()

  return (
    <nav className="border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-6xl">
        <Link
          href="/leaderboard"
          className="flex items-center gap-2 font-semibold text-lg text-white hover:text-zinc-300 transition-colors"
        >
          <Zap className="h-5 w-5 text-blue-500" />
          <span>Bouslov</span>
        </Link>

        <div className="flex items-center gap-3">
          {status === 'loading' ? (
            <div className="h-8 w-8 animate-pulse bg-zinc-800 rounded-full" />
          ) : session ? (
            <>
              <Link href="/submit">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 border-zinc-700 bg-transparent hover:bg-zinc-800 hover:border-zinc-600 text-zinc-300"
                >
                  <Plus className="h-4 w-4" />
                  Log Score
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-zinc-800">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                      <AvatarFallback className="bg-zinc-800 text-zinc-300 text-sm">
                        {session.user?.name?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-56 bg-zinc-900 border-zinc-800" 
                  align="end" 
                  forceMount
                >
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-zinc-100">{session.user?.name}</p>
                      <p className="w-[200px] truncate text-sm text-zinc-500">
                        {session.user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem asChild className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100">
                    <Link href="/leaderboard" className="cursor-pointer">
                      <Home className="mr-2 h-4 w-4" />
                      Leaderboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-zinc-300 focus:bg-zinc-800 focus:text-zinc-100">
                    <Link href={`/profile/${encodeURIComponent(session.user?.email || '')}`} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-400 focus:bg-zinc-800 focus:text-red-400"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white border-0"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
