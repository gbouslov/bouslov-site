'use client'

import { useRef, useMemo, useState, Suspense } from 'react'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { Sphere, Html, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

const FAMILY_MEMBERS = [
  { name: 'Gabe', lat: 40.7128, lng: -74.0060, color: '#3b82f6' },
  { name: 'David', lat: 42.3601, lng: -71.0589, color: '#8b5cf6' },
  { name: 'Jonathan', lat: 33.4484, lng: -112.0740, color: '#06b6d4' },
  { name: 'Daniel', lat: 33.4484, lng: -112.0740, color: '#10b981' },
]

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  return new THREE.Vector3(x, y, z)
}

function GlowingDot({
  position,
  color,
  name,
  isHovered,
  onHover,
  onUnhover
}: {
  position: THREE.Vector3
  color: string
  name: string
  isHovered: boolean
  onHover: () => void
  onUnhover: () => void
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const scale = isHovered ? 2 : 1

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1)
    }
    if (glowRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2
      glowRef.current.scale.setScalar(pulse * 1.5)
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef} onPointerOver={onHover} onPointerOut={onUnhover}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
      <mesh scale={[2.5, 2.5, 2.5]}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
      {isHovered && (
        <Html distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div className="bg-zinc-900/95 border border-zinc-700 px-3 py-1.5 rounded-lg text-sm text-white whitespace-nowrap backdrop-blur-sm shadow-xl">
            {name}
          </div>
        </Html>
      )}
    </group>
  )
}

function ConnectionLines({ dotPositions }: { dotPositions: Array<{ position: THREE.Vector3, color: string }> }) {
  const lineRef = useRef<THREE.Line>(null)

  const points = useMemo(() => {
    const allPoints: THREE.Vector3[] = []
    for (let i = 0; i < dotPositions.length; i++) {
      for (let j = i + 1; j < dotPositions.length; j++) {
        const start = dotPositions[i].position.clone()
        const end = dotPositions[j].position.clone()
        const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(1.15)
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
        allPoints.push(...curve.getPoints(20))
      }
    }
    return allPoints
  }, [dotPositions])

  const lineObj = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points)
    const mat = new THREE.LineBasicMaterial({ color: '#3b82f6', transparent: true, opacity: 0.2 })
    return new THREE.Line(geo, mat)
  }, [points])

  useFrame((state) => {
    if (lineRef.current) {
      const material = lineRef.current.material as THREE.LineBasicMaterial
      material.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.05
    }
  })

  return <primitive ref={lineRef} object={lineObj} />
}

function Earth({ hoveredMember, setHoveredMember }: {
  hoveredMember: string | null
  setHoveredMember: (name: string | null) => void
}) {
  const earthRef = useRef<THREE.Group>(null)
  const atmosphereRef = useRef<THREE.Mesh>(null)

  const dotPositions = useMemo(() => {
    return FAMILY_MEMBERS.map(member => ({
      ...member,
      position: latLngToVector3(member.lat, member.lng, 1.01)
    }))
  }, [])

  useFrame(({ clock }) => {
    if (earthRef.current) {
      earthRef.current.rotation.y = clock.getElapsedTime() * 0.03
    }
  })

  const gridMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color('#0f172a') },
        color2: { value: new THREE.Color('#1e3a5f') },
        gridColor: { value: new THREE.Color('#1e40af') },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 gridColor;
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          float lat = vUv.y;
          float lng = vUv.x;

          float latLines = smoothstep(0.02, 0.0, abs(fract(lat * 18.0) - 0.5) - 0.45);
          float lngLines = smoothstep(0.02, 0.0, abs(fract(lng * 36.0) - 0.5) - 0.45);
          float grid = max(latLines, lngLines) * 0.3;

          vec3 baseColor = mix(color1, color2, vUv.y * 0.5 + 0.25);
          vec3 finalColor = mix(baseColor, gridColor, grid);

          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          finalColor += vec3(0.1, 0.2, 0.4) * fresnel * 0.5;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    })
  }, [])

  return (
    <group ref={earthRef}>
      <Sphere args={[1, 64, 64]} material={gridMaterial} />

      <Sphere args={[1.02, 64, 64]} ref={atmosphereRef}>
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </Sphere>

      <Sphere args={[1.06, 64, 64]}>
        <meshBasicMaterial
          color="#1e40af"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </Sphere>

      <ConnectionLines dotPositions={dotPositions} />

      {dotPositions.map((member) => (
        <GlowingDot
          key={member.name}
          position={member.position}
          color={member.color}
          name={member.name}
          isHovered={hoveredMember === member.name}
          onHover={() => setHoveredMember(member.name)}
          onUnhover={() => setHoveredMember(null)}
        />
      ))}
    </group>
  )
}

function Scene({ hoveredMember, setHoveredMember }: {
  hoveredMember: string | null
  setHoveredMember: (name: string | null) => void
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 3, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.2} color="#4f46e5" />
      <Earth hoveredMember={hoveredMember} setHoveredMember={setHoveredMember} />
    </>
  )
}

function Stars() {
  const starsRef = useRef<THREE.Points>(null)

  const starsObj = useMemo(() => {
    const positions = new Float32Array(2000 * 3)
    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 15 + Math.random() * 10
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({
      size: 0.02,
      color: '#ffffff',
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    })
    return new THREE.Points(geometry, material)
  }, [])

  useFrame(({ clock }) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = clock.getElapsedTime() * 0.01
    }
  })

  return <primitive ref={starsRef} object={starsObj} />
}

function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-12 h-12 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
    </div>
  )
}

export function Globe() {
  const [hoveredMember, setHoveredMember] = useState<string | null>(null)

  return (
    <div className="w-full h-full relative">
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 0, 2.8], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <Stars />
          <Scene hoveredMember={hoveredMember} setHoveredMember={setHoveredMember} />
        </Canvas>
      </Suspense>
    </div>
  )
}
