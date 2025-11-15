/**
 * Input Validation Schemas
 * Using Zod for runtime type validation and sanitization
 */

import { z } from 'zod'

// ============================================================================
// Search API Validation
// ============================================================================

export const searchRequestSchema = z.object({
  query: z
    .string()
    .min(1, 'Query cannot be empty')
    .max(500, 'Query is too long (max 500 characters)')
    .transform((str) => str.trim()),

  messages: z.array(z.any()).optional(),

  firecrawlApiKey: z
    .string()
    .optional()
    .transform((str) => str?.trim()),

  userId: z
    .string()
    .uuid('Invalid user ID format')
    .optional(),

  sessionId: z
    .string()
    .uuid('Invalid session ID format')
    .optional(),
})

export type SearchRequest = z.infer<typeof searchRequestSchema>

// ============================================================================
// Database Query Validation
// ============================================================================

export const queryInsertSchema = z.object({
  user_id: z.string().uuid().nullable(),
  query_text: z.string().min(1).max(1000),
  query_type: z.enum(['web', 'news', 'image', 'mixed']),
  response_metadata: z.record(z.any()),
  response_time_ms: z.number().int().nullable(),
  sources_count: z.number().int().min(0),
  was_successful: z.boolean(),
  error_message: z.string().nullable(),
  session_id: z.string().uuid().nullable(),
  ip_address: z.string().ip().nullable(),
  user_agent: z.string().max(500).nullable(),
  referer: z.string().url().nullable().or(z.literal(null)),
})

export type ValidatedQueryInsert = z.infer<typeof queryInsertSchema>

// ============================================================================
// User Input Sanitization
// ============================================================================

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}

/**
 * Validate and sanitize search query
 */
export function validateSearchQuery(query: string): {
  valid: boolean
  sanitized: string
  error?: string
} {
  const trimmed = query.trim()

  if (!trimmed) {
    return {
      valid: false,
      sanitized: '',
      error: 'Query cannot be empty',
    }
  }

  if (trimmed.length > 500) {
    return {
      valid: false,
      sanitized: trimmed.slice(0, 500),
      error: 'Query is too long (max 500 characters)',
    }
  }

  const sanitized = sanitizeInput(trimmed)

  return {
    valid: true,
    sanitized,
  }
}

// ============================================================================
// API Key Validation
// ============================================================================

export const apiKeySchema = z
  .string()
  .min(10, 'API key is too short')
  .max(500, 'API key is too long')
  .regex(/^[A-Za-z0-9_-]+$/, 'API key contains invalid characters')

/**
 * Validate API key format (not authenticity)
 */
export function validateApiKey(key: string): boolean {
  try {
    apiKeySchema.parse(key)
    return true
  } catch {
    return false
  }
}

// ============================================================================
// Environment Variable Validation
// ============================================================================

export const envSchema = z.object({
  FIRECRAWL_API_KEY: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
})

/**
 * Validate required environment variables
 */
export function validateEnv() {
  try {
    envSchema.parse({
      FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
      GROQ_API_KEY: process.env.GROQ_API_KEY,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    })
    return { valid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      }
    }
    return { valid: false, errors: ['Unknown validation error'] }
  }
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

export const defaultRateLimits: Record<string, RateLimitConfig> = {
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  },
  checkEnv: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
}
