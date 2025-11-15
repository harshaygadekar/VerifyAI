# Database Utilities

This directory contains database types and query utilities for the VerifyAI application.

## Files

### `types.ts`

Contains TypeScript type definitions for all database tables, including:

- **Row types**: Types representing database table rows
- **Insert types**: Types for inserting new records
- **Update types**: Types for updating existing records
- **View types**: Types for database views (analytics)
- **Database schema type**: Complete type definition for Supabase client

**Example Usage:**

```typescript
import type { Query, QueryInsert, User, SearchResult } from '@/lib/db/types'

// Type-safe query insertion
const newQuery: QueryInsert = {
  user_id: userId,
  query_text: 'What is AI?',
  query_type: 'web',
  sources_count: 5,
  was_successful: true,
}
```

### `queries.ts`

Contains utility functions for all database operations. These functions include proper error handling and TypeScript typing.

## Function Categories

### Query Operations

Functions for managing search queries:

- `saveQuery(queryData)` - Save a new query
- `getQueryHistory(userId, options)` - Get user's query history
- `getQueryWithResults(queryId)` - Get query with its search results
- `searchQueries(searchText, options)` - Search queries by text

### Search Result Operations

Functions for managing search results:

- `saveSearchResults(results)` - Save multiple search results
- `getSearchResults(queryId, resultType?)` - Get results for a query
- `trackResultClick(resultId)` - Track when a result is clicked

### User Session Operations

Functions for session tracking:

- `createUserSession(sessionData)` - Create a new session
- `endUserSession(sessionId, totalTime?)` - End a session
- `getUserSessions(userId, options)` - Get user's sessions

### User Operations

Functions for user management:

- `createOrGetUser(email, userData?)` - Create or retrieve user
- `getUserById(userId)` - Get user by ID

### Saved Search Operations

Functions for saved searches:

- `createSavedSearch(data)` - Save a search
- `getSavedSearches(userId, options)` - Get user's saved searches

### Feedback Operations

Functions for query feedback:

- `submitQueryFeedback(feedbackData)` - Submit feedback for a query

### API Usage Tracking

Functions for tracking API usage:

- `trackApiUsage(usageData)` - Track API usage
- `getApiUsage(userId, options)` - Get API usage statistics

### Analytics Functions

Functions for analytics:

- `getTodayStats()` - Get query statistics for today

## Usage Examples

### Saving a Query with Results

```typescript
import { saveQuery, saveSearchResults } from '@/lib/db/queries'
import type { QueryInsert, SearchResultInsert } from '@/lib/db/types'

async function handleSearch(query: string, userId: string) {
  // Save the query
  const queryData: QueryInsert = {
    user_id: userId,
    query_text: query,
    query_type: 'web',
    sources_count: 3,
    was_successful: true,
    session_id: sessionId,
  }

  const savedQuery = await saveQuery(queryData)

  if (savedQuery) {
    // Save the results
    const results: SearchResultInsert[] = [
      {
        query_id: savedQuery.id,
        url: 'https://example.com',
        title: 'Example Result',
        rank: 1,
        result_type: 'web',
      },
    ]

    await saveSearchResults(results)
  }
}
```

### Getting Query History

```typescript
import { getQueryHistory } from '@/lib/db/queries'

async function fetchUserHistory(userId: string) {
  const history = await getQueryHistory(userId, {
    limit: 50,
    offset: 0,
    queryType: 'web', // Optional filter
  })

  return history
}
```

### Tracking User Sessions

```typescript
import { createUserSession, endUserSession } from '@/lib/db/queries'

// Start a session
const session = await createUserSession({
  user_id: userId,
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
})

// Later, end the session
await endUserSession(session.id, 3600) // 1 hour in seconds
```

### Getting Analytics

```typescript
import { getTodayStats } from '@/lib/db/queries'

const stats = await getTodayStats()
console.log(`
  Total Queries: ${stats?.total_queries}
  Successful: ${stats?.successful_queries}
  Avg Response Time: ${stats?.avg_response_time_ms}ms
`)
```

## Error Handling

All query functions include error handling:

```typescript
const query = await saveQuery(queryData)

if (query === null) {
  // Handle error - function will log details to console
  console.error('Failed to save query')
} else {
  // Success - use the query object
  console.log('Query saved:', query.id)
}
```

## Best Practices

### 1. Always Use Types

```typescript
// Good
const queryData: QueryInsert = { ... }

// Avoid
const queryData = { ... }
```

### 2. Handle Null Returns

```typescript
// Good
const user = await getUserById(userId)
if (user) {
  // Use user
}

// Avoid
const user = await getUserById(userId)
user.email // Could be null!
```

### 3. Use Admin Client for Server Operations

The utility functions automatically use the admin client which bypasses RLS. Only use these functions on the server side.

```typescript
// Good - in API route
export async function POST(request: Request) {
  const query = await saveQuery(data)
}

// Bad - in client component
'use client'
export function MyComponent() {
  const query = await saveQuery(data) // Won't work
}
```

### 4. Batch Operations

```typescript
// Good - save all results at once
await saveSearchResults([result1, result2, result3])

// Avoid - multiple individual saves
await saveSearchResults([result1])
await saveSearchResults([result2])
await saveSearchResults([result3])
```

### 5. Optional Parameters

Many functions accept options for pagination and filtering:

```typescript
// With options
const history = await getQueryHistory(userId, {
  limit: 20,
  offset: 40, // Page 3
  queryType: 'web',
})

// With defaults
const history = await getQueryHistory(userId)
// Uses limit: 50, offset: 0, no filter
```

## TypeScript Helpers

The types file includes utility types:

```typescript
import type { Tables, Inserts, Updates } from '@/lib/db/types'

// Get row type for any table
type UserRow = Tables<'users'>
type QueryRow = Tables<'queries'>

// Get insert type for any table
type UserInsert = Inserts<'users'>

// Get update type for any table
type UserUpdate = Updates<'users'>
```

## Database Schema

See `/home/user/VerifyAI/lib/supabase/schema.sql` for the complete database schema.

## Testing

Create test utilities in your test files:

```typescript
import { saveQuery } from '@/lib/db/queries'

describe('Query Operations', () => {
  it('should save a query', async () => {
    const query = await saveQuery({
      user_id: 'test-user',
      query_text: 'test query',
      query_type: 'web',
      sources_count: 0,
      was_successful: true,
    })

    expect(query).not.toBeNull()
    expect(query?.query_text).toBe('test query')
  })
})
```

## Common Patterns

### Creating a Complete Search Flow

```typescript
// 1. Create or get user
const user = await createOrGetUser('user@example.com')

// 2. Create session
const session = await createUserSession({
  user_id: user.id,
})

// 3. Save query
const query = await saveQuery({
  user_id: user.id,
  session_id: session.id,
  query_text: 'AI trends 2024',
  query_type: 'web',
  sources_count: 5,
  was_successful: true,
})

// 4. Save results
await saveSearchResults([
  /* results */
])

// 5. Track API usage
await trackApiUsage({
  user_id: user.id,
  query_id: query.id,
  api_provider: 'firecrawl',
  was_successful: true,
})

// 6. End session
await endUserSession(session.id)
```

### Implementing Search History

```typescript
async function getSearchHistory(userId: string, page: number = 1, pageSize: number = 20) {
  const offset = (page - 1) * pageSize

  const queries = await getQueryHistory(userId, {
    limit: pageSize,
    offset,
  })

  return {
    queries,
    page,
    pageSize,
    hasMore: queries.length === pageSize,
  }
}
```

## Performance Tips

1. **Use pagination** - Don't fetch all records at once
2. **Filter at the database** - Use query parameters instead of filtering in code
3. **Batch inserts** - Use `saveSearchResults()` for multiple results
4. **Cache when appropriate** - Cache user data and preferences
5. **Use views for analytics** - Query the pre-built views instead of aggregating in code

## Troubleshooting

### "Cannot read property of null"

The function returned null, indicating an error. Check the console logs for the actual error message.

### "Type error: Argument not assignable"

You're passing incorrect types. Make sure to use the proper Insert/Update types.

### "RLS policy violation"

The utility functions use the admin client which bypasses RLS. This error shouldn't occur unless you're directly using the Supabase client.

---

For more information, see the [Database Setup Guide](../../DATABASE_SETUP.md).
