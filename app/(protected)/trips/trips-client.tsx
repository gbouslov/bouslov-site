'use client'

import { useState } from 'react'
import { Plane, Calendar, DollarSign, MapPin, ChevronRight } from 'lucide-react'
import { TripsGlobe } from '@/components/trips-globe'
import { TRIPS, type Trip, type ArcData } from '@/lib/trip-data'

function LegCard({ trip, legIndex, isActive }: { trip: Trip; legIndex: number; isActive: boolean }) {
  const leg = trip.legs[legIndex]
  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        isActive
          ? 'bg-white/5 border-white/15'
          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-white">{leg.from.code}</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="font-mono text-sm font-semibold text-white">{leg.to.code}</span>
        </div>
        <span className="font-mono text-xs" style={{ color: trip.color }}>
          ${leg.cost.toFixed(0)}
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{leg.dayOfWeek}, {new Date(leg.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <span>{leg.airline}</span>
        <span className="font-mono">{leg.flightNumber}</span>
      </div>
      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{leg.departTime} &rarr; {leg.arriveTime}</span>
        <span>{leg.duration}</span>
        <span>{leg.stops === 0 ? 'Nonstop' : `${leg.stops} stop${leg.stops > 1 ? 's' : ''}`}</span>
      </div>
      {isActive && (
        <div className="mt-2 pt-2 border-t border-white/[0.06] text-xs text-muted-foreground">
          <span className="font-mono">{leg.confirmation}</span>
          <span className="mx-2">|</span>
          <span>{leg.travelers.join(', ')}</span>
        </div>
      )}
    </div>
  )
}

function TripCard({ trip, isSelected, onSelect }: { trip: Trip; isSelected: boolean; onSelect: () => void }) {
  const totalCost = trip.legs.reduce((sum, leg) => sum + leg.cost, 0)
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isSelected
          ? 'bg-white/5 border-white/15'
          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{trip.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{trip.description}</p>
        </div>
        <div
          className="w-2.5 h-2.5 rounded-full mt-1"
          style={{ backgroundColor: trip.color }}
        />
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(trip.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &ndash; {new Date(trip.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          <span className="font-mono">${totalCost.toFixed(0)}</span>
        </span>
        <span className="flex items-center gap-1">
          <Plane className="w-3 h-3" />
          {trip.legs.length} flights
        </span>
      </div>
      {trip.countries.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5">
          <MapPin className="w-3 h-3 text-muted-foreground" />
          {trip.countries.map(c => (
            <span
              key={c}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${trip.color}15`, color: trip.color, border: `1px solid ${trip.color}30` }}
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}

export function TripsClient() {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(TRIPS[0]?.id || null)
  const [hoveredLeg, setHoveredLeg] = useState<number | null>(null)

  const activeTrip = TRIPS.find(t => t.id === selectedTrip)

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Sidebar */}
      <div className="w-[380px] border-r border-border bg-background overflow-y-auto p-4 flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Trips</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Flight paths and itineraries</p>
        </div>

        {/* Trip selector */}
        <div className="flex flex-col gap-2">
          {TRIPS.map(trip => (
            <TripCard
              key={trip.id}
              trip={trip}
              isSelected={selectedTrip === trip.id}
              onSelect={() => setSelectedTrip(trip.id === selectedTrip ? null : trip.id)}
            />
          ))}
        </div>

        {/* Flight legs */}
        {activeTrip && (
          <div>
            <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
              Flight Legs ({activeTrip.legs.length})
            </h2>
            <div className="flex flex-col gap-1.5">
              {activeTrip.legs.map((_, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredLeg(i)}
                  onMouseLeave={() => setHoveredLeg(null)}
                >
                  <LegCard trip={activeTrip} legIndex={i} isActive={hoveredLeg === i} />
                </div>
              ))}
            </div>

            {/* Cost summary */}
            <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total flights (2 travelers)</span>
                <span className="font-mono text-sm font-semibold" style={{ color: activeTrip.color }}>
                  ${activeTrip.legs.reduce((sum, leg) => sum + leg.cost, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">Per person</span>
                <span className="font-mono text-xs text-muted-foreground">
                  ${(activeTrip.legs.reduce((sum, leg) => sum + leg.cost, 0) / 2).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Globe */}
      <div className="flex-1 relative bg-black">
        <TripsGlobe
          trips={TRIPS}
          selectedTrip={selectedTrip}
          onLegHover={(arc) => {
            if (arc) setHoveredLeg(arc.legIndex)
            else setHoveredLeg(null)
          }}
          onLegClick={(arc) => {
            setSelectedTrip(arc.tripId)
          }}
        />
      </div>
    </div>
  )
}
