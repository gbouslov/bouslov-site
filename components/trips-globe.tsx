'use client'

import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import * as THREE from 'three'
import { vertexShader, fragmentShader, getCachedSunCoordinates, DAY_TEXTURE, DAY_TEXTURE_LOW, NIGHT_TEXTURE, NIGHT_TEXTURE_LOW, NIGHT_SKY } from '@/lib/globe-shaders'
import { useGlobeResize } from '@/hooks/use-globe-resize'
import { type Trip, type ArcData, getArcsFromTrips } from '@/lib/trip-data'

const GlobeGL = dynamic(() => import('react-globe.gl').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-border border-t-slate-400 rounded-full animate-spin" />
    </div>
  )
})

interface TripsGlobeProps {
  trips: Trip[]
  selectedTrip: string | null
  onLegHover?: (leg: ArcData | null) => void
  onLegClick?: (leg: ArcData) => void
}

export function TripsGlobe({ trips, selectedTrip, onLegHover, onLegClick }: TripsGlobeProps) {
  const globeRef = useRef<any>(null)
  const [globeReady, setGlobeReady] = useState(false)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const { containerRef, dimensions } = useGlobeResize()

  const dayTexture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const tex = loader.load(DAY_TEXTURE_LOW)
    loader.load(DAY_TEXTURE, (hd) => { tex.image = hd.image; tex.needsUpdate = true })
    return tex
  }, [])
  const nightTexture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const tex = loader.load(NIGHT_TEXTURE_LOW)
    loader.load(NIGHT_TEXTURE, (hd) => { tex.image = hd.image; tex.needsUpdate = true })
    return tex
  }, [])

  const createGlobeMaterial = useCallback(() => {
    const sunCoords = getCachedSunCoordinates()
    const material = new THREE.ShaderMaterial({
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        sunPosition: { value: new THREE.Vector2(sunCoords.lng, sunCoords.lat) },
        globeRotation: { value: new THREE.Vector2(0, 0) }
      },
      vertexShader,
      fragmentShader,
    })
    materialRef.current = material
    return material
  }, [dayTexture, nightTexture])

  // Globe controls setup
  useEffect(() => {
    if (!globeRef.current) return
    const globe = globeRef.current

    globe.controls().autoRotate = false
    globe.controls().enableZoom = true
    globe.controls().minDistance = 120
    globe.controls().maxDistance = 600
    globe.controls().enableDamping = true
    globe.controls().dampingFactor = 0.12
    globe.controls().rotateSpeed = 1.2

    // Center on the Caribbean for the initial trip
    globe.pointOfView({ lat: 25, lng: -70, altitude: 2.2 }, 1000)

    let frameId: number
    const animate = () => {
      if (materialRef.current && globe.controls()) {
        const azimuth = globe.controls().getAzimuthalAngle() * (180 / Math.PI)
        const polar = globe.controls().getPolarAngle() * (180 / Math.PI) - 90
        materialRef.current.uniforms.globeRotation.value.set(azimuth, polar)
        const sunCoords = getCachedSunCoordinates()
        materialRef.current.uniforms.sunPosition.value.set(sunCoords.lng, sunCoords.lat)
        globe.controls().update()
      }
      frameId = requestAnimationFrame(animate)
    }
    animate()
    return () => { if (frameId) cancelAnimationFrame(frameId) }
  }, [globeReady])

  // Build arc data
  const arcs = useMemo(() => {
    const filtered = selectedTrip
      ? trips.filter(t => t.id === selectedTrip)
      : trips
    return getArcsFromTrips(filtered)
  }, [trips, selectedTrip])

  // Build point data (airports)
  const points = useMemo(() => {
    const filtered = selectedTrip
      ? trips.filter(t => t.id === selectedTrip)
      : trips
    const seen = new Set<string>()
    const pts: { lat: number; lng: number; code: string; city: string; color: string; size: number }[] = []
    for (const trip of filtered) {
      for (const leg of trip.legs) {
        for (const airport of [leg.from, leg.to]) {
          if (!seen.has(airport.code)) {
            seen.add(airport.code)
            pts.push({
              lat: airport.lat,
              lng: airport.lng,
              code: airport.code,
              city: airport.city,
              color: trip.color,
              size: airport.code === 'ORD' ? 0.6 : 0.4,
            })
          }
        }
      }
    }
    return pts
  }, [trips, selectedTrip])

  // Arc tooltip
  const arcLabel = useCallback((d: any) => {
    const arc = d as ArcData
    const trip = trips.find(t => t.id === arc.tripId)
    const leg = trip?.legs[arc.legIndex]
    if (!leg) return ''
    return `<div style="background:rgba(9,9,11,0.95);border:1px solid rgba(63,63,70,0.8);padding:10px 14px;border-radius:8px;backdrop-filter:blur(8px);box-shadow:0 4px 20px rgba(0,0,0,0.5);max-width:280px;">
      <div style="font-weight:600;color:white;font-size:13px;">${leg.from.code} &rarr; ${leg.to.code}</div>
      <div style="color:#a1a1aa;font-size:11px;margin-top:3px;">${leg.airline} ${leg.flightNumber}</div>
      <div style="color:#a1a1aa;font-size:11px;">${leg.dayOfWeek}, ${new Date(leg.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &middot; ${leg.departTime} &rarr; ${leg.arriveTime}</div>
      <div style="color:#a1a1aa;font-size:11px;">${leg.duration} &middot; ${leg.stops === 0 ? 'Nonstop' : leg.stops + ' stop' + (leg.stops > 1 ? 's' : '') + (leg.stopCity ? ' (' + leg.stopCity + ')' : '')}</div>
      <div style="color:${arc.color};font-size:12px;font-weight:500;margin-top:4px;">$${leg.cost.toFixed(0)} for 2</div>
    </div>`
  }, [trips])

  // Point tooltip
  const pointLabel = useCallback((d: any) => {
    return `<div style="background:rgba(9,9,11,0.95);border:1px solid rgba(63,63,70,0.8);padding:6px 10px;border-radius:6px;backdrop-filter:blur(8px);">
      <span style="font-weight:600;color:white;font-size:13px;font-family:monospace;">${d.code}</span>
      <span style="color:#a1a1aa;font-size:11px;margin-left:6px;">${d.city}</span>
    </div>`
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full relative flex items-center justify-center">
      <GlobeGL
        ref={globeRef}
        onGlobeReady={() => setGlobeReady(true)}
        globeMaterial={createGlobeMaterial()}
        backgroundColor="rgba(0,0,0,0)"
        backgroundImageUrl={NIGHT_SKY}
        atmosphereColor="#34d399"
        atmosphereAltitude={0.12}
        // Arcs (flight paths)
        arcsData={arcs}
        arcColor={(d: any) => d.color}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={2500}
        arcStroke={0.5}
        arcLabel={arcLabel}
        arcAltitudeAutoScale={0.4}
        onArcHover={(arc: any) => onLegHover?.(arc)}
        onArcClick={(arc: any) => onLegClick?.(arc)}
        arcsTransitionDuration={800}
        // Points (airports)
        pointsData={points}
        pointColor={(d: any) => d.color}
        pointAltitude={0.01}
        pointRadius={(d: any) => d.size}
        pointLabel={pointLabel}
        // Globe
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  )
}
