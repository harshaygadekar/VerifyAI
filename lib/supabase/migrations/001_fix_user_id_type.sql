-- ============================================================================
-- MIGRATION: Fix user_id type mismatch
-- Purpose: Change user_id columns from UUID to TEXT to support Clerk IDs (which are strings)
-- ============================================================================

-- 1. Drop dependent views
DROP VIEW IF EXISTS user_query_stats;
DROP VIEW IF EXISTS popular_queries;
DROP VIEW IF EXISTS daily_query_stats;

-- 2. Drop ALL policies that depend on user_id or id columns (including indirect dependencies)
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

DROP POLICY IF EXISTS "Users can view their own queries" ON queries;
DROP POLICY IF EXISTS "Users can insert their own queries" ON queries;

-- Drop search_results policies that reference queries.user_id in subqueries
DROP POLICY IF EXISTS "Users can view their own search results" ON search_results;
DROP POLICY IF EXISTS "Users can insert search results for their queries" ON search_results;

DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON user_sessions;

DROP POLICY IF EXISTS "Users can view their own feedback" ON query_feedback;
DROP POLICY IF EXISTS "Users can create feedback" ON query_feedback;

DROP POLICY IF EXISTS "Users can view their own API usage" ON api_usage;

DROP POLICY IF EXISTS "Users can view their own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can create saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can update their own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can delete their own saved searches" ON saved_searches;

-- 3. Drop foreign key constraints
ALTER TABLE queries DROP CONSTRAINT IF EXISTS queries_user_id_fkey;
ALTER TABLE saved_searches DROP CONSTRAINT IF EXISTS saved_searches_user_id_fkey;
ALTER TABLE api_usage DROP CONSTRAINT IF EXISTS api_usage_user_id_fkey;
ALTER TABLE query_feedback DROP CONSTRAINT IF EXISTS query_feedback_user_id_fkey;
ALTER TABLE user_sessions DROP CONSTRAINT IF EXISTS user_sessions_user_id_fkey;

-- 4. Change users.id to TEXT
ALTER TABLE users ALTER COLUMN id TYPE TEXT;

-- 5. Change referencing columns to TEXT
ALTER TABLE queries ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE saved_searches ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE api_usage ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE query_feedback ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE user_sessions ALTER COLUMN user_id TYPE TEXT;

-- 6. Re-add foreign key constraints
ALTER TABLE queries 
  ADD CONSTRAINT queries_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE saved_searches 
  ADD CONSTRAINT saved_searches_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE api_usage 
  ADD CONSTRAINT api_usage_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE query_feedback 
  ADD CONSTRAINT query_feedback_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_sessions 
  ADD CONSTRAINT user_sessions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 7. Re-create policies (casting auth.uid() to text)

-- Users table policies
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid()::text = id);

-- Queries policies
CREATE POLICY "Users can view their own queries"
  ON queries FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own queries"
  ON queries FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Search results policies (inherit from queries)
CREATE POLICY "Users can view their own search results"
  ON search_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM queries
      WHERE queries.id = search_results.query_id
      AND queries.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert search results for their queries"
  ON search_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM queries
      WHERE queries.id = search_results.query_id
      AND queries.user_id = auth.uid()::text
    )
  );

-- User sessions policies
CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own sessions"
  ON user_sessions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Query feedback policies
CREATE POLICY "Users can view their own feedback"
  ON query_feedback FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create feedback"
  ON query_feedback FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- API usage policies
CREATE POLICY "Users can view their own API usage"
  ON api_usage FOR SELECT
  USING (auth.uid()::text = user_id);

-- Saved searches policies
CREATE POLICY "Users can view their own saved searches"
  ON saved_searches FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own saved searches"
  ON saved_searches FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own saved searches"
  ON saved_searches FOR DELETE
  USING (auth.uid()::text = user_id);

-- 8. Re-create views

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
