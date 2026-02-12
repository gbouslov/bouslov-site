'use client'

import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import * as THREE from 'three'
import { vertexShader, fragmentShader, getCachedSunCoordinates, DAY_TEXTURE, NIGHT_TEXTURE, NIGHT_SKY } from '@/lib/globe-shaders'
import { useGlobeResize } from '@/hooks/use-globe-resize'

const GlobeGL = dynamic(() => import('react-globe.gl').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-border border-t-slate-400 rounded-full animate-spin" />
    </div>
  )
})

export type TextureQuality = 'low' | 'medium' | 'high'

const COUNTRIES_GEOJSON = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'

export const USER_COLORS: Record<string, string> = {
  'gbouslov@gmail.com': '#f97316',  // Gabe - orange
  'dbouslov@gmail.com': '#a78bfa',  // David - violet
  'jbouslov@gmail.com': '#22d3ee',  // Jonathan - cyan
  'bouslovd@gmail.com': '#34d399',  // Daniel - emerald
  'bouslovb@gmail.com': '#fbbf24',  // Dad - amber
  'lbouslov@gmail.com': '#f472b6',  // Mom - pink
}

export const USER_NAMES: Record<string, string> = {
  'gbouslov@gmail.com': 'Gabe',
  'dbouslov@gmail.com': 'David',
  'jbouslov@gmail.com': 'Jonathan',
  'bouslovb@gmail.com': 'Dad',
  'lbouslov@gmail.com': 'Mom',
  'bouslovd@gmail.com': 'Daniel',
}

interface Travel {
  country_code: string
  country_name: string
  user_email: string
}

interface TravelGlobeProps {
  travels: Travel[]
  selectedUser: string | null
  onCountryHover?: (country: { name: string; visitors: string[] } | null) => void
  onCountryClick?: (countryCode: string, countryName: string) => void
  quality?: TextureQuality
  userEmail?: string
}

export function TravelGlobe({
  travels,
  selectedUser,
  onCountryHover,
  onCountryClick,
  userEmail
}: TravelGlobeProps) {
  const globeRef = useRef<any>(null)
  const [globeReady, setGlobeReady] = useState(false)
  const [countries, setCountries] = useState<any[]>([])
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const { containerRef, dimensions } = useGlobeResize()

  const dayTexture = useMemo(() => new THREE.TextureLoader().load(DAY_TEXTURE), [])
  const nightTexture = useMemo(() => new THREE.TextureLoader().load(NIGHT_TEXTURE), [])

  // Load GeoJSON
  useEffect(() => {
    fetch(COUNTRIES_GEOJSON)
      .then(res => res.json())
      .then(data => {
        setCountries(data.features)
      })
      .catch(err => console.error('Failed to load countries:', err))
  }, [])

  // Build lookup of visited countries
  const visitedCountries = useMemo(() => {
    const visited: Record<string, string[]> = {}
    for (const travel of travels) {
      if (selectedUser && travel.user_email !== selectedUser) continue
      if (!visited[travel.country_code]) {
        visited[travel.country_code] = []
      }
      if (!visited[travel.country_code].includes(travel.user_email)) {
        visited[travel.country_code].push(travel.user_email)
      }
    }
    return visited
  }, [travels, selectedUser])

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

  useEffect(() => {
    if (!globeRef.current) return

    const globe = globeRef.current

    globe.controls().autoRotate = true
    globe.controls().autoRotateSpeed = 0.2
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

        const sunCoords = getCachedSunCoordinates()
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

  // Filter countries to only show visited ones as polygons
  const polygonData = useMemo(() => {
    if (!countries.length) return []

    return countries.filter(country => {
      const isoCode = country.properties['ISO3166-1-Alpha-2']
      return visitedCountries[isoCode]
    }).map(country => ({
      ...country,
      visitors: visitedCountries[country.properties['ISO3166-1-Alpha-2']] || []
    }))
  }, [countries, visitedCountries])

  const getPolygonColor = useCallback((d: any) => {
    const visitors = d.visitors || []
    if (visitors.length === 0) return 'rgba(0,0,0,0)'

    if (selectedUser) {
      return USER_COLORS[selectedUser] || '#f97316'
    }

    if (visitors.length === 1) {
      return USER_COLORS[visitors[0]] || '#f97316'
    }

    // Multiple visitors
    return '#ffffff'
  }, [selectedUser])

  const handlePolygonHover = useCallback((polygon: any) => {
    if (onCountryHover) {
      if (polygon) {
        onCountryHover({
          name: polygon.properties.name,
          visitors: polygon.visitors || []
        })
      } else {
        onCountryHover(null)
      }
    }
  }, [onCountryHover])

  const handlePolygonClick = useCallback((polygon: any) => {
    if (onCountryClick && polygon) {
      onCountryClick(polygon.properties['ISO3166-1-Alpha-2'], polygon.properties.name)
    }
  }, [onCountryClick])

  const polygonLabel = useCallback((d: any) => {
    const visitors = d.visitors || []
    const names = visitors.map((email: string) => USER_NAMES[email] || email).join(', ')
    return `<div style="background: rgba(9, 9, 11, 0.95); border: 1px solid rgba(63, 63, 70, 0.8); padding: 8px 12px; border-radius: 8px; backdrop-filter: blur(8px); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);">
      <div style="font-weight: 500; color: white; font-size: 14px;">${d.properties.name}</div>
      <div style="color: #a1a1aa; font-size: 12px; margin-top: 4px;">Visited by: ${names}</div>
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
        atmosphereColor="#f97316"
        atmosphereAltitude={0.12}
        polygonsData={polygonData}
        polygonAltitude={0.01}
        polygonCapColor={getPolygonColor}
        polygonSideColor={() => 'rgba(0,0,0,0.3)'}
        polygonLabel={polygonLabel}
        onPolygonHover={handlePolygonHover}
        onPolygonClick={handlePolygonClick}
        polygonsTransitionDuration={0}
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  )
}
