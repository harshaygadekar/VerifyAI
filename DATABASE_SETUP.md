# VerifyAI Database Setup Guide

This guide will help you set up and configure the Supabase database for the VerifyAI project.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Database Schema](#database-schema)
4. [Setup Instructions](#setup-instructions)
5. [Environment Configuration](#environment-configuration)
6. [Database Operations](#database-operations)
7. [Testing the Setup](#testing-the-setup)
8. [Troubleshooting](#troubleshooting)

## Overview

VerifyAI uses Supabase (PostgreSQL) as its database to store:

- **Users**: User accounts and preferences
- **Queries**: Search queries made by users
- **Search Results**: Individual search results for each query
- **User Sessions**: User activity tracking
- **Query Feedback**: User feedback on query results
- **API Usage**: Track API calls and costs
- **Saved Searches**: Bookmarked searches

## Prerequisites

- A Supabase account (free tier is sufficient)
- Node.js and npm installed
- VerifyAI project cloned locally

## Database Schema

The database includes the following tables:

### Core Tables

1. **users** - User account information and preferences
2. **queries** - Search queries with metadata
3. **search_results** - Individual search results linked to queries
4. **user_sessions** - User session tracking
5. **query_feedback** - User feedback on queries
6. **api_usage** - API usage and cost tracking
7. **saved_searches** - User-saved searches

### Analytics Views

1. **user_query_stats** - User query statistics
2. **popular_queries** - Most popular search queries
3. **daily_query_stats** - Daily query aggregates

## Setup Instructions

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details and click "Create new project"
5. Wait for the project to be provisioned

### Step 2: Get Your Credentials

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (under "Project API keys")
   - **service_role key** (under "Project API keys" - keep this secret!)

### Step 3: Configure Environment Variables

The `.env.local` file has already been created with your credentials. If you need to update them:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://allfsdplvrifxbcbmmvg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 4: Apply Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New query"
3. Open the file `/home/user/VerifyAI/lib/supabase/schema.sql`
4. Copy the entire contents
5. Paste into the Supabase SQL Editor
6. Click "Run" to execute the schema

This will create all tables, indexes, triggers, RLS policies, and views.

### Step 5: Verify Installation

After running the schema, verify the setup:

1. Go to **Table Editor** in Supabase dashboard
2. You should see all 7 tables listed:
   - users
   - queries
   - search_results
   - user_sessions
   - query_feedback
   - api_usage
   - saved_searches

## Environment Configuration

### Client-Side Access

The browser client uses the anon key and respects Row Level Security (RLS):

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
```

### Server-Side Access

For API routes and Server Components:

```typescript
import { createServerClient, createAdminClient } from '@/lib/supabase/server'

// For user-authenticated requests
const supabase = await createServerClient()

// For admin operations (bypasses RLS)
const adminClient = createAdminClient()
```

## Database Operations

### Available Utility Functions

The project includes comprehensive database utilities in `/home/user/VerifyAI/lib/db/queries.ts`:

#### Query Operations

```typescript
import { saveQuery, getQueryHistory, getQueryWithResults, searchQueries } from '@/lib/db/queries'

// Save a query
const query = await saveQuery({
  user_id: userId,
  query_text: 'What is AI?',
  query_type: 'web',
  sources_count: 5,
  was_successful: true,
})

// Get user's query history
const history = await getQueryHistory(userId, { limit: 50 })

// Get query with its results
const queryWithResults = await getQueryWithResults(queryId)

// Search queries by text
const results = await searchQueries('AI', { userId, limit: 20 })
```

#### Search Results Operations

```typescript
import { saveSearchResults, getSearchResults, trackResultClick } from '@/lib/db/queries'

// Save search results
await saveSearchResults([
  {
    query_id: queryId,
    url: 'https://example.com',
    title: 'Example Result',
    rank: 1,
    result_type: 'web',
  },
])

// Get results for a query
const results = await getSearchResults(queryId)

// Track when user clicks a result
await trackResultClick(resultId)
```

#### User Session Operations

```typescript
import { createUserSession, endUserSession, getUserSessions } from '@/lib/db/queries'

// Create a new session
const session = await createUserSession({
  user_id: userId,
  queries_count: 0,
})

// End a session
await endUserSession(sessionId, totalTimeSeconds)

// Get user's sessions
const sessions = await getUserSessions(userId)
```

#### User Operations

```typescript
import { createOrGetUser, getUserById } from '@/lib/db/queries'

// Create or get existing user
const user = await createOrGetUser('user@example.com', {
  username: 'username',
})

// Get user by ID
const user = await getUserById(userId)
```

#### Other Operations

```typescript
import {
  createSavedSearch,
  getSavedSearches,
  submitQueryFeedback,
  trackApiUsage,
  getApiUsage,
  getTodayStats,
} from '@/lib/db/queries'

// Save a search
await createSavedSearch({
  user_id: userId,
  title: 'My Saved Search',
  query_text: 'AI trends',
})

// Submit feedback
await submitQueryFeedback({
  query_id: queryId,
  user_id: userId,
  rating: 5,
  is_helpful: true,
})

// Track API usage
await trackApiUsage({
  user_id: userId,
  query_id: queryId,
  api_provider: 'firecrawl',
  status_code: 200,
  was_successful: true,
})

// Get today's statistics
const stats = await getTodayStats()
```

## Testing the Setup

### Test Database Connection

Create a test API route at `/home/user/VerifyAI/app/api/test-db/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createAdminClient()

    // Test query
    const { data, error } = await supabase.from('users').select('count').single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      data,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
```

Visit `http://localhost:3000/api/test-db` to test the connection.

### Test Query Saving

The search API route at `/home/user/VerifyAI/app/api/fireplexity/search/route.ts` automatically saves:

1. Query information
2. Search results (web, news, images)
3. API usage tracking (Firecrawl and Groq)

Simply perform a search in the application and check your Supabase dashboard to see the data being saved.

## Row Level Security (RLS)

The database uses Row Level Security to ensure data privacy:

- **Users** can only view/update their own data
- **Queries** can only be viewed by the user who created them
- **Search Results** inherit permissions from their parent query
- **Sessions** and **Feedback** follow similar user-based restrictions

### Bypassing RLS for Admin Operations

Use the `createAdminClient()` when you need to bypass RLS:

```typescript
import { createAdminClient } from '@/lib/supabase/server'

const adminClient = createAdminClient()
// This client bypasses all RLS policies
```

## Database Migrations

When updating the schema:

1. Make changes to `/home/user/VerifyAI/lib/supabase/schema.sql`
2. Test changes in a development Supabase project first
3. Apply to production via SQL Editor
4. Update TypeScript types in `/home/user/VerifyAI/lib/db/types.ts` if needed

## Troubleshooting

### "Missing Supabase environment variables"

- Ensure `.env.local` exists in the project root
- Verify all three environment variables are set correctly
- Restart the development server after changing `.env.local`

### "Row Level Security policy violation"

- You're trying to access data you don't have permission for
- Use `createAdminClient()` for administrative operations
- Check that the user ID matches the authenticated user

### "Table does not exist"

- Run the schema.sql file in the Supabase SQL Editor
- Verify the schema was applied successfully
- Check for any error messages in the SQL Editor

### "Invalid API key"

- Double-check your Supabase credentials
- Make sure you're using the correct project URL
- Verify the anon key and service role key are from the same project

### Database Connection Issues

- Check your internet connection
- Verify the Supabase project is running (not paused)
- Check Supabase status page for outages

## Next Steps

1. ✅ Database schema applied
2. ✅ Environment variables configured
3. ✅ Test the database connection
4. 🔄 Implement authentication (optional)
5. 🔄 Add custom RLS policies if needed
6. 🔄 Create analytics dashboards using the views

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js with Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

## Support

For issues or questions:

1. Check the Supabase dashboard logs
2. Review the database error messages
3. Consult the Supabase documentation
4. Check the project's GitHub issues

---

**Last Updated**: 2025-11-15
**Version**: 1.0.0
