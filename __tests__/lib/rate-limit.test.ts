import { rateLimit } from '@/lib/rate-limit'

describe('Rate Limiter', () => {
  const testConfig = {
    windowMs: 1000, // 1 second for testing
    maxRequests: 3,
  }

  beforeEach(() => {
    // Clear rate limit store between tests
    jest.clearAllMocks()
  })

  it('should allow requests within limit', () => {
    const identifier = 'test-user-1'

    const result1 = rateLimit(identifier, testConfig)
    expect(result1.allowed).toBe(true)
    expect(result1.remaining).toBe(2)

    const result2 = rateLimit(identifier, testConfig)
    expect(result2.allowed).toBe(true)
    expect(result2.remaining).toBe(1)

    const result3 = rateLimit(identifier, testConfig)
    expect(result3.allowed).toBe(true)
    expect(result3.remaining).toBe(0)
  })

  it('should block requests exceeding limit', () => {
    const identifier = 'test-user-2'

    // Use up the limit
    rateLimit(identifier, testConfig)
    rateLimit(identifier, testConfig)
    rateLimit(identifier, testConfig)

    // Next request should be blocked
    const result = rateLimit(identifier, testConfig)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('should handle different identifiers independently', () => {
    const user1 = 'user-1'
    const user2 = 'user-2'

    const result1 = rateLimit(user1, testConfig)
    expect(result1.allowed).toBe(true)
    expect(result1.remaining).toBe(2)

    const result2 = rateLimit(user2, testConfig)
    expect(result2.allowed).toBe(true)
    expect(result2.remaining).toBe(2)
  })

  it('should reset after time window', async () => {
    const identifier = 'test-user-3'

    // Use up the limit
    rateLimit(identifier, testConfig)
    rateLimit(identifier, testConfig)
    rateLimit(identifier, testConfig)

    // Should be blocked
    const blocked = rateLimit(identifier, testConfig)
    expect(blocked.allowed).toBe(false)

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 1100))

    // Should be allowed again
    const allowed = rateLimit(identifier, testConfig)
    expect(allowed.allowed).toBe(true)
    expect(allowed.remaining).toBe(2)
  }, 2000)

  it('should provide correct rate limit info', () => {
    const identifier = 'test-user-4'

    const result = rateLimit(identifier, testConfig)
    expect(result.limit).toBe(testConfig.maxRequests)
    expect(result.resetAt).toBeGreaterThan(Date.now())
  })
})
