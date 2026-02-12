'use client'

import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import * as THREE from 'three'
import { vertexShader, fragmentShader, getSunCoordinates, NIGHT_SKY } from '@/lib/globe-shaders'
import { useGlobeResize } from '@/hooks/use-globe-resize'

const GlobeGL = dynamic(() => import('react-globe.gl').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-border border-t-slate-400 rounded-full animate-spin" />
    </div>
  )
})

// Texture quality levels
export type TextureQuality = 'low' | 'medium' | 'high'

const TEXTURES = {
  low: {
    day: 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-day.jpg',
    night: 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg',
  },
  medium: {
    day: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74092/world.200408.3x5400x2700.jpg',
    night: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg',
  },
  high: {
    day: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74092/world.200408.3x21600x10800.jpg',
    night: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_3km.jpg',
  },
}

// Default quality by user email (Gabe gets high, others medium)
const USER_DEFAULT_QUALITY: Record<string, TextureQuality> = {
  'gbouslov@gmail.com': 'high',
}

const COUNTRIES_GEOJSON = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'

// Cool blue/grey map palette - non-adjacent colors
export const USER_COLORS: Record<string, string> = {
  'gbouslov@gmail.com': '#64748b', // Gabe - slate-500
  'dbouslov@gmail.com': '#475569', // David - slate-600
  'jbouslov@gmail.com': '#94a3b8', // Jonathan - slate-400
  'bouslovd@gmail.com': '#334155', // Daniel - slate-700
  'bouslovb@gmail.com': '#78716c', // Dad - stone-500
  'lbouslov@gmail.com': '#a8a29e', // Mom - stone-400
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
  quality,
  userEmail
}: TravelGlobeProps) {
  const globeRef = useRef<any>(null)
  const [globeReady, setGlobeReady] = useState(false)
  const [countries, setCountries] = useState<any[]>([])
  const [hoveredCountry, setHoveredCountry] = useState<any>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const { containerRef, dimensions } = useGlobeResize()

  // Determine texture quality - prop > user default > medium fallback
  const textureQuality = quality || (userEmail && USER_DEFAULT_QUALITY[userEmail]) || 'medium'
  const textures = TEXTURES[textureQuality]

  const dayTexture = useMemo(() => new THREE.TextureLoader().load(textures.day), [textures.day])
  const nightTexture = useMemo(() => new THREE.TextureLoader().load(textures.night), [textures.night])

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
      return USER_COLORS[selectedUser] || '#3b82f6'
    }

    // Multiple visitors - blend or use first visitor's color
    if (visitors.length === 1) {
      return USER_COLORS[visitors[0]] || '#3b82f6'
    }

    // Multiple visitors - use a gradient effect with opacity
    return '#ffffff'
  }, [selectedUser])

  const getPolygonSideColor = useCallback((d: any) => {
    const baseColor = getPolygonColor(d)
    // Make sides slightly darker
    return baseColor.replace(')', ', 0.8)').replace('rgb', 'rgba')
  }, [getPolygonColor])

  const handlePolygonHover = useCallback((polygon: any) => {
    setHoveredCountry(polygon)
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
        atmosphereColor="#64748b"
        atmosphereAltitude={0.12}
        polygonsData={polygonData}
        polygonAltitude={d => hoveredCountry === d ? 0.06 : 0.01}
        polygonCapColor={getPolygonColor}
        polygonSideColor={getPolygonSideColor}
        polygonStrokeColor={() => 'rgba(255,255,255,0.2)'}
        polygonLabel={polygonLabel}
        onPolygonHover={handlePolygonHover}
        onPolygonClick={handlePolygonClick}
        polygonsTransitionDuration={300}
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  )
}
