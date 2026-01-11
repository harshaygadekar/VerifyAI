/**
 * Database Types
 *
 * This file contains TypeScript types that correspond to the database schema.
 * These types are used throughout the application for type safety.
 */

// ============================================================================
// Enums
// ============================================================================

export type QueryType = 'web' | 'news' | 'images' | 'mixed'
export type ResultType = 'web' | 'news' | 'image'

// ============================================================================
// Table Types (Database Row Types)
// ============================================================================

export interface User {
  id: string
  email: string
  username: string | null
  created_at: string
  updated_at: string
  last_login_at: string | null
  preferences: UserPreferences
  is_active: boolean
  is_premium: boolean
  metadata: Record<string, any>
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  language?: string
  notifications_enabled?: boolean
  search_history_enabled?: boolean
  default_search_sources?: string[]
}

export interface Query {
  id: string
  user_id: string | null
  query_text: string
  query_type: QueryType
  created_at: string
  response_metadata: Record<string, any>
  response_time_ms: number | null
  sources_count: number
  was_successful: boolean
  error_message: string | null
  session_id: string | null
  ip_address: string | null
  user_agent: string | null
  referer: string | null
}

export interface SearchResult {
  id: string
  query_id: string
  url: string
  title: string
  description: string | null
  content: string | null
  markdown: string | null
  rank: number
  result_type: ResultType
  published_date: string | null
  author: string | null
  source: string | null
  site_name: string | null
  image_url: string | null
  thumbnail_url: string | null
  favicon_url: string | null
  image_width: number | null
  image_height: number | null
  created_at: string
  was_clicked: boolean
  click_count: number
  time_spent_seconds: number
  metadata: Record<string, any>
}

export interface UserSession {
  id: string
  user_id: string | null
  session_start: string
  session_end: string | null
  queries_count: number
  total_time_seconds: number
  ip_address: string | null
  user_agent: string | null
  device_type: string | null
  browser: string | null
  os: string | null
  metadata: Record<string, any>
}

export interface QueryFeedback {
  id: string
  query_id: string
  user_id: string | null
  rating: number | null
  feedback_text: string | null
  is_helpful: boolean | null
  is_accurate: boolean | null
  is_complete: boolean | null
  created_at: string
  metadata: Record<string, any>
}

export interface ApiUsage {
  id: string
  user_id: string | null
  query_id: string | null
  api_provider: string
  api_endpoint: string | null
  request_count: number
  tokens_used: number | null
  cost_usd: number | null
  status_code: number | null
  response_time_ms: number | null
  was_successful: boolean
  error_message: string | null
  created_at: string
  metadata: Record<string, any>
}

export interface SavedSearch {
  id: string
  user_id: string
  query_id: string | null
  title: string
  description: string | null
  query_text: string
  tags: string[]
  is_favorite: boolean
  folder: string | null
  created_at: string
  updated_at: string
  last_accessed_at: string | null
  metadata: Record<string, any>
}

// ============================================================================
// Chat History Types (Conversations & Messages)
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system'

export interface Conversation {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  first_query_id: string | null
  metadata: Record<string, any>
}

export interface Message {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  parts: any[] | null // AI SDK UIMessage parts
  metadata: Record<string, any>
  query_id: string | null
  created_at: string
}

// ============================================================================
// Deep Research Types
// ============================================================================

export type ResearchMode = 'quick' | 'deep' | 'exhaustive'
export type SynthesisStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface ResearchSession {
  id: string
  user_id: string | null
  conversation_id: string | null
  original_query: string
  research_mode: ResearchMode
  additional_queries_count: number
  expanded_queries: string[]
  total_sources_found: number
  synthesis_status: SynthesisStatus
  final_report: string | null
  total_cost_usd: number | null
  total_tokens_used: number | null
  created_at: string
  completed_at: string | null
  metadata: Record<string, any>
}

export interface ResearchQueryResult {
  id: string
  research_session_id: string
  query_id: string | null
  query_text: string
  is_original: boolean
  query_order: number
  sources_count: number
  created_at: string
}


// ============================================================================
// Insert Types (for creating new records)
// ============================================================================

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type QueryInsert = Omit<Query, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type SearchResultInsert = Omit<SearchResult, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type UserSessionInsert = Omit<UserSession, 'id' | 'session_start'> & {
  id?: string
  session_start?: string
}

export type QueryFeedbackInsert = Omit<QueryFeedback, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type ApiUsageInsert = Omit<ApiUsage, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type SavedSearchInsert = Omit<SavedSearch, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type ConversationInsert = Omit<Conversation, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type MessageInsert = Omit<Message, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type ResearchSessionInsert = Omit<ResearchSession, 'id' | 'created_at' | 'completed_at'> & {
  id?: string
  created_at?: string
  completed_at?: string
}

export type ResearchQueryResultInsert = Omit<ResearchQueryResult, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}


// ============================================================================
// Update Types (for updating existing records)
// ============================================================================

export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>
export type QueryUpdate = Partial<Omit<Query, 'id' | 'created_at'>>
export type SearchResultUpdate = Partial<Omit<SearchResult, 'id' | 'created_at'>>
export type UserSessionUpdate = Partial<Omit<UserSession, 'id' | 'session_start'>>
export type QueryFeedbackUpdate = Partial<Omit<QueryFeedback, 'id' | 'created_at'>>
export type ApiUsageUpdate = Partial<Omit<ApiUsage, 'id' | 'created_at'>>
export type SavedSearchUpdate = Partial<Omit<SavedSearch, 'id' | 'created_at'>>
export type ConversationUpdate = Partial<Omit<Conversation, 'id' | 'created_at'>>
export type MessageUpdate = Partial<Omit<Message, 'id' | 'created_at'>>
export type ResearchSessionUpdate = Partial<Omit<ResearchSession, 'id' | 'created_at'>>
export type ResearchQueryResultUpdate = Partial<Omit<ResearchQueryResult, 'id' | 'created_at'>>


// ============================================================================
// View Types (for analytics views)
// ============================================================================

export interface UserQueryStats {
  user_id: string
  email: string
  total_queries: number
  active_days: number
  avg_response_time_ms: number
  successful_queries: number
  last_query_at: string | null
}

export interface PopularQuery {
  query_text: string
  query_type: QueryType
  query_count: number
  avg_response_time_ms: number
  unique_users: number
  last_queried_at: string
}

export interface DailyQueryStats {
  query_date: string
  query_type: QueryType
  total_queries: number
  unique_users: number
  avg_response_time_ms: number
  successful_queries: number
}

// ============================================================================
// Database Schema Type (for Supabase client)
// ============================================================================

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: UserInsert
        Update: UserUpdate
      }
      queries: {
        Row: Query
        Insert: QueryInsert
        Update: QueryUpdate
      }
      search_results: {
        Row: SearchResult
        Insert: SearchResultInsert
        Update: SearchResultUpdate
      }
      user_sessions: {
        Row: UserSession
        Insert: UserSessionInsert
        Update: UserSessionUpdate
      }
      query_feedback: {
        Row: QueryFeedback
        Insert: QueryFeedbackInsert
        Update: QueryFeedbackUpdate
      }
      api_usage: {
        Row: ApiUsage
        Insert: ApiUsageInsert
        Update: ApiUsageUpdate
      }
      saved_searches: {
        Row: SavedSearch
        Insert: SavedSearchInsert
        Update: SavedSearchUpdate
      }
    }
    Views: {
      user_query_stats: {
        Row: UserQueryStats
      }
      popular_queries: {
        Row: PopularQuery
      }
      daily_query_stats: {
        Row: DailyQueryStats
      }
    }
    Functions: {
      increment_click_count: {
        Args: {
          result_id: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
