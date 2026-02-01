'use client'

import { useRef, useEffect, useState, useMemo, useCallback, memo } from 'react'
import dynamic from 'next/dynamic'
import * as THREE from 'three'
import { vertexShader, fragmentShader, TEXTURES, getCachedSunCoordinates } from '@/lib/globe-shaders'
import { isWebGLSupported, detectPerformanceTier } from '@/lib/webgl-utils'

const GlobeGL = dynamic(() => import('react-globe.gl').then(mod => mod.default), {
  ssr: false,
  loading: () => <GlobeLoadingFallback />
})

const FAMILY_MEMBERS = [
  { name: 'Gabe', lat: 40.7128, lng: -74.0060, color: '#3b82f6' },
  { name: 'David', lat: 42.3601, lng: -71.0589, color: '#8b5cf6' },
  { name: 'Jonathan', lat: 33.4484, lng: -112.0740, color: '#06b6d4' },
  { name: 'Daniel', lat: 33.4484, lng: -112.0740, color: '#10b981' },
]

// Memoized loading fallback
const GlobeLoadingFallback = memo(function GlobeLoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-radial from-zinc-900 to-black">
      <div className="relative">
        {/* Animated spinner */}
        <div className="w-16 h-16 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
        {/* Pulsing center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-blue-500/20 rounded-full animate-pulse" />
        </div>
      </div>
      <span className="sr-only">Loading globe...</span>
    </div>
  )
})

// WebGL not supported fallback
const WebGLFallback = memo(function WebGLFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-radial from-zinc-900 to-black">
      <div className="text-center space-y-4 px-4">
        <div className="w-24 h-24 mx-auto rounded-full bg-zinc-800 flex items-center justify-center">
          <svg className="w-12 h-12 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 10h.01M15 10h.01M9.5 15.5c.83.83 2.17.83 3 0" />
          </svg>
        </div>
        <p className="text-zinc-400 text-sm">
          3D globe requires WebGL support
        </p>
      </div>
    </div>
  )
})

function GlobeInner() {
  const globeRef = useRef<any>(null)
  const [globeReady, setGlobeReady] = useState(false)
  const [hoveredMember, setHoveredMember] = useState<string | null>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const rotationRef = useRef({ lng: 0, lat: 0 })
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

  // Track window dimensions efficiently
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    updateDimensions()
    
    // Debounce resize handler
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
    controls.autoRotateSpeed = 0.3
    controls.enableZoom = false

    globe.pointOfView({ lat: 20, lng: -40, altitude: 2.5 })

    let frameId: number
    let lastSunUpdate = 0
    
    const animate = () => {
      if (materialRef.current && controls) {
        const azimuth = controls.getAzimuthalAngle() * (180 / Math.PI)
        const polar = controls.getPolarAngle() * (180 / Math.PI) - 90
        rotationRef.current = { lng: azimuth, lat: polar }
        materialRef.current.uniforms.globeRotation.value.set(azimuth, polar)

        // Update sun position less frequently (every second)
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

  // Memoized point data
  const pointData = useMemo(() => {
    return FAMILY_MEMBERS.map(m => ({
      ...m,
      size: m.name === hoveredMember ? 0.8 : 0.5,
      altitude: 0.01
    }))
  }, [hoveredMember])

  // Memoized arc data (static, never changes)
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
        backgroundImageUrl={TEXTURES.sky}
        atmosphereColor="#3b82f6"
        atmosphereAltitude={0.15}
        pointsData={pointData}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointRadius="size"
        pointAltitude="altitude"
        pointLabel={(d: any) => `<div class="bg-zinc-900/95 border border-zinc-700 px-3 py-1.5 rounded-lg text-sm text-white whitespace-nowrap backdrop-blur-sm shadow-xl">${d.name}</div>`}
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
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  )
}

// Main export with WebGL check
export const Globe = memo(function Globe() {
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Check WebGL support on mount
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

  // Show loading state while checking WebGL
  if (webGLSupported === null) {
    return <GlobeLoadingFallback />
  }

  // Show fallback if WebGL not supported
  if (!webGLSupported) {
    return <WebGLFallback />
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      {isVisible ? <GlobeInner /> : <GlobeLoadingFallback />}
    </div>
  )
})
