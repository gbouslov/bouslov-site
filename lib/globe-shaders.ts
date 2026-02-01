// Shared shader code for globe components

export const vertexShader = `
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const fragmentShader = `
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

// Texture URLs with smaller alternatives for mobile
export const TEXTURES = {
  day: {
    high: 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-day.jpg',
    // Could add lower res version here
    low: 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-day.jpg',
  },
  night: {
    high: 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg',
    low: 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg',
  },
  sky: 'https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png',
}

// Calculate sun position based on current time
export function getSunCoordinates(): { lng: number; lat: number } {
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * (Math.PI / 180))
  const hourAngle = ((now.getUTCHours() + now.getUTCMinutes() / 60) / 24) * 360 - 180
  return { lng: -hourAngle, lat: declination }
}

// Memoized sun position (update only every minute)
let cachedSunPosition: { lng: number; lat: number } | null = null
let lastSunUpdate = 0

export function getCachedSunCoordinates(): { lng: number; lat: number } {
  const now = Date.now()
  if (!cachedSunPosition || now - lastSunUpdate > 60000) {
    cachedSunPosition = getSunCoordinates()
    lastSunUpdate = now
  }
  return cachedSunPosition
}
