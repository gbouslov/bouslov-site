'use client'

import { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react'
import dynamic from 'next/dynamic'
import * as THREE from 'three'
import { vertexShader, fragmentShader, TEXTURES, getCachedSunCoordinates } from '@/lib/globe-shaders'
import { isWebGLSupported } from '@/lib/webgl-utils'

const GlobeGL = dynamic(() => import('react-globe.gl').then(mod => mod.default), {
  ssr: false,
  loading: () => <LoadingFallback />
})

const COUNTRIES_GEOJSON = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson'

// User colors matching the family member theme
export const USER_COLORS: Record<string, string> = {
  'gbouslov@gmail.com': '#3b82f6', // Gabe - blue
  'dbouslov@gmail.com': '#8b5cf6', // David - purple
  'jbouslov@gmail.com': '#06b6d4', // Jonathan - cyan
  'bouslovd@gmail.com': '#10b981', // Daniel - green
}

export const USER_NAMES: Record<string, string> = {
  'gbouslov@gmail.com': 'Gabe',
  'dbouslov@gmail.com': 'David',
  'jbouslov@gmail.com': 'Jonathan',
  'bouslovd@gmail.com': 'Daniel',
}

const LoadingFallback = memo(function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
})

const WebGLFallback = memo(function WebGLFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/50">
      <p className="text-zinc-400 text-sm">3D globe requires WebGL support</p>
    </div>
  )
})

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
}

// Cache for GeoJSON data
let countriesCache: any[] | null = null
let countriesFetchPromise: Promise<any[]> | null = null

async function fetchCountries(): Promise<any[]> {
  if (countriesCache) return countriesCache
  
  if (!countriesFetchPromise) {
    countriesFetchPromise = fetch(COUNTRIES_GEOJSON)
      .then(res => res.json())
      .then(data => {
        countriesCache = data.features
        return data.features
      })
      .catch(err => {
        console.error('Failed to load countries:', err)
        countriesFetchPromise = null
        return []
      })
  }
  
  return countriesFetchPromise
}

function TravelGlobeInner({
  travels,
  selectedUser,
  onCountryHover,
  onCountryClick
}: TravelGlobeProps) {
  const globeRef = useRef<any>(null)
  const [globeReady, setGlobeReady] = useState(false)
  const [countries, setCountries] = useState<any[]>(countriesCache || [])
  const [hoveredCountry, setHoveredCountry] = useState<any>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Load textures with memoization
  const dayTexture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const texture = loader.load(TEXTURES.day.high)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])
  
  const nightTexture = useMemo(() => {
    const loader = new THREE.TextureLoader()
    const texture = loader.load(TEXTURES.night.high)
    texture.colorSpace = THREE.SRGBColorSpace
    return texture
  }, [])

  // Load GeoJSON with caching
  useEffect(() => {
    if (countriesCache) {
      setCountries(countriesCache)
    } else {
      fetchCountries().then(setCountries)
    }
  }, [])

  // Track window dimensions with debounce
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    updateDimensions()
    
    let timeoutId: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateDimensions, 100)
    }
    
    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
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
    const controls = globe.controls()

    controls.autoRotate = true
    controls.autoRotateSpeed = 0.2
    controls.enableZoom = true
    controls.minDistance = 150
    controls.maxDistance = 500

    globe.pointOfView({ lat: 20, lng: -40, altitude: 2.5 })

    let frameId: number
    let lastSunUpdate = 0
    
    const animate = () => {
      if (materialRef.current && controls) {
        const azimuth = controls.getAzimuthalAngle() * (180 / Math.PI)
        const polar = controls.getPolarAngle() * (180 / Math.PI) - 90
        materialRef.current.uniforms.globeRotation.value.set(azimuth, polar)

        // Update sun position less frequently
        const now = Date.now()
        if (now - lastSunUpdate > 1000) {
          const sunCoords = getCachedSunCoordinates()
          materialRef.current.uniforms.sunPosition.value.set(sunCoords.lng, sunCoords.lat)
          lastSunUpdate = now
        }
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

    // Multiple visitors - use white
    return '#ffffff'
  }, [selectedUser])

  const getPolygonSideColor = useCallback((d: any) => {
    const baseColor = getPolygonColor(d)
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
    return `<div class="bg-zinc-900/95 border border-zinc-700 px-3 py-2 rounded-lg text-sm backdrop-blur-sm shadow-xl">
      <div class="font-medium text-white">${d.properties.name}</div>
      <div class="text-zinc-400 text-xs mt-1">Visited by: ${names}</div>
    </div>`
  }, [])

  const getPolygonAltitude = useCallback((d: any) => {
    return hoveredCountry === d ? 0.06 : 0.01
  }, [hoveredCountry])

  return (
    <div className="w-full h-full relative">
      <GlobeGL
        ref={globeRef}
        onGlobeReady={() => setGlobeReady(true)}
        globeMaterial={createGlobeMaterial()}
        backgroundColor="rgba(0,0,0,0)"
        backgroundImageUrl={TEXTURES.sky}
        atmosphereColor="#3b82f6"
        atmosphereAltitude={0.15}
        polygonsData={polygonData}
        polygonAltitude={getPolygonAltitude}
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

// Main export with WebGL check and lazy loading
export const TravelGlobe = memo(function TravelGlobe(props: TravelGlobeProps) {
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setWebGLSupported(isWebGLSupported())
  }, [])

  // Intersection observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  if (webGLSupported === null) {
    return <LoadingFallback />
  }

  if (!webGLSupported) {
    return <WebGLFallback />
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      {isVisible ? <TravelGlobeInner {...props} /> : <LoadingFallback />}
    </div>
  )
})
