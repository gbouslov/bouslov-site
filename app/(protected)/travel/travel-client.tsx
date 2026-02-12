'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AddCountryDialog } from '@/components/add-country-dialog'
import { USER_COLORS, USER_NAMES, TextureQuality } from '@/components/travel-globe'
import { cn } from '@/lib/utils'
import { Globe, List, MapPin, Trash2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// Country to continent mapping
const COUNTRY_CONTINENTS: Record<string, string> = {
  // Europe
  'AL': 'Europe', 'AD': 'Europe', 'AT': 'Europe', 'BY': 'Europe', 'BE': 'Europe',
  'BA': 'Europe', 'BG': 'Europe', 'HR': 'Europe', 'CY': 'Europe', 'CZ': 'Europe',
  'DK': 'Europe', 'EE': 'Europe', 'FI': 'Europe', 'FR': 'Europe', 'DE': 'Europe',
  'GR': 'Europe', 'HU': 'Europe', 'IS': 'Europe', 'IE': 'Europe', 'IT': 'Europe',
  'XK': 'Europe', 'LV': 'Europe', 'LI': 'Europe', 'LT': 'Europe', 'LU': 'Europe',
  'MT': 'Europe', 'MD': 'Europe', 'MC': 'Europe', 'ME': 'Europe', 'NL': 'Europe',
  'MK': 'Europe', 'NO': 'Europe', 'PL': 'Europe', 'PT': 'Europe', 'RO': 'Europe',
  'RU': 'Europe', 'SM': 'Europe', 'RS': 'Europe', 'SK': 'Europe', 'SI': 'Europe',
  'ES': 'Europe', 'SE': 'Europe', 'CH': 'Europe', 'UA': 'Europe', 'GB': 'Europe',
  'VA': 'Europe',
  // North America
  'AG': 'North America', 'BS': 'North America', 'BB': 'North America', 'BZ': 'North America',
  'CA': 'North America', 'CR': 'North America', 'CU': 'North America', 'DM': 'North America',
  'DO': 'North America', 'SV': 'North America', 'GD': 'North America', 'GT': 'North America',
  'HT': 'North America', 'HN': 'North America', 'JM': 'North America', 'MX': 'North America',
  'NI': 'North America', 'PA': 'North America', 'KN': 'North America', 'LC': 'North America',
  'VC': 'North America', 'TT': 'North America', 'US': 'North America',
  // South America
  'AR': 'South America', 'BO': 'South America', 'BR': 'South America', 'CL': 'South America',
  'CO': 'South America', 'EC': 'South America', 'GY': 'South America', 'PY': 'South America',
  'PE': 'South America', 'SR': 'South America', 'UY': 'South America', 'VE': 'South America',
  // Asia
  'AF': 'Asia', 'AM': 'Asia', 'AZ': 'Asia', 'BH': 'Asia', 'BD': 'Asia', 'BT': 'Asia',
  'BN': 'Asia', 'KH': 'Asia', 'CN': 'Asia', 'GE': 'Asia', 'IN': 'Asia', 'ID': 'Asia',
  'IR': 'Asia', 'IQ': 'Asia', 'IL': 'Asia', 'JP': 'Asia', 'JO': 'Asia', 'KZ': 'Asia',
  'KW': 'Asia', 'KG': 'Asia', 'LA': 'Asia', 'LB': 'Asia', 'MY': 'Asia', 'MV': 'Asia',
  'MN': 'Asia', 'MM': 'Asia', 'NP': 'Asia', 'KP': 'Asia', 'OM': 'Asia', 'PK': 'Asia',
  'PS': 'Asia', 'PH': 'Asia', 'QA': 'Asia', 'SA': 'Asia', 'SG': 'Asia', 'KR': 'Asia',
  'LK': 'Asia', 'SY': 'Asia', 'TW': 'Asia', 'TJ': 'Asia', 'TH': 'Asia', 'TL': 'Asia',
  'TR': 'Asia', 'TM': 'Asia', 'AE': 'Asia', 'UZ': 'Asia', 'VN': 'Asia', 'YE': 'Asia',
  // Africa
  'DZ': 'Africa', 'AO': 'Africa', 'BJ': 'Africa', 'BW': 'Africa', 'BF': 'Africa',
  'BI': 'Africa', 'CV': 'Africa', 'CM': 'Africa', 'CF': 'Africa', 'TD': 'Africa',
  'KM': 'Africa', 'CG': 'Africa', 'CD': 'Africa', 'CI': 'Africa', 'DJ': 'Africa',
  'EG': 'Africa', 'GQ': 'Africa', 'ER': 'Africa', 'SZ': 'Africa', 'ET': 'Africa',
  'GA': 'Africa', 'GM': 'Africa', 'GH': 'Africa', 'GN': 'Africa', 'GW': 'Africa',
  'KE': 'Africa', 'LS': 'Africa', 'LR': 'Africa', 'LY': 'Africa', 'MG': 'Africa',
  'MW': 'Africa', 'ML': 'Africa', 'MR': 'Africa', 'MU': 'Africa', 'MA': 'Africa',
  'MZ': 'Africa', 'NA': 'Africa', 'NE': 'Africa', 'NG': 'Africa', 'RW': 'Africa',
  'ST': 'Africa', 'SN': 'Africa', 'SC': 'Africa', 'SL': 'Africa', 'SO': 'Africa',
  'ZA': 'Africa', 'SS': 'Africa', 'SD': 'Africa', 'TZ': 'Africa', 'TG': 'Africa',
  'TN': 'Africa', 'UG': 'Africa', 'ZM': 'Africa', 'ZW': 'Africa',
  // Oceania
  'AU': 'Oceania', 'FJ': 'Oceania', 'KI': 'Oceania', 'MH': 'Oceania', 'FM': 'Oceania',
  'NR': 'Oceania', 'NZ': 'Oceania', 'PW': 'Oceania', 'PG': 'Oceania', 'WS': 'Oceania',
  'SB': 'Oceania', 'TO': 'Oceania', 'TV': 'Oceania', 'VU': 'Oceania',
}

const CONTINENT_ORDER = ['Europe', 'North America', 'South America', 'Asia', 'Africa', 'Oceania']

const TravelGlobe = dynamic(
  () => import('@/components/travel-globe').then(mod => mod.TravelGlobe),
  { ssr: false, loading: () => <GlobeLoading /> }
)

function GlobeLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-card/50">
      <div className="w-12 h-12 border-2 border-border border-t-slate-400 rounded-full animate-spin" />
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
  { email: 'bouslovb@gmail.com', name: 'Dad' },
  { email: 'lbouslov@gmail.com', name: 'Mom' },
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Travel</h1>
          <p className="text-muted-foreground mt-1">Countries visited by the Bouslovs</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border border-border rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('globe')}
              className={cn(
                "rounded-none px-3",
                viewMode === 'globe'
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
            "border-border",
            selectedUser === null
              ? "bg-muted text-foreground border-border"
              : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          All
          <Badge variant="secondary" className="ml-2 bg-muted text-foreground/80 text-xs">
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
              "border-border gap-2",
              selectedUser === user.email
                ? "border-border"
                : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
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
            <Badge variant="secondary" className="bg-muted text-foreground/80 text-xs">
              {counts[user.email] || 0}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Hovered Country Info */}
      {hoveredCountry && viewMode === 'globe' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Card className="bg-card/95 border-border backdrop-blur-sm">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">{hoveredCountry.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Visited by: {hoveredCountry.visitors.map(e => USER_NAMES[e] || e).join(', ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Running Total */}
      {viewMode === 'list' && filteredTravels.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          <span className="font-medium text-foreground">{filteredTravels.length}</span>
          <span>countries visited</span>
        </div>
      )}

      {/* Content */}
      {viewMode === 'globe' ? (
        <div className="relative h-[600px] w-full flex items-center justify-center overflow-hidden">
          <TravelGlobe
            travels={filteredTravels}
            selectedUser={selectedUser}
            onCountryHover={setHoveredCountry}
            userEmail={userEmail}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTravels.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {selectedUser
                  ? `${USER_NAMES[selectedUser]} hasn't added any countries yet`
                  : 'No countries have been added yet'}
              </p>
            </div>
          ) : (
            CONTINENT_ORDER.map((continent) => {
              const continentTravels = filteredTravels.filter(
                t => COUNTRY_CONTINENTS[t.country_code] === continent
              )
              if (continentTravels.length === 0) return null

              return (
                <ContinentSection
                  key={continent}
                  continent={continent}
                  travels={continentTravels}
                  userEmail={userEmail}
                  deletingId={deletingId}
                  onDelete={handleDeleteTravel}
                />
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

interface ContinentSectionProps {
  continent: string
  travels: Travel[]
  userEmail: string
  deletingId: string | null
  onDelete: (id: string) => void
}

function ContinentSection({ continent, travels, userEmail, deletingId, onDelete }: ContinentSectionProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full py-3 px-4 rounded-lg bg-card/50 border border-border hover:border-border transition-colors">
          <div className="flex items-center gap-3">
            <span className="font-medium text-foreground">{continent}</span>
            <Badge variant="secondary" className="bg-muted text-foreground/80 text-xs">
              {travels.length}
            </Badge>
          </div>
          <ChevronDown className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {travels.map((travel) => {
            const isOwn = travel.user_email === userEmail
            return (
              <Card key={travel.id} className="bg-card/50 border-border group">
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
                        <p className="font-medium text-foreground">{travel.country_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {USER_NAMES[travel.user_email]}
                        </p>
                      </div>
                    </div>
                    {isOwn && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(travel.id)
                        }}
                        disabled={deletingId === travel.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 hover:bg-muted/50 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
