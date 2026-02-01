// WebGL detection and performance utilities

export type PerformanceTier = 'high' | 'medium' | 'low' | 'unsupported'

// Check if WebGL is supported
export function isWebGLSupported(): boolean {
  if (typeof window === 'undefined') return true // SSR - assume supported
  
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  } catch {
    return false
  }
}

// Detect performance tier based on device capabilities
export function detectPerformanceTier(): PerformanceTier {
  if (typeof window === 'undefined') return 'high'
  
  if (!isWebGLSupported()) return 'unsupported'
  
  // Check for mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  
  // Check for low memory (if available)
  const deviceMemory = (navigator as any).deviceMemory
  if (deviceMemory && deviceMemory < 4) return 'low'
  
  // Check for hardware concurrency
  const cores = navigator.hardwareConcurrency
  if (cores && cores < 4) return 'low'
  
  // Check battery status for mobile
  if (isMobile) return 'medium'
  
  return 'high'
}

// Get WebGL capabilities
export function getWebGLCapabilities(): {
  maxTextureSize: number
  maxVertexAttribs: number
  renderer: string
} | null {
  if (typeof window === 'undefined') return null
  
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') as WebGLRenderingContext
    if (!gl) return null
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    
    return {
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
      renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
    }
  } catch {
    return null
  }
}

// Detect if device is on battery saver mode (limited support)
export async function isLowPowerMode(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
    return false
  }
  
  try {
    const battery = await (navigator as any).getBattery()
    // Consider low power if discharging and < 20%
    return !battery.charging && battery.level < 0.2
  } catch {
    return false
  }
}

// Calculate optimal texture resolution based on device
export function getOptimalTextureResolution(): '4k' | '2k' | '1k' {
  const tier = detectPerformanceTier()
  
  switch (tier) {
    case 'high':
      return '2k' // 2K is plenty for most screens
    case 'medium':
      return '2k'
    case 'low':
      return '1k'
    default:
      return '1k'
  }
}

// Check if device supports WebGL2
export function isWebGL2Supported(): boolean {
  if (typeof window === 'undefined') return true
  
  try {
    const canvas = document.createElement('canvas')
    return !!canvas.getContext('webgl2')
  } catch {
    return false
  }
}
