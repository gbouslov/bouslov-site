'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddCountryDialog } from '@/components/add-country-dialog'
import { USER_COLORS, USER_NAMES } from '@/components/travel-globe'
import { cn } from '@/lib/utils'
import { Globe, List, MapPin, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const TravelGlobe = dynamic(
  () => import('@/components/travel-globe').then(mod => mod.TravelGlobe),
  { ssr: false, loading: () => <GlobeLoading /> }
)

function GlobeLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
      <div className="w-12 h-12 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
}

interface Travel {
  id: string
  country_code: string
  country_name: string
  user_email: string
  visited_at: string
}

interface TravelClientProps {
  initialTravels: Travel[]
  initialCounts: Record<string, number>
  userEmail: string
}

const USERS = [
  { email: 'gbouslov@gmail.com', name: 'Gabe' },
  { email: 'dbouslov@gmail.com', name: 'David' },
  { email: 'jbouslov@gmail.com', name: 'Jonathan' },
  { email: 'bouslovd@gmail.com', name: 'Daniel' },
]

export function TravelClient({ initialTravels, initialCounts, userEmail }: TravelClientProps) {
  const router = useRouter()
  const [travels, setTravels] = useState(initialTravels)
  const [counts, setCounts] = useState(initialCounts)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'globe' | 'list'>('globe')
  const [hoveredCountry, setHoveredCountry] = useState<{ name: string; visitors: string[] } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const filteredTravels = useMemo(() => {
    if (!selectedUser) return travels
    return travels.filter(t => t.user_email === selectedUser)
  }, [travels, selectedUser])

  const userTravels = useMemo(() => {
    return travels.filter(t => t.user_email === userEmail)
  }, [travels, userEmail])

  const existingCountries = useMemo(() => {
    return userTravels.map(t => t.country_code)
  }, [userTravels])

  const handleAddCountry = async (countryCode: string, countryName: string) => {
    const res = await fetch('/api/travels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country_code: countryCode, country_name: countryName }),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Failed to add country')
    }

    const newTravel = await res.json()
    setTravels(prev => [...prev, newTravel])
    setCounts(prev => ({
      ...prev,
      [userEmail]: (prev[userEmail] || 0) + 1,
    }))
    router.refresh()
  }

  const handleDeleteTravel = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/travels?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')

      const deleted = travels.find(t => t.id === id)
      setTravels(prev => prev.filter(t => t.id !== id))
      if (deleted) {
        setCounts(prev => ({
          ...prev,
          [deleted.user_email]: Math.max(0, (prev[deleted.user_email] || 1) - 1),
        }))
      }
      toast.success('Country removed')
      router.refresh()
    } catch {
      toast.error('Failed to remove country')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Travel</h1>
          <p className="text-zinc-400 mt-1">Countries visited by the Bouslovs</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-zinc-800 rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('globe')}
              className={cn(
                "rounded-none px-3",
                viewMode === 'globe'
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              <Globe className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={cn(
                "rounded-none px-3",
                viewMode === 'list'
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <AddCountryDialog existingCountries={existingCountries} onAdd={handleAddCountry} />
        </div>
      </div>

      {/* User Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedUser(null)}
          className={cn(
            "border-zinc-700",
            selectedUser === null
              ? "bg-zinc-800 text-white border-zinc-600"
              : "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/50"
          )}
        >
          All
          <Badge variant="secondary" className="ml-2 bg-zinc-700 text-zinc-300 text-xs">
            {travels.length}
          </Badge>
        </Button>
        {USERS.map(user => (
          <Button
            key={user.email}
            variant="outline"
            size="sm"
            onClick={() => setSelectedUser(selectedUser === user.email ? null : user.email)}
            className={cn(
              "border-zinc-700 gap-2",
              selectedUser === user.email
                ? "border-zinc-600"
                : "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/50"
            )}
            style={{
              backgroundColor: selectedUser === user.email ? USER_COLORS[user.email] + '20' : undefined,
              borderColor: selectedUser === user.email ? USER_COLORS[user.email] : undefined,
              color: selectedUser === user.email ? USER_COLORS[user.email] : undefined,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: USER_COLORS[user.email] }}
            />
            {user.name}
            <Badge variant="secondary" className="bg-zinc-700 text-zinc-300 text-xs">
              {counts[user.email] || 0}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Hovered Country Info */}
      {hoveredCountry && viewMode === 'globe' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Card className="bg-zinc-900/95 border-zinc-700 backdrop-blur-sm">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-zinc-400" />
                <div>
                  <p className="font-medium text-white">{hoveredCountry.name}</p>
                  <p className="text-xs text-zinc-400">
                    Visited by: {hoveredCountry.visitors.map(e => USER_NAMES[e] || e).join(', ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content */}
      {viewMode === 'globe' ? (
        <div className="relative h-[600px] -mx-4 md:-mx-8 lg:-mx-16">
          <TravelGlobe
            travels={filteredTravels}
            selectedUser={selectedUser}
            onCountryHover={setHoveredCountry}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTravels.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <MapPin className="h-12 w-12 mx-auto text-zinc-700 mb-4" />
              <p className="text-zinc-400">
                {selectedUser
                  ? `${USER_NAMES[selectedUser]} hasn't added any countries yet`
                  : 'No countries have been added yet'}
              </p>
            </div>
          ) : (
            filteredTravels.map((travel) => {
              const isOwn = travel.user_email === userEmail
              return (
                <Card key={travel.id} className="bg-zinc-900/50 border-zinc-800 group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                          style={{
                            backgroundColor: USER_COLORS[travel.user_email] + '20',
                            color: USER_COLORS[travel.user_email],
                          }}
                        >
                          {travel.country_code}
                        </div>
                        <div>
                          <p className="font-medium text-white">{travel.country_name}</p>
                          <p className="text-xs text-zinc-500">
                            {USER_NAMES[travel.user_email]}
                          </p>
                        </div>
                      </div>
                      {isOwn && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTravel(travel.id)}
                          disabled={deletingId === travel.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-red-400 hover:bg-zinc-800/50 h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
