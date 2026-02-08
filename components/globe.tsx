'use client'

import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import * as THREE from 'three'
import { vertexShader, fragmentShader, getSunCoordinates, DAY_TEXTURE, NIGHT_TEXTURE, NIGHT_SKY } from '@/lib/globe-shaders'

const GlobeGL = dynamic(() => import('react-globe.gl').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
})

const FAMILY_MEMBERS = [
  { name: 'Gabe', lat: 40.7128, lng: -74.0060, color: '#3b82f6' },
  { name: 'David', lat: 42.3601, lng: -71.0589, color: '#8b5cf6' },
  { name: 'Jonathan', lat: 33.4484, lng: -112.0740, color: '#06b6d4' },
  { name: 'Daniel', lat: 33.4484, lng: -112.0740, color: '#10b981' },
]

export function Globe() {
  const globeRef = useRef<any>(null)
  const [globeReady, setGlobeReady] = useState(false)
  const [hoveredMember, setHoveredMember] = useState<string | null>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const rotationRef = useRef({ lng: 0, lat: 0 })

  const dayTexture = useMemo(() => new THREE.TextureLoader().load(DAY_TEXTURE), [])
  const nightTexture = useMemo(() => new THREE.TextureLoader().load(NIGHT_TEXTURE), [])

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
    globe.controls().autoRotateSpeed = 0.3
    globe.controls().enableZoom = false
    globe.controls().enableDamping = true
    globe.controls().dampingFactor = 0.05

    globe.pointOfView({ lat: 20, lng: -40, altitude: 2.5 })

    let frameId: number
    const animate = () => {
      if (materialRef.current && globe.controls()) {
        const azimuth = globe.controls().getAzimuthalAngle() * (180 / Math.PI)
        const polar = globe.controls().getPolarAngle() * (180 / Math.PI) - 90
        rotationRef.current = { lng: azimuth, lat: polar }
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

  const pointData = useMemo(() => {
    return FAMILY_MEMBERS.map(m => ({
      ...m,
      size: m.name === hoveredMember ? 0.8 : 0.5,
      altitude: 0.01
    }))
  }, [hoveredMember])

  const arcData = useMemo(() => {
    const arcs: Array<{
      startLat: number
      startLng: number
      endLat: number
      endLng: number
      color: string
    }> = []
    for (let i = 0; i < FAMILY_MEMBERS.length; i++) {
      for (let j = i + 1; j < FAMILY_MEMBERS.length; j++) {
        arcs.push({
          startLat: FAMILY_MEMBERS[i].lat,
          startLng: FAMILY_MEMBERS[i].lng,
          endLat: FAMILY_MEMBERS[j].lat,
          endLng: FAMILY_MEMBERS[j].lng,
          color: 'rgba(59, 130, 246, 0.2)'
        })
      }
    }
    return arcs
  }, [])

  const handlePointHover = useCallback((point: any) => {
    setHoveredMember(point?.name || null)
  }, [])

  return (
    <div className="w-full h-full relative">
      <GlobeGL
        ref={globeRef}
        onGlobeReady={() => setGlobeReady(true)}
        globeMaterial={createGlobeMaterial()}
        backgroundColor="rgba(0,0,0,0)"
        backgroundImageUrl={NIGHT_SKY}
        atmosphereColor="#3b82f6"
        atmosphereAltitude={0.15}
        pointsData={pointData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointRadius="size"
        pointAltitude="altitude"
        pointLabel={(d: any) => `<div style="background: rgba(9, 9, 11, 0.95); border: 1px solid rgba(63, 63, 70, 0.8); padding: 6px 12px; border-radius: 8px; backdrop-filter: blur(8px); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); color: white; font-size: 14px; white-space: nowrap;">${d.name}</div>`}
        onPointHover={handlePointHover}
        arcsData={arcData}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcAltitude={0.15}
        arcStroke={0.5}
        arcDashLength={0.5}
        arcDashGap={0.2}
        arcDashAnimateTime={2000}
        width={typeof window !== 'undefined' ? window.innerWidth : 800}
        height={typeof window !== 'undefined' ? window.innerHeight : 600}
      />
    </div>
  )
}
