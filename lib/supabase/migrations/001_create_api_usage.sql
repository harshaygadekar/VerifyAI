-- Create api_usage table
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_query_id ON api_usage(query_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_api_provider ON api_usage(api_provider);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at DESC);

-- Enable RLS
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can view their own API usage"
  ON api_usage FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON TABLE api_usage IS 'Tracks API usage and costs';
