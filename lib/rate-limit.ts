/**
 * Simple In-Memory Rate Limiter
 * For production, use Redis or Upstash
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

/**
 * Check if request should be rate limited
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 30 }
): {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
} {
  const now = Date.now()
  const entry = store.get(identifier)

  // No entry or expired entry
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs
    store.set(identifier, { count: 1, resetAt })

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
      limit: config.maxRequests,
    }
  }

  // Increment counter
  entry.count++

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit: config.maxRequests,
    }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
    limit: config.maxRequests,
  }
}

/**
 * Get client identifier from request
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (works with most proxies/CDNs)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

  // Could also include user agent for more granular limiting
  // const userAgent = request.headers.get('user-agent') || 'unknown'

  return `ip:${ip}`
}

/**
 * Cleanup expired entries periodically
 */
export function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000)
}
