# VerifyAI High-Impact Features - Detailed Implementation Guide

This document provides a comprehensive breakdown of the **5 high-impact features** proposed for VerifyAI based on Exa API and AI SDK integration. Each feature includes:
- **User flow & UI interaction**
- **Database schema requirements**
- **Technical integration details**

---

## Table of Contents
1. [Deep Research Mode](#1-deep-research-mode)
2. [Direct Answer Engine](#2-direct-answer-engine)
3. [Similar Content Discovery](#3-similar-content-discovery)
4. [Structured Summary Extraction](#4-structured-summary-extraction)
5. [Category-Focused Search](#5-category-focused-search)

---

## 1. Deep Research Mode

### Feature Overview
Enables comprehensive, multi-query research with query expansion and detailed context. Users can trigger in-depth analysis that automatically explores multiple query variations.

### User Flow & UI Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│  VerifyAI Search Interface                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Enter your query...]                           🔍 Search      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Search Mode:                                               ││
│  │  ○ Quick Search (default)                                   ││
│  │  ● Deep Research Mode 🔬                                    ││
│  │    └── Expand to 5 related queries automatically            ││
│  │                                                             ││
│  │  [⚙️ Advanced Options]                                      ││
│  │    └── Additional Queries: [5] (1-10)                       ││
│  │    └── Include subpages: ☑                                  ││
│  │    └── Live crawl: ☑ Force fresh results                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Step-by-Step User Flow:**

1. **User enters query** → e.g., "Is climate change causing more hurricanes?"
2. **User toggles "Deep Research Mode"** → UI shows additional options
3. **User clicks "Search"** → Loading state shows progress:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │  🔬 Deep Research In Progress...                            │
   │                                                              │
   │  ✓ Original query searched                                   │
   │  ✓ Expanding to related queries...                           │
   │  ⟳ Searching: "hurricane frequency climate data"             │
   │  ○ Pending: 3 more queries                                   │
   │                                                              │
   │  [━━━━━━━━━━░░░░░░░░░░] 40%                                  │
   └─────────────────────────────────────────────────────────────┘
   ```
4. **Results display** → Grouped by query expansion with citations:
   ```
   ┌─────────────────────────────────────────────────────────────┐
   │  📊 Deep Research Report                                     │
   │  Query: "Is climate change causing more hurricanes?"         │
   │  ─────────────────────────────────────────────────────────   │
   │                                                              │
   │  📈 Research Summary                                         │
   │  [AI-synthesized comprehensive answer with inline citations] │
   │                                                              │
   │  🔍 Queries Explored (5)                                     │
   │  ├── Original: "Is climate change causing..." (12 sources)  │
   │  ├── Expanded: "hurricane intensity trends data" (8 sources)│
   │  ├── Expanded: "NOAA climate hurricane research" (6 sources)│
   │  └── [Show more expansions...]                               │
   │                                                              │
   │  📚 All Sources (34 total)                      [Export PDF] │
   │  ┌─────────────────────────────────────────────────────────┐│
   │  │ 1. NOAA Hurricane Research Division                     ││
   │  │    noaa.gov/hurricanes • Cited 8 times                  ││
   │  │    [View highlights] [Find similar]                     ││
   │  └─────────────────────────────────────────────────────────┘│
   └─────────────────────────────────────────────────────────────┘
   ```

### Database Schema Changes

```sql
-- New table: research_sessions
-- Tracks deep research sessions with multiple queries
CREATE TABLE IF NOT EXISTS research_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Research parameters
  original_query TEXT NOT NULL,
  research_mode TEXT DEFAULT 'deep' CHECK (research_mode IN ('quick', 'deep', 'exhaustive')),
  additional_queries_count INTEGER DEFAULT 5,
  include_subpages BOOLEAN DEFAULT false,
  force_live_crawl BOOLEAN DEFAULT false,
  
  -- Research results
  expanded_queries TEXT[] DEFAULT '{}', -- Array of auto-generated queries
  total_sources_found INTEGER DEFAULT 0,
  synthesis_status TEXT DEFAULT 'pending' CHECK (synthesis_status IN ('pending', 'in_progress', 'completed', 'failed')),
  final_report TEXT, -- AI-synthesized research report
  
  -- Cost tracking
  total_cost_usd DECIMAL(10, 6),
  total_tokens_used INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_research_sessions_user_id ON research_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_conversation_id ON research_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_research_sessions_status ON research_sessions(synthesis_status);

-- Link table: research_query_results
-- Links research sessions to individual query results
CREATE TABLE IF NOT EXISTS research_query_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  research_session_id UUID NOT NULL REFERENCES research_sessions(id) ON DELETE CASCADE,
  query_id UUID NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
  
  -- Query details
  query_text TEXT NOT NULL,
  is_original BOOLEAN DEFAULT false, -- true for original query, false for expansions
  query_order INTEGER NOT NULL, -- 0 for original, 1-N for expansions
  
  -- Results
  sources_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_query_results_session ON research_query_results(research_session_id);
```

### TypeScript Types

```typescript
// Add to lib/db/types.ts

export type ResearchMode = 'quick' | 'deep' | 'exhaustive'
export type SynthesisStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface ResearchSession {
  id: string
  user_id: string | null
  conversation_id: string | null
  original_query: string
  research_mode: ResearchMode
  additional_queries_count: number
  include_subpages: boolean
  force_live_crawl: boolean
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
  query_id: string
  query_text: string
  is_original: boolean
  query_order: number
  sources_count: number
  created_at: string
}
```

---

## 2. Direct Answer Engine

### Feature Overview
Provides instant, citation-backed answers for factual queries without requiring full search processing. Automatically distinguishes between direct answers and detailed summaries.

### User Flow & UI Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│  VerifyAI - Quick Answer Mode                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  💡 Quick Answers Toggle                                         │
│  [━━━━━━━━━━━━━━━━━━━━━] ON                                      │
│  Get instant answers for factual questions                       │
│                                                                  │
│  [What is the population of Japan?_________]    ⚡ Quick Answer  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Step-by-Step User Flow:**

1. **User enables "Quick Answers"** → Toggle in settings or inline
2. **User asks factual question** → "What is the population of Japan?"
3. **System auto-detects query type** → Determines if suitable for direct answer
4. **Quick Answer displays** → Streaming response with inline citations:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚡ Quick Answer                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Japan's population is approximately 125.1 million people[¹]    │
│  as of 2024. The country has been experiencing population       │
│  decline since 2010[²], with an aging demographic[³].           │
│                                                                  │
│  ───────────────────────────────────────────────────────────    │
│  📖 Sources                                                      │
│  [1] worldbank.org - World Population Data 2024                 │
│  [2] stats.go.jp - Japan Statistics Bureau                      │
│  [3] un.org - UN Population Prospects                           │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  🔍 Want more details?                                          │
│  [Run Full Search] [View Related Topics]                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Query Classification UI Feedback:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Query Analysis                                                  │
├─────────────────────────────────────────────────────────────────┤
│  "What is the population of Japan?"                              │
│                                                                  │
│  Detected: ✓ Factual Question                                   │
│  Answer Type: Direct Answer (single fact)                        │
│  Confidence: 94%                                                 │
│                                                                  │
│  [Use Quick Answer] [Run Deep Search Instead]                    │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema Changes

```sql
-- New table: direct_answers
-- Caches direct answers for reuse and analytics
CREATE TABLE IF NOT EXISTS direct_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Query classification
  original_query TEXT NOT NULL,
  normalized_query TEXT, -- Lowercase, trimmed for cache matching
  query_classification TEXT DEFAULT 'factual' 
    CHECK (query_classification IN ('factual', 'open_ended', 'comparative', 'definition', 'procedural')),
  classification_confidence DECIMAL(3, 2), -- 0.00 to 1.00
  
  -- Answer content
  answer_text TEXT NOT NULL,
  answer_type TEXT DEFAULT 'direct' 
    CHECK (answer_type IN ('direct', 'summary', 'detailed')),
  was_streamed BOOLEAN DEFAULT false,
  
  -- Citations stored as JSONB array
  citations JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"index": 1, "url": "...", "title": "...", "text": "..."}]
  
  -- Source metadata
  sources_used INTEGER DEFAULT 0,
  exa_cost_usd DECIMAL(10, 6),
  
  -- Cache control
  is_cached BOOLEAN DEFAULT true,
  cache_expires_at TIMESTAMP WITH TIME ZONE,
  cache_hit_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for efficient cache lookups
CREATE INDEX IF NOT EXISTS idx_direct_answers_normalized_query 
  ON direct_answers(normalized_query);
CREATE INDEX IF NOT EXISTS idx_direct_answers_user_id 
  ON direct_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_direct_answers_cache 
  ON direct_answers(is_cached, cache_expires_at) 
  WHERE is_cached = true;

-- Function to check cache before querying Exa
CREATE OR REPLACE FUNCTION get_cached_answer(query_text TEXT)
RETURNS TABLE (
  id UUID,
  answer_text TEXT,
  citations JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.id,
    da.answer_text,
    da.citations,
    da.created_at
  FROM direct_answers da
  WHERE da.normalized_query = LOWER(TRIM(query_text))
    AND da.is_cached = true
    AND (da.cache_expires_at IS NULL OR da.cache_expires_at > NOW())
  ORDER BY da.created_at DESC
  LIMIT 1;
  
  -- Increment cache hit count
  UPDATE direct_answers
  SET cache_hit_count = cache_hit_count + 1
  WHERE normalized_query = LOWER(TRIM(query_text))
    AND is_cached = true;
END;
$$ LANGUAGE plpgsql;
```

### TypeScript Types

```typescript
// Add to lib/db/types.ts

export type QueryClassification = 'factual' | 'open_ended' | 'comparative' | 'definition' | 'procedural'
export type AnswerType = 'direct' | 'summary' | 'detailed'

export interface Citation {
  index: number
  url: string
  title: string
  text: string
  domain?: string
}

export interface DirectAnswer {
  id: string
  query_id: string | null
  user_id: string | null
  original_query: string
  normalized_query: string | null
  query_classification: QueryClassification
  classification_confidence: number | null
  answer_text: string
  answer_type: AnswerType
  was_streamed: boolean
  citations: Citation[]
  sources_used: number
  exa_cost_usd: number | null
  is_cached: boolean
  cache_expires_at: string | null
  cache_hit_count: number
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}
```

---

## 3. Similar Content Discovery

### Feature Overview
Allows users to find semantically similar content based on any URL from search results. Enables "Find More Like This" functionality.

### User Flow & UI Interaction

**On Search Result Cards:**

```
┌─────────────────────────────────────────────────────────────────┐
│  📰 Search Result #3                                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Climate Change Impact on Hurricane Intensity                    │
│  nature.com/articles/climate-hurricanes-2024                     │
│                                                                  │
│  "New research published in Nature shows a clear correlation     │
│  between rising ocean temperatures and hurricane intensity..."   │
│                                                                  │
│  ─────────────────────────────────────────────────────────────   │
│  [📖 Read More] [📋 Copy] [⭐ Bookmark] [🔗 Find Similar ▼]      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**"Find Similar" Dropdown Options:**

```
┌─────────────────────────────────────────────────────────────────┐
│  🔗 Find Similar Content                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📚 Same Topic          (Find articles about same topic)        │
│  🏢 Same Domain         (More from nature.com)                  │
│  📅 Same Time Period    (Articles from same timeframe)          │
│  🔬 Academic Sources    (Research papers only)                  │
│  📰 News Sources        (News articles only)                    │
│  ─────────────────────────────────────────────────────────────   │
│  ⚙️ Custom Filters...                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Similar Results Display (Slide-out Panel):**

```
┌─────────────────────────────────────────────────────────────────┐
│  🔗 Similar to: Climate Change Impact on Hurricane Intensity    │
│  [✕ Close]                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Found 15 similar articles                      [Sort: Relevance]│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1. Hurricane Seasons & Climate: A 50-Year Analysis          ││
│  │    sciencedaily.com • 95% similar • Published Mar 2024      ││
│  │    [Add to Sources] [Compare Side-by-Side]                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 2. NOAA: Tropical Storm Frequency and Climate Data          ││
│  │    noaa.gov • 91% similar • Published Feb 2024              ││
│  │    [Add to Sources] [Compare Side-by-Side]                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [Load More (13 remaining)]                                      │
│                                                                  │
│  ─────────────────────────────────────────────────────────────   │
│  💡 Pro Tip: Add similar sources to strengthen your research    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema Changes

```sql
-- New table: similar_content_searches
-- Tracks find similar operations
CREATE TABLE IF NOT EXISTS similar_content_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  source_result_id UUID REFERENCES search_results(id) ON DELETE SET NULL,
  query_id UUID REFERENCES queries(id) ON DELETE SET NULL,
  
  -- Source URL that was used as the seed
  source_url TEXT NOT NULL,
  source_title TEXT,
  
  -- Search parameters
  similarity_type TEXT DEFAULT 'topic' 
    CHECK (similarity_type IN ('topic', 'domain', 'timeframe', 'academic', 'news', 'custom')),
  include_domains TEXT[] DEFAULT '{}',
  exclude_domains TEXT[] DEFAULT '{}',
  date_range_start DATE,
  date_range_end DATE,
  num_results_requested INTEGER DEFAULT 10,
  
  -- Results
  results_found INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Link table: similar_content_results
-- Stores the similar content found for each search
CREATE TABLE IF NOT EXISTS similar_content_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  similar_search_id UUID NOT NULL REFERENCES similar_content_searches(id) ON DELETE CASCADE,
  
  -- Result details
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  summary TEXT,
  
  -- Similarity metrics
  similarity_score DECIMAL(3, 2), -- 0.00 to 1.00
  rank INTEGER NOT NULL,
  
  -- Source metadata
  published_date TIMESTAMP WITH TIME ZONE,
  domain TEXT,
  author TEXT,
  
  -- User actions
  was_added_to_sources BOOLEAN DEFAULT false,
  was_compared BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_similar_content_searches_user 
  ON similar_content_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_similar_content_searches_source 
  ON similar_content_searches(source_url);
CREATE INDEX IF NOT EXISTS idx_similar_content_results_search 
  ON similar_content_results(similar_search_id);
CREATE INDEX IF NOT EXISTS idx_similar_content_results_score 
  ON similar_content_results(similarity_score DESC);
```

### TypeScript Types

```typescript
// Add to lib/db/types.ts

export type SimilarityType = 'topic' | 'domain' | 'timeframe' | 'academic' | 'news' | 'custom'

export interface SimilarContentSearch {
  id: string
  user_id: string | null
  source_result_id: string | null
  query_id: string | null
  source_url: string
  source_title: string | null
  similarity_type: SimilarityType
  include_domains: string[]
  exclude_domains: string[]
  date_range_start: string | null
  date_range_end: string | null
  num_results_requested: number
  results_found: number
  created_at: string
  metadata: Record<string, any>
}

export interface SimilarContentResult {
  id: string
  similar_search_id: string
  url: string
  title: string
  description: string | null
  summary: string | null
  similarity_score: number | null
  rank: number
  published_date: string | null
  domain: string | null
  author: string | null
  was_added_to_sources: boolean
  was_compared: boolean
  created_at: string
  metadata: Record<string, any>
}
```

---

## 4. Structured Summary Extraction

### Feature Overview
Extracts structured, schema-validated data from web pages using JSON Schema definitions. Enables consistent data extraction for fact-checking.

### User Flow & UI Interaction

**Template Selection UI:**

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Structured Extraction                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Select extraction template:                                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📋 Claim Verification                        [Use Template] ││
│  │    Extracts: claim, evidence, source, date, confidence      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📊 Statistics Extraction                     [Use Template] ││
│  │    Extracts: metric, value, unit, context, source           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 💬 Quote Attribution                         [Use Template] ││
│  │    Extracts: quote, speaker, date, context, verified        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ➕ Create Custom Template...                                ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Structured Results Display:**

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Extracted Claims from Search Results                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Using template: "Claim Verification"                            │
│  Extracted 8 claims from 5 sources                               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Claim #1                                        Confidence: │││
│  │ ─────────────────────────────────────────────────────────   ││
│  │ "Global temperatures have risen 1.1°C since 1880"          ││
│  │                                                             ││
│  │ Evidence: NASA climate data, NOAA records                   ││
│  │ Source: nasa.gov/climate                                    ││
│  │ Date: 2024-03-15                                            ││
│  │ Confidence: ████████░░ 87%                                  ││
│  │                                                             ││
│  │ [Verify] [View Original] [Compare with Other Claims]        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Claim #2                                        Confidence: │││
│  │ ─────────────────────────────────────────────────────────   ││
│  │ "Sea levels will rise 2 feet by 2050"                       ││
│  │                                                             ││
│  │ Evidence: IPCC projections, coastal monitoring data         ││
│  │ Source: ipcc.ch/report/ocean                                ││
│  │ Date: 2023-09-20                                            ││
│  │ Confidence: ██████░░░░ 62%                                  ││
│  │ ⚠️ Conflicting data found - 3 sources disagree              ││
│  │                                                             ││
│  │ [Verify] [View Original] [Compare with Other Claims]        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [Export as JSON] [Export as CSV] [Generate Report]             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema Changes

```sql
-- New table: extraction_templates
-- User-defined or system templates for structured extraction
CREATE TABLE IF NOT EXISTS extraction_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL for system templates
  
  -- Template details
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT DEFAULT 'claim' 
    CHECK (template_type IN ('claim', 'statistic', 'quote', 'event', 'person', 'organization', 'custom')),
  is_system_template BOOLEAN DEFAULT false,
  
  -- JSON Schema for extraction (Zod-compatible)
  schema_definition JSONB NOT NULL,
  -- Example: {
  --   "claim": {"type": "string", "description": "The main claim"},
  --   "evidence": {"type": "array", "items": {"type": "string"}},
  --   "confidence": {"type": "number", "min": 0, "max": 100}
  -- }
  
  -- Usage stats
  usage_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- New table: extracted_data
-- Stores structured data extracted from sources
CREATE TABLE IF NOT EXISTS extracted_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  query_id UUID REFERENCES queries(id) ON DELETE CASCADE,
  template_id UUID REFERENCES extraction_templates(id) ON DELETE SET NULL,
  source_result_id UUID REFERENCES search_results(id) ON DELETE CASCADE,
  
  -- Extracted structured data
  extracted_content JSONB NOT NULL,
  -- Example for claim: {
  --   "claim": "Global temperatures have risen 1.1°C",
  --   "evidence": ["NASA data", "NOAA records"],
  --   "source": "nasa.gov",
  --   "date": "2024-03-15",
  --   "confidence": 87
  -- }
  
  -- Validation status
  is_valid BOOLEAN DEFAULT true,
  validation_errors JSONB DEFAULT '[]'::jsonb,
  
  -- Confidence and verification
  extraction_confidence DECIMAL(3, 2), -- 0.00 to 1.00
  has_conflicts BOOLEAN DEFAULT false,
  conflict_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_extraction_templates_user 
  ON extraction_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_extraction_templates_type 
  ON extraction_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_extracted_data_user 
  ON extracted_data(user_id);
CREATE INDEX IF NOT EXISTS idx_extracted_data_query 
  ON extracted_data(query_id);
CREATE INDEX IF NOT EXISTS idx_extracted_data_template 
  ON extracted_data(template_id);
CREATE INDEX IF NOT EXISTS idx_extracted_data_content 
  ON extracted_data USING gin(extracted_content);
```

### TypeScript Types

```typescript
// Add to lib/db/types.ts

export type ExtractionTemplateType = 'claim' | 'statistic' | 'quote' | 'event' | 'person' | 'organization' | 'custom'

export interface SchemaField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  description?: string
  required?: boolean
  items?: SchemaField // For arrays
  properties?: Record<string, SchemaField> // For objects
  min?: number
  max?: number
}

export interface ExtractionTemplate {
  id: string
  user_id: string | null
  name: string
  description: string | null
  template_type: ExtractionTemplateType
  is_system_template: boolean
  schema_definition: Record<string, SchemaField>
  usage_count: number
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export interface ExtractedData {
  id: string
  user_id: string | null
  query_id: string | null
  template_id: string | null
  source_result_id: string
  extracted_content: Record<string, any>
  is_valid: boolean
  validation_errors: string[]
  extraction_confidence: number | null
  has_conflicts: boolean
  conflict_count: number
  created_at: string
  metadata: Record<string, any>
}
```

---

## 5. Category-Focused Search

### Feature Overview
Enables specialized searches filtered by content category: research papers, news, financial reports, GitHub, tweets, and company/people profiles.

### User Flow & UI Interaction

**Category Selection Interface:**

```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 VerifyAI Search                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Search query...]                                   🔍 Search   │
│                                                                  │
│  📁 Search Category:                                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 🌐 All Sources        ○  (Default web search)               ││
│  │ 📚 Research Papers    ○  (Academic & scientific)            ││
│  │ 📰 News               ○  (Current events & journalism)      ││
│  │ 📊 Financial Reports  ○  (SEC filings, earnings, analysis)  ││
│  │ 💻 GitHub             ○  (Code, repos, technical docs)      ││
│  │ 🐦 Social Media       ○  (Tweets, posts, discussions)       ││
│  │ 🏢 Companies          ○  (Company profiles & info)          ││
│  │ 👤 People             ○  (Personal profiles & bios)         ││
│  │ 📄 PDFs               ○  (PDF documents only)               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ⚙️ Category-specific filters available after selection         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Category-Specific Results Display:**

**For Research Papers:**
```
┌─────────────────────────────────────────────────────────────────┐
│  📚 Research Paper Results                                       │
│  Query: "CRISPR gene therapy efficacy"                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Found 45 academic papers                    [Sort: Citations ▼]│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📄 CRISPR-Cas9 Therapeutic Applications: A Meta-Analysis    ││
│  │    Published: Nature Medicine, 2024                         ││
│  │    Authors: Smith, J., Chen, L., et al.                     ││
│  │    Citations: 234 • Impact Factor: 82.9                     ││
│  │    DOI: 10.1038/s41591-024-xxxxx                            ││
│  │                                                              ││
│  │    Abstract: This meta-analysis examines the efficacy of... ││
│  │                                                              ││
│  │    [📥 PDF] [📋 Cite] [🔗 Related Papers] [📊 Metrics]       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**For GitHub:**
```
┌─────────────────────────────────────────────────────────────────┐
│  💻 GitHub Results                                               │
│  Query: "react state management library"                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Found 28 repositories                           [Sort: Stars ▼]│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ⭐ 45.2k | zustand                                          ││
│  │    pmndrs/zustand                                            ││
│  │    🐻 Bear necessities for state management in React        ││
│  │                                                              ││
│  │    Language: TypeScript • License: MIT                       ││
│  │    Last updated: 2 days ago • Issues: 12 open               ││
│  │                                                              ││
│  │    [View Repo] [README] [Documentation] [Compare]            ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**For Financial Reports:**
```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Financial Report Results                                     │
│  Query: "Apple Q3 2024 earnings"                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Found 18 financial documents                   [Sort: Date ▼]  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 📈 Apple Inc. Q3 2024 10-Q Filing                           ││
│  │    SEC EDGAR • Filed: August 1, 2024                        ││
│  │    Document Type: 10-Q (Quarterly Report)                   ││
│  │                                                              ││
│  │    Key Metrics Extracted:                                   ││
│  │    • Revenue: $85.8B (+5% YoY)                              ││
│  │    • Net Income: $21.4B                                     ││
│  │    • EPS: $1.40                                             ││
│  │                                                              ││
│  │    [View Full Report] [Download PDF] [Compare Quarters]      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema Changes

```sql
-- Extend queries table with category support
ALTER TABLE queries 
ADD COLUMN IF NOT EXISTS search_category TEXT DEFAULT 'all'
  CHECK (search_category IN (
    'all', 'research_paper', 'news', 'financial_report', 
    'github', 'tweet', 'company', 'person', 'pdf'
  ));

-- New table: category_search_configs
-- Stores user preferences for each category
CREATE TABLE IF NOT EXISTS category_search_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Category settings
  category TEXT NOT NULL CHECK (category IN (
    'all', 'research_paper', 'news', 'financial_report', 
    'github', 'tweet', 'company', 'person', 'pdf'
  )),
  
  -- Default filters for this category
  default_sort TEXT, -- e.g., 'date', 'relevance', 'citations', 'stars'
  default_date_range TEXT, -- e.g., 'past_week', 'past_month', 'past_year', 'all'
  preferred_domains TEXT[] DEFAULT '{}',
  excluded_domains TEXT[] DEFAULT '{}',
  
  -- Display preferences
  results_per_page INTEGER DEFAULT 10,
  show_summaries BOOLEAN DEFAULT true,
  show_metadata BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one config per user per category
  UNIQUE(user_id, category),
  
  metadata JSONB DEFAULT '{}'::jsonb
);

-- New table: category_specific_results
-- Stores category-specific metadata for search results
CREATE TABLE IF NOT EXISTS category_specific_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_result_id UUID NOT NULL REFERENCES search_results(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  
  -- Category-specific data stored as JSONB
  category_data JSONB NOT NULL,
  -- Examples:
  -- For research_paper: {"doi": "...", "citations": 234, "impact_factor": 82.9, "authors": [...]}
  -- For github: {"stars": 45200, "forks": 3400, "language": "TypeScript", "license": "MIT"}
  -- For financial_report: {"filing_type": "10-Q", "revenue": 85800000000, "eps": 1.40}
  -- For tweet: {"retweets": 1200, "likes": 5600, "verified": true}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one category data per result
  UNIQUE(search_result_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_queries_category 
  ON queries(search_category);
CREATE INDEX IF NOT EXISTS idx_category_search_configs_user 
  ON category_search_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_category_specific_results_category 
  ON category_specific_results(category);
CREATE INDEX IF NOT EXISTS idx_category_specific_results_data 
  ON category_specific_results USING gin(category_data);
```

### TypeScript Types

```typescript
// Add to lib/db/types.ts

export type SearchCategory = 
  | 'all' 
  | 'research_paper' 
  | 'news' 
  | 'financial_report' 
  | 'github' 
  | 'tweet' 
  | 'company' 
  | 'person' 
  | 'pdf'

export type CategorySortOption = 'date' | 'relevance' | 'citations' | 'stars' | 'likes' | 'revenue'

export type DateRange = 'past_day' | 'past_week' | 'past_month' | 'past_year' | 'all'

export interface CategorySearchConfig {
  id: string
  user_id: string
  category: SearchCategory
  default_sort: CategorySortOption | null
  default_date_range: DateRange | null
  preferred_domains: string[]
  excluded_domains: string[]
  results_per_page: number
  show_summaries: boolean
  show_metadata: boolean
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

// Category-specific data types
export interface ResearchPaperData {
  doi: string
  citations: number
  impact_factor: number
  authors: string[]
  journal: string
  abstract: string
}

export interface GitHubData {
  stars: number
  forks: number
  language: string
  license: string
  open_issues: number
  last_updated: string
}

export interface FinancialReportData {
  filing_type: '10-K' | '10-Q' | '8-K' | 'earnings'
  revenue: number
  net_income: number
  eps: number
  period: string
}

export interface TweetData {
  retweets: number
  likes: number
  replies: number
  verified: boolean
  user_followers: number
}

export type CategoryData = 
  | ResearchPaperData 
  | GitHubData 
  | FinancialReportData 
  | TweetData 
  | Record<string, any>

export interface CategorySpecificResult {
  id: string
  search_result_id: string
  category: SearchCategory
  category_data: CategoryData
  created_at: string
}
```

---

## Summary: Complete Database Migration

Here's the complete SQL migration file combining all new tables:

```sql
-- Migration: Add High-Impact Features Tables
-- Run after: 002_conversations_messages.sql

-- 1. Research Sessions Tables
CREATE TABLE IF NOT EXISTS research_sessions (...);
CREATE TABLE IF NOT EXISTS research_query_results (...);

-- 2. Direct Answers Table
CREATE TABLE IF NOT EXISTS direct_answers (...);

-- 3. Similar Content Tables
CREATE TABLE IF NOT EXISTS similar_content_searches (...);
CREATE TABLE IF NOT EXISTS similar_content_results (...);

-- 4. Structured Extraction Tables
CREATE TABLE IF NOT EXISTS extraction_templates (...);
CREATE TABLE IF NOT EXISTS extracted_data (...);

-- 5. Category Search Tables
ALTER TABLE queries ADD COLUMN search_category ...;
CREATE TABLE IF NOT EXISTS category_search_configs (...);
CREATE TABLE IF NOT EXISTS category_specific_results (...);

-- Insert system templates for structured extraction
INSERT INTO extraction_templates (name, description, template_type, is_system_template, schema_definition)
VALUES 
  ('Claim Verification', 'Extract claims with evidence and confidence', 'claim', true, 
   '{"claim": {"type": "string"}, "evidence": {"type": "array"}, "source": {"type": "string"}, "confidence": {"type": "number"}}'::jsonb),
  ('Statistics Extraction', 'Extract numerical data and metrics', 'statistic', true,
   '{"metric": {"type": "string"}, "value": {"type": "number"}, "unit": {"type": "string"}, "context": {"type": "string"}}'::jsonb),
  ('Quote Attribution', 'Extract quotes with speaker info', 'quote', true,
   '{"quote": {"type": "string"}, "speaker": {"type": "string"}, "date": {"type": "string"}, "verified": {"type": "boolean"}}'::jsonb);
```

---

## UI Component Summary

| Feature | Main Component | Key UI Elements |
|---------|---------------|-----------------|
| Deep Research | `ResearchModeToggle` | Toggle, progress indicator, expandable query tree |
| Direct Answer | `QuickAnswerPanel` | Inline citations, answer card, "Run Full Search" CTA |
| Similar Content | `FindSimilarButton` | Dropdown menu, slide-out panel, similarity scores |
| Structured Extraction | `ExtractionTemplateSelector` | Template cards, structured result cards, export buttons |
| Category Search | `CategorySelector` | Radio buttons, category-specific result cards |

---

This document provides a complete blueprint for implementing these high-impact features with full database support and detailed UI specifications.
