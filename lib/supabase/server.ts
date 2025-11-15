/**
 * Supabase Server Clients
 *
 * This module provides server-side Supabase clients for different use cases:
 * - createServerClient: For use in Server Components and API routes (with cookies)
 * - createAdminClient: For administrative operations that bypass RLS
 */

import { createServerClient as createSSRServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/db/types'

/**
 * Create a Supabase client for Server Components and API Routes
 * This client respects Row Level Security (RLS) and uses cookie-based authentication
 *
 * @returns Supabase server client with cookie support
 * @throws Error if environment variables are not configured
 */
export async function createServerClient() {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file.'
    )
  }

  return createSSRServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}

/**
 * Create a Supabase admin client for server-side operations
 * This client uses the service role key and bypasses Row Level Security (RLS)
 *
 * WARNING: Use this client with caution. It has elevated privileges and should
 * only be used for administrative operations or when RLS needs to be bypassed.
 *
 * @returns Supabase admin client
 * @throws Error if environment variables are not configured
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables. Please check your .env.local file.'
    )
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
