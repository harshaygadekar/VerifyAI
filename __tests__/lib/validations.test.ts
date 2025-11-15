import {
  validateSearchQuery,
  sanitizeInput,
  validateApiKey,
} from '@/lib/validations'

describe('Validation Functions', () => {
  describe('validateSearchQuery', () => {
    it('should accept valid queries', () => {
      const result = validateSearchQuery('What is TypeScript?')
      expect(result.valid).toBe(true)
      expect(result.sanitized).toBe('What is TypeScript?')
      expect(result.error).toBeUndefined()
    })

    it('should reject empty queries', () => {
      const result = validateSearchQuery('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Query cannot be empty')
    })

    it('should reject whitespace-only queries', () => {
      const result = validateSearchQuery('   ')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Query cannot be empty')
    })

    it('should reject queries that are too long', () => {
      const longQuery = 'a'.repeat(501)
      const result = validateSearchQuery(longQuery)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Query is too long (max 500 characters)')
    })

    it('should trim whitespace', () => {
      const result = validateSearchQuery('  hello world  ')
      expect(result.valid).toBe(true)
      expect(result.sanitized).toBe('hello world')
    })

    it('should sanitize malicious input', () => {
      const result = validateSearchQuery('<script>alert("xss")</script>')
      expect(result.valid).toBe(true)
      expect(result.sanitized).not.toContain('<')
      expect(result.sanitized).not.toContain('>')
    })
  })

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const result = sanitizeInput('<div>Hello</div>')
      expect(result).toBe('divHello/div')
    })

    it('should remove javascript: protocol', () => {
      const result = sanitizeInput('javascript:alert("xss")')
      expect(result).toBe('alert("xss")')
    })

    it('should remove event handlers', () => {
      const result = sanitizeInput('onclick=alert("xss")')
      expect(result).toBe('alert("xss")')
    })

    it('should trim whitespace', () => {
      const result = sanitizeInput('  hello  ')
      expect(result).toBe('hello')
    })

    it('should handle empty strings', () => {
      const result = sanitizeInput('')
      expect(result).toBe('')
    })
  })

  describe('validateApiKey', () => {
    it('should accept valid API keys', () => {
      expect(validateApiKey('abc123xyz-456_789')).toBe(true)
    })

    it('should reject keys that are too short', () => {
      expect(validateApiKey('short')).toBe(false)
    })

    it('should reject keys with invalid characters', () => {
      expect(validateApiKey('key with spaces')).toBe(false)
      expect(validateApiKey('key@#$%')).toBe(false)
    })

    it('should reject empty keys', () => {
      expect(validateApiKey('')).toBe(false)
    })
  })
})
