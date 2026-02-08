'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Pin, PinType } from '@/lib/supabase'
import { PIN_TYPES, USER_COLORS, USER_NAMES } from '@/lib/pins'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PinDetailPanel } from '@/components/pins/pin-detail-panel'
import { AddPinModal } from '@/components/pins/add-pin-modal'
import { cn } from '@/lib/utils'
import { Plus, MapPin, List, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

const PinsGlobe = dynamic(
  () => import('@/components/pins/pins-globe').then(mod => mod.PinsGlobe),
  { ssr: false, loading: () => <GlobeLoading /> }
)

function GlobeLoading() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-card/50">
      <div className="w-12 h-12 border-2 border-border border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
}

interface PinsClientProps {
  initialPins: Pin[]
  userEmail: string
  userName: string
}

const USERS = [
  { email: 'gbouslov@gmail.com', name: 'Gabe' },
  { email: 'dbouslov@gmail.com', name: 'David' },
  { email: 'jbouslov@gmail.com', name: 'Jonathan' },
  { email: 'bouslovd@gmail.com', name: 'Daniel' },
]

export function PinsClient({ initialPins, userEmail, userName }: PinsClientProps) {
  const router = useRouter()
  const [pins, setPins] = useState(initialPins)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [selectedPinType, setSelectedPinType] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'globe' | 'list'>('globe')
  const [hoveredPin, setHoveredPin] = useState<Pin | null>(null)
  
  // Panel & Modal state
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPin, setEditingPin] = useState<Pin | null>(null)
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number } | null>(null)

  const filteredPins = useMemo(() => {
    return pins.filter(pin => {
      if (selectedUser && pin.user_email !== selectedUser) return false
      if (selectedPinType && pin.pin_type !== selectedPinType) return false
      return true
    })
  }, [pins, selectedUser, selectedPinType])

  const pinCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const pin of pins) {
      counts[pin.user_email] = (counts[pin.user_email] || 0) + 1
    }
    return counts
  }, [pins])

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const pin of filteredPins) {
      counts[pin.pin_type] = (counts[pin.pin_type] || 0) + 1
    }
    return counts
  }, [filteredPins])

  const handlePinClick = (pin: Pin) => {
    setSelectedPin(pin)
    setIsPanelOpen(true)
  }

  const handleGlobeClick = (coords: { lat: number; lng: number }) => {
    setClickedLocation(coords)
    setEditingPin(null)
    setIsModalOpen(true)
  }

  const handleAddPin = () => {
    setClickedLocation(null)
    setEditingPin(null)
    setIsModalOpen(true)
  }

  const handleEditPin = (pin: Pin) => {
    setEditingPin(pin)
    setIsPanelOpen(false)
    setIsModalOpen(true)
  }

  const handleDeletePin = async (pin: Pin) => {
    try {
      const res = await fetch(`/api/pins/${pin.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      
      setPins(pins.filter(p => p.id !== pin.id))
      setIsPanelOpen(false)
      setSelectedPin(null)
      toast.success('Pin deleted')
      router.refresh()
    } catch (error) {
      toast.error('Failed to delete pin')
    }
  }

  const handleSavePin = (savedPin: Pin) => {
    if (editingPin) {
      setPins(pins.map(p => p.id === savedPin.id ? savedPin : p))
    } else {
      setPins([savedPin, ...pins])
    }
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Pins</h1>
          <p className="text-muted-foreground mt-1">Places to visit and memories to share</p>
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
          <Button onClick={handleAddPin} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Pin
          </Button>
        </div>
      </div>

      {/* User Filters */}
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
            {pins.length}
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
              {pinCounts[user.email] || 0}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Pin Type Filters */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(PIN_TYPES) as [PinType, typeof PIN_TYPES[PinType]][]).map(
          ([type, config]) => {
            const Icon = config.icon
            const count = typeCounts[type] || 0
            const isSelected = selectedPinType === type

            return (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => setSelectedPinType(isSelected ? null : type)}
                className={cn(
                  "border-border gap-2",
                  isSelected
                    ? "border-border"
                    : "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                style={{
                  backgroundColor: isSelected ? config.bgColor : undefined,
                  borderColor: isSelected ? config.color : undefined,
                  color: isSelected ? config.color : undefined,
                }}
              >
                <Icon className="h-4 w-4" style={{ color: isSelected ? config.color : undefined }} />
                {config.label}
                <Badge
                  variant="secondary"
                  className="bg-muted text-foreground/80 text-xs"
                  style={{ 
                    backgroundColor: isSelected ? config.color + '30' : undefined,
                    color: isSelected ? config.color : undefined,
                  }}
                >
                  {count}
                </Badge>
              </Button>
            )
          }
        )}
      </div>

      {/* Hovered Pin Info */}
      {hoveredPin && viewMode === 'globe' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <Card className="bg-card/95 border-border backdrop-blur-sm">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: PIN_TYPES[hoveredPin.pin_type].bgColor }}
                >
                  {(() => {
                    const Icon = PIN_TYPES[hoveredPin.pin_type].icon
                    return <Icon className="h-4 w-4" style={{ color: PIN_TYPES[hoveredPin.pin_type].color }} />
                  })()}
                </div>
                <div>
                  <p className="font-medium text-foreground">{hoveredPin.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {hoveredPin.user_name} {hoveredPin.location_name && `· ${hoveredPin.location_name}`}
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
          <PinsGlobe
            pins={filteredPins}
            selectedUser={selectedUser}
            selectedPinType={selectedPinType}
            onPinClick={handlePinClick}
            onGlobeClick={handleGlobeClick}
            onPinHover={setHoveredPin}
          />
          <div className="absolute bottom-4 left-4 text-sm text-muted-foreground">
            Click on the globe to add a pin
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPins.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No pins yet</p>
              <Button onClick={handleAddPin} className="mt-4 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add your first pin
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPins.map((pin) => {
                const config = PIN_TYPES[pin.pin_type]
                const Icon = config.icon
                
                return (
                  <Card
                    key={pin.id}
                    className="bg-card/50 border-border hover:border-border transition-colors cursor-pointer group"
                    onClick={() => handlePinClick(pin)}
                  >
                    <CardContent className="p-4">
                      {/* Image preview */}
                      {pin.images && pin.images.length > 0 && (
                        <div className="aspect-video rounded-lg overflow-hidden mb-4 bg-muted">
                          <img
                            src={pin.images[0].url}
                            alt={pin.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: config.bgColor }}
                        >
                          <Icon className="h-5 w-5" style={{ color: config.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">{pin.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {pin.location_name || `${pin.lat.toFixed(2)}, ${pin.lng.toFixed(2)}`}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: USER_COLORS[pin.user_email] }}
                            />
                            <span className="text-xs text-muted-foreground">{pin.user_name}</span>
                            <span className="text-xs text-muted-foreground/60">·</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(pin.created_at), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Pin Detail Panel */}
      {selectedPin && (
        <PinDetailPanel
          pin={selectedPin}
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          onEdit={handleEditPin}
          onDelete={handleDeletePin}
          userEmail={userEmail}
        />
      )}

      {/* Add/Edit Pin Modal */}
      <AddPinModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setClickedLocation(null)
          setEditingPin(null)
        }}
        onSave={handleSavePin}
        editPin={editingPin}
        initialLocation={clickedLocation || undefined}
      />
    </div>
  )
}
