'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Trophy,
  Plane,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  Plus,
  Link2,
  MapPin,
} from 'lucide-react'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/travel', label: 'Travel', icon: Plane },
  { href: '/pins', label: 'Pins', icon: MapPin },
  { href: '/quicklinks', label: 'Quicklinks', icon: Link2 },
  { href: '/stats', label: 'Stats', icon: BarChart3, disabled: true },
  { href: '/settings', label: 'Settings', icon: Settings, disabled: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (status === 'loading') {
    return (
      <aside className={cn(
        "h-screen bg-zinc-900/50 border-r border-zinc-800/50 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex-1 animate-pulse" />
      </aside>
    )
  }

  return (
    <aside
      className={cn(
        "h-screen bg-zinc-900/50 border-r border-zinc-800/50 flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn(
        "h-14 flex items-center border-b border-zinc-800/50 px-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link
            href="/leaderboard"
            className="flex items-center gap-2 font-semibold text-lg text-white hover:text-zinc-300 transition-colors"
          >
            <Zap className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <span>Bouslov</span>
          </Link>
        )}
        {collapsed && (
          <Zap className="h-5 w-5 text-blue-500" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          if (item.disabled) {
            return (
              <div
                key={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-600 cursor-not-allowed",
                  collapsed && "justify-center px-2"
                )}
                title={collapsed ? `${item.label} (Coming soon)` : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="ml-auto text-xs text-zinc-700">Soon</span>
                  </>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Quick Action */}
      <div className="px-3 pb-3">
        <Link href="/submit">
          <Button
            variant="outline"
            className={cn(
              "w-full border-zinc-700 bg-transparent hover:bg-zinc-800 hover:border-zinc-600 text-zinc-300",
              collapsed ? "px-2" : "gap-2"
            )}
          >
            <Plus className="h-4 w-4" />
            {!collapsed && <span>Log Score</span>}
          </Button>
        </Link>
      </div>

      {/* User Section */}
      {session && (
        <div className="border-t border-zinc-800/50 p-3">
          <div className={cn(
            "flex items-center gap-3",
            collapsed && "justify-center"
          )}>
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
              <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs">
                {session.user?.name?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-100 truncate">
                  {session.user?.name}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {session.user?.email}
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 justify-start gap-2"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          )}
        </div>
      )}

      {/* Collapse Toggle */}
      {!isMobile && (
        <div className="border-t border-zinc-800/50 p-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50",
              collapsed ? "justify-center" : "justify-end"
            )}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </aside>
  )
}
