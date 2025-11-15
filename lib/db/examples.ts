/**
 * Database Usage Examples
 *
 * This file contains practical examples of using the database utilities.
 * These are reference implementations - copy and adapt as needed.
 */

import {
  saveQuery,
  saveSearchResults,
  getQueryHistory,
  getQueryWithResults,
  createUserSession,
  endUserSession,
  createOrGetUser,
  createSavedSearch,
  submitQueryFeedback,
  trackApiUsage,
  getTodayStats,
} from './queries'
import type { QueryInsert, SearchResultInsert } from './types'

// ============================================================================
// Example 1: Complete Search Flow
// ============================================================================

export async function exampleCompleteSearchFlow(
  userEmail: string,
  queryText: string,
  searchResults: Array<{ url: string; title: string; description?: string }>
) {
  // Step 1: Get or create user
  const user = await createOrGetUser(userEmail, {
    username: userEmail.split('@')[0],
  })

  if (!user) {
    throw new Error('Failed to create/get user')
  }

  // Step 2: Create a session
  const session = await createUserSession({
    user_id: user.id,
    queries_count: 0,
    total_time_seconds: 0,
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    device_type: null,
    browser: null,
    os: null,
    session_end: null,
    metadata: {},
  })

  if (!session) {
    throw new Error('Failed to create session')
  }

  // Step 3: Save the query
  const queryData: QueryInsert = {
    user_id: user.id,
    query_text: queryText,
    query_type: 'web',
    response_metadata: {},
    response_time_ms: null,
    sources_count: searchResults.length,
    was_successful: true,
    error_message: null,
    session_id: session.id,
    ip_address: null,
    user_agent: null,
    referer: null,
  }

  const savedQuery = await saveQuery(queryData)

  if (!savedQuery) {
    throw new Error('Failed to save query')
  }

  // Step 4: Save search results
  const resultsToSave: SearchResultInsert[] = searchResults.map((result, index) => ({
    query_id: savedQuery.id,
    url: result.url,
    title: result.title,
    description: result.description || null,
    content: null,
    markdown: null,
    rank: index + 1,
    result_type: 'web',
    published_date: null,
    author: null,
    source: null,
    site_name: null,
    image_url: null,
    thumbnail_url: null,
    favicon_url: null,
    image_width: null,
    image_height: null,
    was_clicked: false,
    click_count: 0,
    time_spent_seconds: 0,
    metadata: {},
  }))

  await saveSearchResults(resultsToSave)

  // Step 5: Track API usage
  await trackApiUsage({
    user_id: user.id,
    query_id: savedQuery.id,
    api_provider: 'firecrawl',
    api_endpoint: '/v2/search',
    status_code: 200,
    response_time_ms: 1500,
    was_successful: true,
    error_message: null,
    request_count: 1,
    tokens_used: null,
    cost_usd: null,
    metadata: {},
  })

  // Step 6: End session (when user leaves)
  await endUserSession(session.id, 300) // 5 minutes

  return {
    user,
    session,
    query: savedQuery,
  }
}

// ============================================================================
// Example 2: Implementing Search History with Pagination
// ============================================================================

export async function exampleSearchHistory(
  userId: string,
  page: number = 1,
  pageSize: number = 20
) {
  const offset = (page - 1) * pageSize

  const queries = await getQueryHistory(userId, {
    limit: pageSize,
    offset,
  })

  return {
    queries,
    page,
    pageSize,
    totalInPage: queries.length,
    hasMore: queries.length === pageSize,
    hasPrevious: page > 1,
  }
}

// ============================================================================
// Example 3: Getting Query Details with Results
// ============================================================================

export async function exampleQueryDetails(queryId: string) {
  const queryWithResults = await getQueryWithResults(queryId)

  if (!queryWithResults) {
    return null
  }

  // Transform into a more UI-friendly format
  return {
    id: queryWithResults.id,
    text: queryWithResults.query_text,
    type: queryWithResults.query_type,
    createdAt: queryWithResults.created_at,
    successful: queryWithResults.was_successful,
    results: {
      web: queryWithResults.search_results.filter((r) => r.result_type === 'web'),
      news: queryWithResults.search_results.filter((r) => r.result_type === 'news'),
      images: queryWithResults.search_results.filter((r) => r.result_type === 'image'),
    },
  }
}

// ============================================================================
// Example 4: User Dashboard Statistics
// ============================================================================

export async function exampleUserDashboard(userId: string) {
  // Get user's recent queries
  const recentQueries = await getQueryHistory(userId, {
    limit: 10,
  })

  // Get today's overall stats
  const todayStats = await getTodayStats()

  // Calculate user-specific stats
  const totalQueries = recentQueries.length
  const successfulQueries = recentQueries.filter((q) => q.was_successful).length
  const avgResponseTime =
    recentQueries.length > 0
      ? recentQueries.reduce((sum, q) => sum + (q.response_time_ms || 0), 0) /
        recentQueries.length
      : 0

  return {
    user: {
      totalQueries,
      successfulQueries,
      avgResponseTime,
      recentQueries: recentQueries.slice(0, 5),
    },
    today: todayStats,
  }
}

// ============================================================================
// Example 5: Saving User Feedback
// ============================================================================

export async function exampleSubmitFeedback(
  queryId: string,
  userId: string,
  rating: number,
  feedbackText?: string
) {
  const feedback = await submitQueryFeedback({
    query_id: queryId,
    user_id: userId,
    rating,
    feedback_text: feedbackText || null,
    is_helpful: rating >= 4,
    is_accurate: rating >= 4,
    is_complete: rating >= 3,
    metadata: {},
  })

  return feedback
}

// ============================================================================
// Example 6: Saving a Search for Later
// ============================================================================

export async function exampleSaveSearch(
  userId: string,
  queryText: string,
  title: string,
  tags?: string[]
) {
  const savedSearch = await createSavedSearch({
    user_id: userId,
    query_id: null,
    query_text: queryText,
    title,
    description: null,
    tags: tags || [],
    is_favorite: false,
    folder: null,
    last_accessed_at: null,
    metadata: {},
  })

  return savedSearch
}

// ============================================================================
// Example 7: API Usage Analytics
// ============================================================================

export async function exampleApiUsageAnalytics(userId: string, days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const apiUsage = await import('./queries').then((m) =>
    m.getApiUsage(userId, {
      limit: 1000,
      startDate: startDate.toISOString(),
    })
  )

  // Aggregate by provider
  const byProvider = apiUsage.reduce(
    (acc, usage) => {
      if (!acc[usage.api_provider]) {
        acc[usage.api_provider] = {
          requests: 0,
          successful: 0,
          failed: 0,
          totalCost: 0,
          avgResponseTime: 0,
        }
      }

      acc[usage.api_provider].requests += usage.request_count
      acc[usage.api_provider].successful += usage.was_successful ? 1 : 0
      acc[usage.api_provider].failed += usage.was_successful ? 0 : 1
      acc[usage.api_provider].totalCost += Number(usage.cost_usd || 0)
      acc[usage.api_provider].avgResponseTime += usage.response_time_ms || 0

      return acc
    },
    {} as Record<
      string,
      {
        requests: number
        successful: number
        failed: number
        totalCost: number
        avgResponseTime: number
      }
    >
  )

  // Calculate averages
  Object.keys(byProvider).forEach((provider) => {
    const count = byProvider[provider].requests
    byProvider[provider].avgResponseTime = byProvider[provider].avgResponseTime / count
  })

  return byProvider
}

// ============================================================================
// Example 8: Exporting User Data (GDPR compliance)
// ============================================================================

export async function exampleExportUserData(userId: string) {
  const [user, queries, sessions] = await Promise.all([
    import('./queries').then((m) => m.getUserById(userId)),
    getQueryHistory(userId, { limit: 1000 }),
    import('./queries').then((m) => m.getUserSessions(userId, { limit: 1000 })),
  ])

  // Get all search results for user's queries
  const allResults = await Promise.all(
    queries.map((q) => import('./queries').then((m) => m.getSearchResults(q.id)))
  )

  return {
    user,
    queries,
    sessions,
    searchResults: allResults.flat(),
    exportedAt: new Date().toISOString(),
  }
}

// ============================================================================
// Example 9: Implementing a "Recent Searches" Feature
// ============================================================================

export async function exampleRecentSearches(userId: string, limit: number = 5) {
  const queries = await getQueryHistory(userId, {
    limit,
  })

  // Return only the query texts and when they were made
  return queries.map((q) => ({
    text: q.query_text,
    createdAt: q.created_at,
    wasSuccessful: q.was_successful,
  }))
}

// ============================================================================
// Example 10: Error Handling Pattern
// ============================================================================

export async function exampleWithErrorHandling(userId: string, queryText: string) {
  try {
    // Attempt to save query
    const queryData: QueryInsert = {
      user_id: userId,
      query_text: queryText,
      query_type: 'web',
      response_metadata: {},
      response_time_ms: null,
      sources_count: 0,
      was_successful: true,
      error_message: null,
      session_id: null,
      ip_address: null,
      user_agent: null,
      referer: null,
    }

    const savedQuery = await saveQuery(queryData)

    if (!savedQuery) {
      // Query function returned null, meaning it failed
      // The error is already logged in the console
      return {
        success: false,
        error: 'Failed to save query',
        code: 'QUERY_SAVE_FAILED',
      }
    }

    return {
      success: true,
      data: savedQuery,
    }
  } catch (error) {
    // Unexpected error
    console.error('Unexpected error in exampleWithErrorHandling:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'UNEXPECTED_ERROR',
    }
  }
}

// ============================================================================
// Example 11: Implementing Auto-complete with Recent Queries
// ============================================================================

export async function exampleSearchAutocomplete(userId: string, searchTerm: string) {
  const queries = await import('./queries').then((m) =>
    m.searchQueries(searchTerm, {
      userId,
      limit: 10,
    })
  )

  // Get unique query texts
  const suggestions = [...new Set(queries.map((q) => q.query_text))]

  return suggestions
}

// ============================================================================
// Example 12: Building a Search Analytics Dashboard
// ============================================================================

export async function exampleAnalyticsDashboard(userId: string) {
  const [todayStats, recentQueries, apiUsage] = await Promise.all([
    getTodayStats(),
    getQueryHistory(userId, { limit: 100 }),
    import('./queries').then((m) => m.getApiUsage(userId, { limit: 100 })),
  ])

  // Calculate query type distribution
  const queryTypeDistribution = recentQueries.reduce(
    (acc, q) => {
      acc[q.query_type] = (acc[q.query_type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  // Calculate success rate
  const successRate =
    recentQueries.length > 0
      ? (recentQueries.filter((q) => q.was_successful).length / recentQueries.length) * 100
      : 0

  return {
    today: todayStats,
    queryTypeDistribution,
    successRate,
    totalQueries: recentQueries.length,
    totalApiCalls: apiUsage.length,
  }
}
