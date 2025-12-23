-- ============================================================================
-- VerifyAI Chat History Migration
-- ============================================================================
-- This migration adds conversations and messages tables for proper
-- ChatGPT/Gemini-like chat history functionality.
--
-- Run this in Supabase SQL Editor after the initial schema.
-- ============================================================================

-- ============================================================================
-- TABLE: conversations
-- Represents a chat session shown in the sidebar
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Note: user_id is TEXT to match users.id if stored as Clerk ID or email
  -- If your users.id is UUID, change this back to UUID REFERENCES users(id)
  user_id TEXT NOT NULL,
  
  -- Conversation metadata
  title TEXT NOT NULL DEFAULT 'New conversation',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Optional: Link to first query for sources/results (backwards compat)
  first_query_id UUID REFERENCES queries(id) ON DELETE SET NULL,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: messages
-- Stores individual messages within a conversation
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- AI SDK UIMessage parts (for rich content like sources, tools)
  parts JSONB,
  
  -- Additional metadata (sources, follow-ups, etc.)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Link to query record (for sources, search results)
  query_id UUID REFERENCES queries(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_query_id ON messages(query_id);

-- ============================================================================
-- RLS POLICIES for new tables
-- ============================================================================
-- Note: Since you're using Clerk for authentication (not Supabase Auth),
-- auth.uid() won't work. The server uses service role key which bypasses RLS.
-- Disabling RLS for these tables since access is controlled at the application layer.
-- If you want to enable RLS later, you'll need to implement custom policies.

ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE conversations IS 'Chat sessions shown in the sidebar, like ChatGPT/Gemini';
COMMENT ON TABLE messages IS 'Individual messages within a conversation';
COMMENT ON COLUMN conversations.title IS 'Auto-generated title after first exchange';
COMMENT ON COLUMN conversations.updated_at IS 'Used for sidebar sorting (latest activity on top)';
COMMENT ON COLUMN messages.parts IS 'AI SDK UIMessage parts for rich content';
COMMENT ON COLUMN messages.metadata IS 'Sources, follow-ups, ticker, queryId, etc.';

