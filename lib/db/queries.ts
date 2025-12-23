/**
 * Database Query Utilities
 *
 * This module provides utility functions for database operations.
 * All functions include proper error handling and TypeScript typing.
 */

import { createAdminClient } from '@/lib/supabase/server'
import type {
  Query,
  QueryInsert,
  SearchResult,
  SearchResultInsert,
  UserSession,
  UserSessionInsert,
  UserSessionUpdate,
  User,
  UserInsert,
  SavedSearch,
  SavedSearchInsert,
  QueryFeedback,
  QueryFeedbackInsert,
  ApiUsage,
  ApiUsageInsert,
  QueryType,
  ResultType,
  Conversation,
  Message,
  MessageInsert,
} from './types'

// ============================================================================
// Query Operations
// ============================================================================

/**
 * Save a search query to the database
 *
 * @param queryData - Query data to insert
 * @returns The created query record or null on error
 */
export async function saveQuery(queryData: QueryInsert): Promise<Query | null> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('queries')
      .insert(queryData as never)
      .select()
      .single()

    if (error) {
      console.error('Error saving query:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error saving query:', error)
    return null
  }
}

/**
 * Get query history for a user
 *
 * @param userId - User ID
 * @param options - Query options (limit, offset, query type filter)
 * @returns Array of query records
 */
export async function getQueryHistory(
  userId: string,
  options: {
    limit?: number
    offset?: number
    queryType?: QueryType
  } = {}
): Promise<Query[]> {
  try {
    const supabase = createAdminClient()
    const { limit = 50, offset = 0, queryType } = options

    let query = supabase
      .from('queries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (queryType) {
      query = query.eq('query_type', queryType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching query history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching query history:', error)
    return []
  }
}
/**
 * Update a query with its full response text
 *
 * @param queryId - Query ID
 * @param responseText - The full text response from the AI
 * @param responseTimeMs - Total response time in ms
 * @returns Success status
 */
export async function updateQueryResponse(
  queryId: string,
  responseText: string,
  responseTimeMs?: number
): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    // First fetch existing metadata to merge with it
    const { data: existingQuery, error: fetchError } = await supabase
      .from('queries')
      .select('response_metadata')
      .eq('id', queryId)
      .single()

    if (fetchError) {
      console.error('Error fetching existing query:', fetchError)
      return false
    }

    const existingMetadata = (existingQuery as any)?.response_metadata || {}

    const updateData: any = {
      response_metadata: {
        ...existingMetadata,
        full_response: responseText
      }
    }

    if (responseTimeMs !== undefined) {
      updateData.response_time_ms = responseTimeMs
    }

    const { error } = await supabase
      .from('queries')
      .update(updateData as never)
      .eq('id', queryId)

    if (error) {
      console.error('Error updating query response:', error)
      return false
    }

    console.log('Successfully saved response for query:', queryId)
    return true
  } catch (error) {
    console.error('Unexpected error updating query response:', error)
    return false
  }
}

/**
 * Get a single query by ID with its search results
 *
 * @param queryId - Query ID
 * @returns Query with search results or null
 */
export async function getQueryWithResults(queryId: string): Promise<
  | (Query & {
    search_results: SearchResult[]
  })
  | null
> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('queries')
      .select('*, search_results(*)')
      .eq('id', queryId)
      .single()

    if (error) {
      console.error('Error fetching query with results:', error)
      return null
    }

    return data as any
  } catch (error) {
    console.error('Unexpected error fetching query with results:', error)
    return null
  }
}

/**
 * Search queries by text
 *
 * @param searchText - Text to search for
 * @param options - Search options
 * @returns Array of matching queries
 */
export async function searchQueries(
  searchText: string,
  options: {
    userId?: string
    limit?: number
  } = {}
): Promise<Query[]> {
  try {
    const supabase = createAdminClient()
    const { userId, limit = 50 } = options

    let query = supabase
      .from('queries')
      .select('*')
      .textSearch('query_text', searchText)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error searching queries:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error searching queries:', error)
    return []
  }
}

// ============================================================================
// Search Result Operations
// ============================================================================

/**
 * Save search results to the database
 *
 * @param results - Array of search result data to insert
 * @returns Array of created search result records or null on error
 */
export async function saveSearchResults(
  results: SearchResultInsert[]
): Promise<SearchResult[] | null> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('search_results')
      .insert(results as never)
      .select()

    if (error) {
      console.error('Error saving search results:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error saving search results:', error)
    return null
  }
}

/**
 * Get search results for a query
 *
 * @param queryId - Query ID
 * @param resultType - Optional filter by result type
 * @returns Array of search results
 */
export async function getSearchResults(
  queryId: string,
  resultType?: ResultType
): Promise<SearchResult[]> {
  try {
    const supabase = createAdminClient()

    let query = supabase
      .from('search_results')
      .select('*')
      .eq('query_id', queryId)
      .order('rank', { ascending: true })

    if (resultType) {
      query = query.eq('result_type', resultType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching search results:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching search results:', error)
    return []
  }
}

/**
 * Track a click on a search result
 *
 * @param resultId - Search result ID
 * @returns Success status
 */
export async function trackResultClick(resultId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    // First, call the RPC function to increment click_count atomically
    const { error: rpcError } = await supabase.rpc('increment_click_count', {
      result_id: resultId,
    } as never)

    if (rpcError) {
      console.error('Error incrementing click count:', rpcError)
      return false
    }

    // Then update the was_clicked flag
    const { error: updateError } = await supabase
      .from('search_results')
      .update({ was_clicked: true } as never)
      .eq('id', resultId)

    if (updateError) {
      console.error('Error tracking result click:', updateError)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error tracking result click:', error)
    return false
  }
}

// ============================================================================
// User Session Operations
// ============================================================================

/**
 * Create a new user session
 *
 * @param sessionData - Session data to insert
 * @returns The created session record or null on error
 */
export async function createUserSession(
  sessionData: UserSessionInsert
): Promise<UserSession | null> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('user_sessions')
      .insert(sessionData as never)
      .select()
      .single()

    if (error) {
      console.error('Error creating user session:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error creating user session:', error)
    return null
  }
}

/**
 * End a user session
 *
 * @param sessionId - Session ID
 * @param totalTimeSeconds - Total time spent in seconds
 * @returns Success status
 */
export async function endUserSession(
  sessionId: string,
  totalTimeSeconds?: number
): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    const updateData: UserSessionUpdate = {
      session_end: new Date().toISOString(),
    }

    if (totalTimeSeconds !== undefined) {
      updateData.total_time_seconds = totalTimeSeconds
    }

    const { error } = await supabase
      .from('user_sessions')
      .update(updateData as never)
      .eq('id', sessionId)

    if (error) {
      console.error('Error ending user session:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error ending user session:', error)
    return false
  }
}

/**
 * Get user sessions
 *
 * @param userId - User ID
 * @param options - Query options
 * @returns Array of user sessions
 */
export async function getUserSessions(
  userId: string,
  options: {
    limit?: number
    offset?: number
    includeActive?: boolean
  } = {}
): Promise<UserSession[]> {
  try {
    const supabase = createAdminClient()
    const { limit = 50, offset = 0, includeActive = true } = options

    let query = supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('session_start', { ascending: false })
      .range(offset, offset + limit - 1)

    if (!includeActive) {
      query = query.not('session_end', 'is', null)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching user sessions:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching user sessions:', error)
    return []
  }
}

// ============================================================================
// User Operations
// ============================================================================

/**
 * Create or get a user
 *
 * @param email - User email
 * @param userData - Optional additional user data
 * @returns User record
 */
export async function createOrGetUser(
  email: string,
  userData?: Partial<UserInsert>
): Promise<User | null> {
  try {
    const supabase = createAdminClient()

    // Try to get existing user
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single() as { data: User | null; error: any }

    if (existingUser) {
      // Update last login
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() } as never)
        .eq('id', existingUser.id)

      return existingUser
    }

    // Create new user if not found
    if (fetchError?.code === 'PGRST116') {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email,
          ...userData,
          last_login_at: new Date().toISOString(),
        } as never)
        .select()
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        return null
      }

      return newUser
    }

    console.error('Error fetching user:', fetchError)
    return null
  } catch (error) {
    console.error('Unexpected error in createOrGetUser:', error)
    return null
  }
}

/**
 * Get user by ID
 *
 * @param userId - User ID
 * @returns User record or null
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error fetching user:', error)
    return null
  }
}

// ============================================================================
// Saved Search Operations
// ============================================================================

/**
 * Save a search for later
 *
 * @param savedSearchData - Saved search data
 * @returns The created saved search record or null on error
 */
export async function createSavedSearch(
  savedSearchData: SavedSearchInsert
): Promise<SavedSearch | null> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('saved_searches')
      .insert(savedSearchData as never)
      .select()
      .single()

    if (error) {
      console.error('Error creating saved search:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error creating saved search:', error)
    return null
  }
}

/**
 * Get saved searches for a user
 *
 * @param userId - User ID
 * @param options - Query options
 * @returns Array of saved searches
 */
export async function getSavedSearches(
  userId: string,
  options: {
    limit?: number
    offset?: number
    favoritesOnly?: boolean
  } = {}
): Promise<SavedSearch[]> {
  try {
    const supabase = createAdminClient()
    const { limit = 50, offset = 0, favoritesOnly = false } = options

    let query = supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (favoritesOnly) {
      query = query.eq('is_favorite', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching saved searches:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching saved searches:', error)
    return []
  }
}

// ============================================================================
// Feedback Operations
// ============================================================================

/**
 * Submit feedback for a query
 *
 * @param feedbackData - Feedback data
 * @returns The created feedback record or null on error
 */
export async function submitQueryFeedback(
  feedbackData: QueryFeedbackInsert
): Promise<QueryFeedback | null> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('query_feedback')
      .insert(feedbackData as never)
      .select()
      .single()

    if (error) {
      console.error('Error submitting query feedback:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error submitting query feedback:', error)
    return null
  }
}

// ============================================================================
// API Usage Tracking
// ============================================================================

/**
 * Track API usage
 *
 * @param usageData - API usage data
 * @returns The created API usage record or null on error
 */
export async function trackApiUsage(
  usageData: ApiUsageInsert
): Promise<ApiUsage | null> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('api_usage')
      .insert(usageData as never)
      .select()
      .single()

    if (error) {
      console.error('Error tracking API usage:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error tracking API usage:', error)
    return null
  }
}

/**
 * Get API usage statistics for a user
 *
 * @param userId - User ID
 * @param options - Query options
 * @returns Array of API usage records
 */
export async function getApiUsage(
  userId: string,
  options: {
    limit?: number
    apiProvider?: string
    startDate?: string
    endDate?: string
  } = {}
): Promise<ApiUsage[]> {
  try {
    const supabase = createAdminClient()
    const { limit = 100, apiProvider, startDate, endDate } = options

    let query = supabase
      .from('api_usage')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (apiProvider) {
      query = query.eq('api_provider', apiProvider)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching API usage:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching API usage:', error)
    return []
  }
}

// ============================================================================
// Analytics Functions
// ============================================================================

/**
 * Get query statistics for the current day
 *
 * @returns Daily statistics or null on error
 */
export async function getTodayStats(): Promise<{
  total_queries: number
  successful_queries: number
  avg_response_time_ms: number
} | null> {
  try {
    const supabase = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('daily_query_stats')
      .select('*')
      .eq('query_date', today) as { data: any[] | null; error: any }

    if (error) {
      console.error('Error fetching today stats:', error)
      return null
    }

    if (!data || data.length === 0) {
      return {
        total_queries: 0,
        successful_queries: 0,
        avg_response_time_ms: 0,
      }
    }

    // Aggregate across all query types
    const stats = data.reduce(
      (acc, curr) => ({
        total_queries: acc.total_queries + curr.total_queries,
        successful_queries: acc.successful_queries + curr.successful_queries,
        avg_response_time_ms:
          (acc.avg_response_time_ms + curr.avg_response_time_ms) / 2,
      }),
      { total_queries: 0, successful_queries: 0, avg_response_time_ms: 0 }
    )

    return stats
  } catch (error) {
    console.error('Unexpected error fetching today stats:', error)
    return null
  }
}

// ============================================================================
// Conversation Operations
// ============================================================================

/**
 * Create a new conversation
 *
 * @param userId - User ID (Supabase UUID)
 * @param title - Optional initial title (defaults to "New conversation")
 * @returns The created conversation or null on error
 */
export async function createConversation(
  userId: string,
  title?: string
): Promise<Conversation | null> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: title || 'New conversation',
      } as never)
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error creating conversation:', error)
    return null
  }
}

/**
 * Get all conversations for a user (sorted by updated_at DESC)
 *
 * @param userId - User ID (Supabase UUID)
 * @param limit - Maximum number of conversations to return
 * @returns Array of conversations
 */
export async function getConversations(
  userId: string,
  limit: number = 100
): Promise<Conversation[]> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching conversations:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching conversations:', error)
    return []
  }
}

/**
 * Get a single conversation by ID
 *
 * @param conversationId - Conversation ID
 * @returns Conversation or null
 */
export async function getConversation(
  conversationId: string
): Promise<Conversation | null> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (error) {
      console.error('Error fetching conversation:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Unexpected error fetching conversation:', error)
    return null
  }
}

/**
 * Update conversation title (for auto-title after first exchange)
 *
 * @param conversationId - Conversation ID
 * @param title - New title
 * @returns Success status
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('conversations')
      .update({ title } as never)
      .eq('id', conversationId)

    if (error) {
      console.error('Error updating conversation title:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error updating conversation title:', error)
    return false
  }
}

/**
 * Touch conversation (update updated_at to now)
 * Call this after each new message to keep sidebar sorted correctly
 *
 * @param conversationId - Conversation ID
 * @returns Success status
 */
export async function touchConversation(
  conversationId: string
): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() } as never)
      .eq('id', conversationId)

    if (error) {
      console.error('Error touching conversation:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error touching conversation:', error)
    return false
  }
}

/**
 * Delete a conversation and all its messages
 *
 * @param conversationId - Conversation ID
 * @returns Success status
 */
export async function deleteConversation(
  conversationId: string
): Promise<boolean> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (error) {
      console.error('Error deleting conversation:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error deleting conversation:', error)
    return false
  }
}

// ============================================================================
// Message Operations
// ============================================================================

/**
 * Save a message to a conversation
 *
 * @param messageData - Message data to insert
 * @returns The created message or null on error
 */
export async function saveMessage(
  messageData: MessageInsert
): Promise<Message | null> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData as never)
      .select()
      .single()

    if (error) {
      console.error('Error saving message:', error)
      return null
    }

    // Touch the conversation to update its updated_at
    await touchConversation(messageData.conversation_id)

    return data
  } catch (error) {
    console.error('Unexpected error saving message:', error)
    return null
  }
}

/**
 * Get all messages for a conversation (sorted by created_at ASC)
 *
 * @param conversationId - Conversation ID
 * @returns Array of messages
 */
export async function getMessages(
  conversationId: string
): Promise<Message[]> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Unexpected error fetching messages:', error)
    return []
  }
}

/**
 * Get conversation with all its messages
 *
 * @param conversationId - Conversation ID
 * @returns Conversation with messages or null
 */
export async function getConversationWithMessages(
  conversationId: string
): Promise<(Conversation & { messages: Message[] }) | null> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('conversations')
      .select('*, messages(*)')
      .eq('id', conversationId)
      .single()

    if (error) {
      console.error('Error fetching conversation with messages:', error)
      return null
    }

    // Cast data to expected type with messages
    const result = data as unknown as (Conversation & { messages: Message[] })

    // Sort messages by created_at
    if (result?.messages) {
      result.messages.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    }

    return result
  } catch (error) {
    console.error('Unexpected error fetching conversation with messages:', error)
    return null
  }
}
