'use client'

import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import * as THREE from 'three'
import { Pin } from '@/lib/supabase'
import { PIN_TYPES, USER_COLORS } from '@/lib/pins'
import { vertexShader, fragmentShader, getSunCoordinates, DAY_TEXTURE, NIGHT_TEXTURE, NIGHT_SKY } from '@/lib/globe-shaders'
import { useGlobeResize } from '@/hooks/use-globe-resize'

const GlobeGL = dynamic(() => import('react-globe.gl').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-border border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
})

interface PinsGlobeProps {
  pins: Pin[]
  selectedUser: string | null
  selectedPinType: string | null
  onPinClick: (pin: Pin) => void
  onGlobeClick: (coords: { lat: number; lng: number }) => void
  onPinHover?: (pin: Pin | null) => void
}

export function PinsGlobe({
  pins,
  selectedUser,
  selectedPinType,
  onPinClick,
  onGlobeClick,
  onPinHover,
}: PinsGlobeProps) {
  const globeRef = useRef<any>(null)
  const [globeReady, setGlobeReady] = useState(false)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const { containerRef, dimensions } = useGlobeResize()

  const dayTexture = useMemo(() => new THREE.TextureLoader().load(DAY_TEXTURE), [])
  const nightTexture = useMemo(() => new THREE.TextureLoader().load(NIGHT_TEXTURE), [])

  // Filter pins based on selection
  const filteredPins = useMemo(() => {
    return pins.filter(pin => {
      if (selectedUser && pin.user_email !== selectedUser) return false
      if (selectedPinType && pin.pin_type !== selectedPinType) return false
      return true
    })
  }, [pins, selectedUser, selectedPinType])

  const createGlobeMaterial = useCallback(() => {
    const sunCoords = getSunCoordinates()
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

  useEffect(() => {
    if (!globeRef.current) return

    const globe = globeRef.current

    globe.controls().autoRotate = true
    globe.controls().autoRotateSpeed = 0.15
    globe.controls().enableZoom = true
    globe.controls().minDistance = 150
    globe.controls().maxDistance = 500
    globe.controls().enableDamping = true
    globe.controls().dampingFactor = 0.12
    globe.controls().rotateSpeed = 1.2

    globe.pointOfView({ lat: 20, lng: -40, altitude: 2.5 })

    let frameId: number
    const animate = () => {
      if (materialRef.current && globe.controls()) {
        const azimuth = globe.controls().getAzimuthalAngle() * (180 / Math.PI)
        const polar = globe.controls().getPolarAngle() * (180 / Math.PI) - 90
        materialRef.current.uniforms.globeRotation.value.set(azimuth, polar)

        const sunCoords = getSunCoordinates()
        materialRef.current.uniforms.sunPosition.value.set(sunCoords.lng, sunCoords.lat)

        globe.controls().update()
      }
      frameId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [globeReady])

  // Point color based on pin type
  const getPointColor = useCallback((d: object) => {
    const pin = d as Pin
    return PIN_TYPES[pin.pin_type]?.color || '#3b82f6'
  }, [])

  // Point label (tooltip)
  const getPointLabel = useCallback((d: object) => {
    const pin = d as Pin
    const config = PIN_TYPES[pin.pin_type]
    return `
      <div style="
        background: rgba(9, 9, 11, 0.95);
        border: 1px solid rgba(63, 63, 70, 0.8);
        padding: 8px 12px;
        border-radius: 8px;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        max-width: 200px;
      ">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <div style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${config?.color || '#3b82f6'};
          "></div>
          <span style="font-weight: 600; color: white; font-size: 14px;">${pin.title}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: ${USER_COLORS[pin.user_email] || '#3b82f6'};
          "></div>
          <span style="color: #a1a1aa; font-size: 12px;">${pin.user_name}</span>
        </div>
      </div>
    `
  }, [])

  const handlePointClick = useCallback((point: object) => {
    const pin = point as Pin
    onPinClick(pin)
  }, [onPinClick])

  const handlePointHover = useCallback((point: object | null) => {
    onPinHover?.(point as Pin | null)
  }, [onPinHover])

  const handleGlobeClickEvent = useCallback((coords: { lat: number; lng: number } | null) => {
    if (coords) {
      onGlobeClick(coords)
    }
  }, [onGlobeClick])

  return (
    <div ref={containerRef} className="w-full h-full relative flex items-center justify-center">
      <GlobeGL
        ref={globeRef}
        onGlobeReady={() => setGlobeReady(true)}
        globeMaterial={createGlobeMaterial()}
        backgroundColor="rgba(0,0,0,0)"
        backgroundImageUrl={NIGHT_SKY}
        atmosphereColor="#3b82f6"
        atmosphereAltitude={0.15}
        pointsData={filteredPins}
        pointLat={(d: object) => (d as Pin).lat}
        pointLng={(d: object) => (d as Pin).lng}
        pointAltitude={0.01}
        pointRadius={0.5}
        pointColor={getPointColor}
        pointLabel={getPointLabel}
        onPointClick={handlePointClick}
        onPointHover={handlePointHover}
        onGlobeClick={handleGlobeClickEvent}
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  )
}
