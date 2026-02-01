// Security utilities for the application

/**
 * In-memory rate limiter
 * Note: This only works for single-instance deployments.
 * For multi-instance, use Redis or similar.
 */
export class RateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map()

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  check(key: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now()
    const record = this.requests.get(key)

    // Clean up expired records periodically
    if (Math.random() < 0.1) {
      this.cleanup()
    }

    if (!record || now > record.resetAt) {
      this.requests.set(key, { count: 1, resetAt: now + this.windowMs })
      return { allowed: true }
    }

    if (record.count >= this.maxRequests) {
      return {
        allowed: false,
        retryAfter: Math.ceil((record.resetAt - now) / 1000),
      }
    }

    record.count++
    return { allowed: true }
  }

  private cleanup() {
    const now = Date.now()
    for (const [key, record] of this.requests) {
      if (now > record.resetAt) {
        this.requests.delete(key)
      }
    }
  }
}

// Rate limiters for different endpoints
export const apiLimiters = {
  // General API: 100 requests per minute
  general: new RateLimiter(100, 60 * 1000),
  
  // Uploads: 10 per minute
  upload: new RateLimiter(10, 60 * 1000),
  
  // Writes (POST/PUT/DELETE): 30 per minute
  write: new RateLimiter(30, 60 * 1000),
  
  // Score submissions: 5 per 5 minutes per category (stricter)
  scoreSubmit: new RateLimiter(5, 5 * 60 * 1000),
}

/**
 * Validate URL to prevent javascript: and data: URLs
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Sanitize user input - basic HTML entity encoding
 * Note: React already escapes JSX, but this is for extra safety in edge cases
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Validate coordinate bounds
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

/**
 * Generate a secure random string
 */
export function generateSecureId(length = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}
