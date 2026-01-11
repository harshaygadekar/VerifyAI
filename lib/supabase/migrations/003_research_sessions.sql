-- ============================================================================
-- Deep Research Mode - Database Schema
-- Migration: 003_research_sessions.sql
-- ============================================================================
-- Run this in Supabase SQL Editor to create tables for Deep Research feature
-- ============================================================================

-- ============================================================================
-- RESEARCH SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS research_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  conversation_id TEXT,
  
  -- Research parameters
  original_query TEXT NOT NULL,
  research_mode TEXT DEFAULT 'deep' CHECK (research_mode IN ('quick', 'deep', 'exhaustive')),
  additional_queries_count INTEGER DEFAULT 3,
  
  -- Research results
  expanded_queries TEXT[] DEFAULT '{}',
  total_sources_found INTEGER DEFAULT 0,
  synthesis_status TEXT DEFAULT 'pending' CHECK (synthesis_status IN ('pending', 'in_progress', 'completed', 'failed')),
  final_report TEXT,
  
  -- Cost tracking
  total_cost_usd DECIMAL(10, 6),
  total_tokens_used INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- RESEARCH QUERY RESULTS TABLE (links sessions to individual queries)
-- ============================================================================
CREATE TABLE IF NOT EXISTS research_query_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  research_session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  query_id UUID REFERENCES queries(id) ON DELETE SET NULL,
  
  -- Query details
  query_text TEXT NOT NULL,
  is_original BOOLEAN DEFAULT false,
  query_order INTEGER NOT NULL,
  
  -- Results
  sources_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_research_sessions_user_id ON research_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_conversation_id ON research_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_status ON research_sessions(synthesis_status);
CREATE INDEX IF NOT EXISTS idx_research_sessions_created ON research_sessions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_query_results_session ON research_query_results(research_session_id);
CREATE INDEX IF NOT EXISTS idx_research_query_results_query ON research_query_results(query_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE research_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_query_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own research sessions"
  ON research_sessions FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own research sessions"
  ON research_sessions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own research sessions"
  ON research_sessions FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view research query results for their sessions"
  ON research_query_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM research_sessions
      WHERE research_sessions.id = research_query_results.research_session_id
      AND research_sessions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert research query results for their sessions"
  ON research_query_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM research_sessions
      WHERE research_sessions.id = research_query_results.research_session_id
      AND research_sessions.user_id = auth.uid()::text
    )
  );

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================
COMMENT ON TABLE research_sessions IS 'Tracks deep research sessions with expanded queries and synthesized reports';
COMMENT ON TABLE research_query_results IS 'Links research sessions to individual query results for expanded queries';
