'use client'

import { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import * as THREE from 'three'

const GlobeGL = dynamic(() => import('react-globe.gl').then(mod => mod.default), {
  ssr: false,
  loading: () => <LoadingFallback />
})

const DAY_TEXTURE = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-day.jpg'
const NIGHT_TEXTURE = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg'
const NIGHT_SKY = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png'
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

const vertexShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  #define PI 3.141592653589793
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform vec2 sunPosition;
  uniform vec2 globeRotation;
  varying vec3 vNormal;
  varying vec2 vUv;

  float toRad(in float a) {
    return a * PI / 180.0;
  }

  vec3 Polar2Cartesian(in vec2 c) {
    float theta = toRad(90.0 - c.x);
    float phi = toRad(90.0 - c.y);
    return vec3(
      sin(phi) * cos(theta),
      cos(phi),
      sin(phi) * sin(theta)
    );
  }

  void main() {
    float invLon = toRad(globeRotation.x);
    float invLat = -toRad(globeRotation.y);
    mat3 rotX = mat3(1, 0, 0, 0, cos(invLat), -sin(invLat), 0, sin(invLat), cos(invLat));
    mat3 rotY = mat3(cos(invLon), 0, sin(invLon), 0, 1, 0, -sin(invLon), 0, cos(invLon));
    vec3 rotatedSunDirection = rotX * rotY * Polar2Cartesian(sunPosition);
    float intensity = dot(normalize(vNormal), normalize(rotatedSunDirection));
    vec4 dayColor = texture2D(dayTexture, vUv);
    vec4 nightColor = texture2D(nightTexture, vUv);
    float blendFactor = smoothstep(-0.1, 0.1, intensity);
    gl_FragColor = mix(nightColor, dayColor, blendFactor);
  }
`

function getSunCoordinates(): { lng: number; lat: number } {
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * (Math.PI / 180))
  const hourAngle = ((now.getUTCHours() + now.getUTCMinutes() / 60) / 24) * 360 - 180
  return { lng: -hourAngle, lat: declination }
}

function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
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
}

export function TravelGlobe({
  travels,
  selectedUser,
  onCountryHover,
  onCountryClick
}: TravelGlobeProps) {
  const globeRef = useRef<any>(null)
  const [globeReady, setGlobeReady] = useState(false)
  const [countries, setCountries] = useState<any[]>([])
  const [hoveredCountry, setHoveredCountry] = useState<any>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

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

  // Track window dimensions
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
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

    globe.pointOfView({ lat: 20, lng: -40, altitude: 2.5 })

    let frameId: number
    const animate = () => {
      if (materialRef.current && globe.controls()) {
        const azimuth = globe.controls().getAzimuthalAngle() * (180 / Math.PI)
        const polar = globe.controls().getPolarAngle() * (180 / Math.PI) - 90
        materialRef.current.uniforms.globeRotation.value.set(azimuth, polar)

        const sunCoords = getSunCoordinates()
        materialRef.current.uniforms.sunPosition.value.set(sunCoords.lng, sunCoords.lat)
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
      const isoCode = country.properties.ISO_A2
      return visitedCountries[isoCode]
    }).map(country => ({
      ...country,
      visitors: visitedCountries[country.properties.ISO_A2] || []
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
          name: polygon.properties.ADMIN,
          visitors: polygon.visitors || []
        })
      } else {
        onCountryHover(null)
      }
    }
  }, [onCountryHover])

  const handlePolygonClick = useCallback((polygon: any) => {
    if (onCountryClick && polygon) {
      onCountryClick(polygon.properties.ISO_A2, polygon.properties.ADMIN)
    }
  }, [onCountryClick])

  const polygonLabel = useCallback((d: any) => {
    const visitors = d.visitors || []
    const names = visitors.map((email: string) => USER_NAMES[email] || email).join(', ')
    return `<div class="bg-zinc-900/95 border border-zinc-700 px-3 py-2 rounded-lg text-sm backdrop-blur-sm shadow-xl">
      <div class="font-medium text-white">${d.properties.ADMIN}</div>
      <div class="text-zinc-400 text-xs mt-1">Visited by: ${names}</div>
    </div>`
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
