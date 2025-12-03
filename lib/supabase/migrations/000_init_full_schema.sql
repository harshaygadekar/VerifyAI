-- ============================================================================
-- VerifyAI Database Schema (Complete Initialization)
-- ============================================================================
-- This schema defines the database structure for the VerifyAI application
-- including tables for users, queries, search results, sessions, and analytics.
--
-- To apply this schema:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to the SQL Editor
-- 3. Copy and paste this entire file
-- 4. Execute the SQL
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: users
-- Stores user account information and preferences
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,

  -- User preferences stored as JSONB for flexibility
  preferences JSONB DEFAULT '{
    "theme": "light",
    "language": "en",
    "notifications_enabled": true,
    "search_history_enabled": true,
    "default_search_sources": ["web", "news", "images"]
  }'::jsonb,

  -- User status and metadata
  is_active BOOLEAN DEFAULT true,
  is_premium BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = true;

-- ============================================================================
-- TABLE: queries
-- Stores all search queries made by users
-- ============================================================================
CREATE TABLE IF NOT EXISTS queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,

  -- Query details
  query_text TEXT NOT NULL,
  query_type TEXT DEFAULT 'web' CHECK (query_type IN ('web', 'news', 'images', 'mixed')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Response and performance metadata
  response_metadata JSONB DEFAULT '{}'::jsonb,

  -- Performance tracking
  response_time_ms INTEGER,
  sources_count INTEGER DEFAULT 0,
  was_successful BOOLEAN DEFAULT true,
  error_message TEXT,

  -- Session tracking
  session_id UUID,

  -- Additional context
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT
);

-- Indexes for queries table
CREATE INDEX IF NOT EXISTS idx_queries_user_id ON queries(user_id);
CREATE INDEX IF NOT EXISTS idx_queries_created_at ON queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_queries_session_id ON queries(session_id);
CREATE INDEX IF NOT EXISTS idx_queries_query_type ON queries(query_type);
CREATE INDEX IF NOT EXISTS idx_queries_was_successful ON queries(was_successful);

-- Full-text search index on query_text
CREATE INDEX IF NOT EXISTS idx_queries_text_search ON queries USING gin(to_tsvector('english', query_text));

-- ============================================================================
-- TABLE: search_results
-- Stores individual search results for each query
-- ============================================================================
CREATE TABLE IF NOT EXISTS search_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID NOT NULL REFERENCES queries(id) ON DELETE CASCADE,

  -- Result details
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  markdown TEXT,

  -- Ranking and positioning
  rank INTEGER NOT NULL,
  result_type TEXT DEFAULT 'web' CHECK (result_type IN ('web', 'news', 'image')),

  -- Metadata
  published_date TIMESTAMP WITH TIME ZONE,
  author TEXT,
  source TEXT,
  site_name TEXT,

  -- Media
  image_url TEXT,
  thumbnail_url TEXT,
  favicon_url TEXT,

  -- Image-specific metadata
  image_width INTEGER,
  image_height INTEGER,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- User interaction tracking
  was_clicked BOOLEAN DEFAULT false,
  click_count INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,

  -- Additional metadata stored as JSONB
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for search_results table
CREATE INDEX IF NOT EXISTS idx_search_results_query_id ON search_results(query_id);
CREATE INDEX IF NOT EXISTS idx_search_results_rank ON search_results(rank);
CREATE INDEX IF NOT EXISTS idx_search_results_result_type ON search_results(result_type);
CREATE INDEX IF NOT EXISTS idx_search_results_created_at ON search_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_results_url ON search_results(url);

-- ============================================================================
-- TABLE: user_sessions
-- Tracks user sessions and activity
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  user_sessions_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,

  -- Session timing
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,

  -- Session metrics
  queries_count INTEGER DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,

  -- Session context
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,

  -- Session metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for user_sessions table
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_start ON user_sessions(session_start DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_end ON user_sessions(session_end DESC);

-- ============================================================================
-- TABLE: query_feedback
-- Stores user feedback on query results
-- ============================================================================
CREATE TABLE IF NOT EXISTS query_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Feedback details
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,

  -- Feedback categories
  is_helpful BOOLEAN,
  is_accurate BOOLEAN,
  is_complete BOOLEAN,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for query_feedback table
CREATE INDEX IF NOT EXISTS idx_query_feedback_query_id ON query_feedback(query_id);
CREATE INDEX IF NOT EXISTS idx_query_feedback_user_id ON query_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_query_feedback_rating ON query_feedback(rating);

-- ============================================================================
-- TABLE: api_usage
-- Tracks API usage and costs
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  query_id UUID REFERENCES queries(id) ON DELETE CASCADE,

  -- API details
  api_provider TEXT NOT NULL, -- e.g., 'firecrawl', 'groq'
  api_endpoint TEXT,

  -- Usage metrics
  request_count INTEGER DEFAULT 1,
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),

  -- Response details
  status_code INTEGER,
  response_time_ms INTEGER,
  was_successful BOOLEAN DEFAULT true,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for api_usage table
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_query_id ON api_usage(query_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_api_provider ON api_usage(api_provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at DESC);

-- ============================================================================
-- TABLE: saved_searches
-- Allows users to save and bookmark searches
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query_id UUID REFERENCES queries(id) ON DELETE SET NULL,

  -- Saved search details
  title TEXT NOT NULL,
  description TEXT,
  query_text TEXT NOT NULL,

  -- Organization
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  folder TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE,

  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for saved_searches table
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_is_favorite ON saved_searches(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_tags ON saved_searches USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON saved_searches(created_at DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at for saved_searches table
DROP TRIGGER IF EXISTS update_saved_searches_updated_at ON saved_searches;
CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment queries_count in user_sessions
CREATE OR REPLACE FUNCTION increment_session_queries_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_sessions
  SET queries_count = queries_count + 1
  WHERE id = NEW.session_id AND session_end IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment queries_count when a new query is inserted
DROP TRIGGER IF EXISTS increment_queries_count_trigger ON queries;
CREATE TRIGGER increment_queries_count_trigger
  AFTER INSERT ON queries
  FOR EACH ROW
  WHEN (NEW.session_id IS NOT NULL)
  EXECUTE FUNCTION increment_session_queries_count();

-- Function to increment click_count in search_results atomically
CREATE OR REPLACE FUNCTION increment_click_count(result_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE search_results
  SET click_count = click_count + 1
  WHERE id = result_id
  RETURNING click_count INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Note: These policies assume you'll implement authentication
-- Adjust based on your authentication strategy

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Queries table policies
CREATE POLICY "Users can view their own queries"
  ON queries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queries"
  ON queries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Search results policies (inherit from queries)
CREATE POLICY "Users can view their own search results"
  ON search_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM queries
      WHERE queries.id = search_results.query_id
      AND queries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert search results for their queries"
  ON search_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM queries
      WHERE queries.id = search_results.query_id
      AND queries.user_id = auth.uid()
    )
  );

-- User sessions policies
CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Query feedback policies
CREATE POLICY "Users can view their own feedback"
  ON query_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create feedback"
  ON query_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- API usage policies
CREATE POLICY "Users can view their own API usage"
  ON api_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Saved searches policies
CREATE POLICY "Users can view their own saved searches"
  ON saved_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches"
  ON saved_searches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches"
  ON saved_searches FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- View: Query statistics by user
CREATE OR REPLACE VIEW user_query_stats AS
SELECT
  u.id AS user_id,
  u.email,
  COUNT(q.id) AS total_queries,
  COUNT(DISTINCT DATE(q.created_at)) AS active_days,
  AVG(q.response_time_ms) AS avg_response_time_ms,
  SUM(CASE WHEN q.was_successful THEN 1 ELSE 0 END) AS successful_queries,
  MAX(q.created_at) AS last_query_at
FROM users u
LEFT JOIN queries q ON u.id = q.user_id
GROUP BY u.id, u.email;

-- View: Popular search queries
CREATE OR REPLACE VIEW popular_queries AS
SELECT
  query_text,
  query_type,
  COUNT(*) AS query_count,
  AVG(response_time_ms) AS avg_response_time_ms,
  COUNT(DISTINCT user_id) AS unique_users,
  MAX(created_at) AS last_queried_at
FROM queries
WHERE was_successful = true
GROUP BY query_text, query_type
ORDER BY query_count DESC;

-- View: Daily query statistics
CREATE OR REPLACE VIEW daily_query_stats AS
SELECT
  DATE(created_at) AS query_date,
  query_type,
  COUNT(*) AS total_queries,
  COUNT(DISTINCT user_id) AS unique_users,
  AVG(response_time_ms) AS avg_response_time_ms,
  SUM(CASE WHEN was_successful THEN 1 ELSE 0 END) AS successful_queries
FROM queries
GROUP BY DATE(created_at), query_type
ORDER BY query_date DESC, query_type;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
