# VerifyAI - Technical Architecture Documentation

## Overview

VerifyAI is an AI-powered search and research assistant built with **Next.js 15** (App Router), **Supabase** (PostgreSQL + Auth), **Clerk** (authentication), **Exa API** (web search), and **Groq** (LLM inference). It provides two primary modes: **Quick Search** for fast web searches with AI synthesis, and **Deep Research** for comprehensive multi-query research with source aggregation.

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15 + React 19 | App Router, Server Components, Client Components |
| **Styling** | Tailwind CSS + Shadcn/UI | Modern UI with dark mode support |
| **Authentication** | Clerk | User auth, session management |
| **Database** | Supabase (PostgreSQL) | Conversations, messages, bookmarks, research sessions |
| **Search API** | Exa API | Neural web search with content extraction |
| **LLM** | Groq (Llama 3.1 8B) | Fast inference for synthesis and follow-ups |
| **AI SDK** | Vercel AI SDK v5 | Streaming, chat hooks, transport layer |
| **PDF Generation** | jsPDF | Client-side PDF export |

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  ┌─────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ SearchForm  │  │ ModernChatInterface│  │ ResearchModeToggle │ │
│  └──────┬──────┘  └────────┬─────────┘  └─────────┬─────────┘  │
│         │                  │                      │             │
│         └──────────────────┼──────────────────────┘             │
│                            ▼                                    │
│                    useChat Hook (AI SDK)                        │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │ HTTP POST (streaming)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   API Route: /api/verifyai/search               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Research Mode Detection                                │   │
│  │  if (isResearchMode) → Forward to research handler      │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                │                      │
│         ▼                                ▼                      │
│  ┌─────────────────┐          ┌─────────────────────────────┐  │
│  │ Quick Search    │          │ Deep Research Handler       │  │
│  │ - 1 Exa query   │          │ - LLM query expansion       │  │
│  │ - AI synthesis  │          │ - Parallel Exa searches     │  │
│  │ - Follow-ups    │          │ - Source deduplication      │  │
│  └────────┬────────┘          │ - Progress streaming        │  │
│           │                   │ - Comprehensive synthesis   │  │
│           │                   └──────────────┬──────────────┘  │
│           │                                  │                  │
│           └──────────────────┬───────────────┘                  │
│                              ▼                                  │
│                    createUIMessageStream()                      │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │ Server-Sent Events (SSE)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Database                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │ conversations│  │   messages   │  │ research_sessions  │    │
│  └──────────────┘  └──────────────┘  └────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Features

### 1. Quick Search Mode

**Flow:**
1. User submits query via `SearchComponent` or `ModernChatInterface`
2. `useChat` hook (AI SDK v5) sends POST to `/api/verifyai/search`
3. API calls Exa API for neural web search
4. Results transformed and sent as `data-sources` stream event
5. Context prepared for LLM (sources + query)
6. Groq generates synthesis via `streamText()`
7. Text chunks streamed to UI as `text-delta` events
8. Follow-up questions generated and sent as `data-followup`
9. Conversation + messages saved to Supabase

**Key Code Path:**
```
app/page.tsx → useChat() → /api/verifyai/search/route.ts → Exa API + Groq
```

---

### 2. Deep Research Mode

**Flow:**
1. User enables "Deep Research" toggle and sets query count (3-7)
2. `prepareSendMessagesRequest` callback injects `isResearchMode: true` + options into request body
3. API route detects research mode and forwards to research handler
4. **Query Expansion**: Groq generates N diverse search queries from original
5. **Parallel Search**: All queries executed against Exa API simultaneously
6. **Progress Streaming**: `data-research-progress` events sent at each stage:
   - `expanding` (10%) - Query expansion phase
   - `searching` (20-80%) - Each query search with current/total
   - `synthesizing` (85%) - Report generation
   - `complete` (100%) - Done
7. **Source Deduplication**: Unique sources by URL
8. **Grouped Results**: `data-queries-explored` event with sources per query
9. **Comprehensive Synthesis**: Groq generates detailed research report
10. Session saved to `research_sessions` table

**Key Code Path:**
```
app/page.tsx → useChat() → /api/verifyai/search → handleResearchRequest()
                         ↓
              research/route.ts (query expansion, parallel search, synthesis)
```

**Progress Indicator Component:**
```tsx
// components/research-progress-indicator.tsx
<ResearchProgressIndicator progress={{
  step: 'searching',
  current: 2,
  total: 5,
  currentQuery: "effects of climate change",
  percentage: 45
}} />
```

---

### 3. Streaming Architecture

The app uses **Vercel AI SDK v5** with a custom streaming pattern:

```typescript
// API Route
return createUIMessageStream({
  execute: async (writer) => {
    // Send custom data events
    writer.write({ type: 'data-sources', id: 'src-1', data: { sources } })
    writer.write({ type: 'data-status', id: 'stat-1', data: { message: 'Searching...' } })
    
    // Stream LLM response
    const result = streamText({
      model: groq('llama-3.1-8b-instant'),
      messages: aiMessages,
      onChunk: ({ chunk }) => {
        if (chunk.type === 'text-delta') {
          writer.write({ type: 'text-delta', textDelta: chunk.textDelta })
        }
      }
    })
    
    await result.consumeStream()
  }
})
```

**Frontend Parsing:**
```typescript
// app/page.tsx - useEffect for stream parsing
useEffect(() => {
  const parts = parsedData?.parts || []
  for (const part of parts) {
    if (part.type === 'data-sources') setSources(part.data.sources)
    if (part.type === 'data-research-progress') setResearchProgress(part.data)
    if (part.type === 'data-queries-explored') setQueriesExplored(part.data.queriesExplored)
  }
}, [parsedData])
```

---

### 4. Research Mode Advanced Options

**Include Subpages:**
```typescript
// Exa API request
contents: {
  text: true,
  subpages: includeSubpages ? 1 : 0  // Crawl 1 level of subpages
}
```

**Force Live Crawl:**
```typescript
contents: {
  livecrawl: forceLiveCrawl ? 'always' : 'fallback'  // Force fresh results
}
```

These options are passed from UI → `useChat` body → API → Exa request.

---

### 5. Queries Explored Section

Displays which sources came from which search query:

```typescript
// Backend sends this structure
writer.write({
  type: 'data-queries-explored',
  data: {
    queriesExplored: [
      {
        query: "original user query",
        isOriginal: true,
        sources: [{ url, title, favicon }],
        count: 8
      },
      {
        query: "expanded query 1",
        isOriginal: false,
        sources: [...],
        count: 6
      }
    ]
  }
})
```

**Component:** `components/queries-explored-section.tsx`
- Collapsible accordion per query
- Click to expand source list
- Shows "Original" badge for user's query

---

### 6. PDF Export

Uses **jsPDF** for programmatic PDF generation (avoids CSS parsing issues):

```typescript
// lib/pdf-export.ts
export async function exportResearchAsPDF(options: ExportOptions) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  
  // Add title, query, content, sources programmatically
  doc.setFontSize(20)
  doc.text('Deep Research Report', margin, y)
  
  // Auto page breaks
  if (y > pageHeight - margin) {
    doc.addPage()
    y = margin
  }
  
  doc.save(`research-report-${Date.now()}.pdf`)
}
```

**Why jsPDF over html2pdf.js:**
- html2pdf uses html2canvas which parses CSS
- Modern CSS `oklch()` color function not supported
- jsPDF draws directly to PDF canvas - no CSS parsing

---

### 7. Database Schema

**Core Tables:**

```sql
-- Conversations (chat sessions)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages (within conversations)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  role TEXT NOT NULL,  -- 'user' | 'assistant'
  content TEXT,
  parts JSONB,  -- AI SDK message parts
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Research Sessions (Deep Research tracking)
CREATE TABLE research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  conversation_id TEXT,
  original_query TEXT NOT NULL,
  expanded_queries JSONB,
  total_sources_found INTEGER,
  synthesis_status TEXT,  -- 'pending' | 'in_progress' | 'completed' | 'failed'
  final_report TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

---

### 8. Authentication Flow

```
User → Clerk SignIn → JWT Token → Next.js Middleware → API Routes
                                         ↓
                          getAuth() extracts userId
                                         ↓
                          Supabase RLS policies filter by user_id
```

---

## Key Implementation Patterns

### 1. Non-Truncating Stream Pattern

To prevent response truncation:
```typescript
// Accumulate full text
let accumulatedText = ''
onChunk: ({ chunk }) => {
  if (chunk.type === 'text-delta') {
    accumulatedText += chunk.textDelta
    writer.write({ type: 'text-delta', textDelta: chunk.textDelta })
  }
}

// Only use accumulatedText for DB save, not partial
onFinish: async ({ text }) => {
  console.log('Full response:', text.length, 'chars')
  await saveMessage({ content: text })
}
```

### 2. Dynamic Request Body Injection

Using `prepareSendMessagesRequest` to inject state at send time:
```typescript
prepareSendMessagesRequest: () => ({
  body: {
    messages: messagesRef.current,
    isResearchMode: isResearchModeRef.current,
    queryCount: queryCountRef.current,
    includeSubpages: includeSubpagesRef.current,
    forceLiveCrawl: forceLiveCrawlRef.current,
    sessionId
  }
})
```

This avoids re-initializing `useChat` when state changes.

### 3. Progress Event Flow

```
Backend:                              Frontend:
─────────                             ─────────
expanding (10%) ─────────────────────→ setResearchProgress({step:'expanding', percentage:10})
searching 1/5 (28%) ─────────────────→ setResearchProgress({step:'searching', current:1, ...})
searching 2/5 (40%) ─────────────────→ Progress bar animates
...
synthesizing (85%) ──────────────────→ Step indicator updates
complete (100%) ─────────────────────→ setTimeout(() => setResearchProgress(null), 2000)
```

---

## File Structure

```
verifyai/
├── app/
│   ├── page.tsx                 # Main search page with useChat
│   ├── search.tsx               # Search form component
│   ├── api/verifyai/
│   │   ├── search/route.ts      # Quick search + research mode routing
│   │   └── research/route.ts    # Deep research handler
│   └── markdown-renderer.tsx    # Citation-aware markdown
├── components/
│   ├── modern-chat-interface.tsx    # Chat UI with messages
│   ├── research-mode-toggle.tsx     # Toggle + advanced options
│   ├── research-progress-indicator.tsx  # Progress bar
│   └── queries-explored-section.tsx # Grouped results accordion
├── lib/
│   ├── db/
│   │   ├── queries.ts           # Database CRUD functions
│   │   └── types.ts             # TypeScript types for DB
│   ├── supabase/
│   │   └── migrations/          # SQL schema files
│   └── pdf-export.ts            # jsPDF export utility
└── hooks/
    └── use-auto-resize-textarea.ts
```

---

## Performance Considerations

1. **Parallel Exa Searches**: All expanded queries execute concurrently via `Promise.all`
2. **Streaming**: Responses stream in real-time, no waiting for full completion
3. **Source Deduplication**: O(n) using URL Map to avoid duplicates
4. **Refs for State**: `useRef` prevents `useChat` re-initialization
5. **Dynamic Imports**: jsPDF loaded only when export button clicked

---

## Security

1. **RLS Policies**: All tables have row-level security filtering by `user_id`
2. **API Key Protection**: Exa/Groq keys in environment variables, never exposed to client
3. **Input Sanitization**: User queries escaped before rendering
4. **CORS**: Next.js API routes are same-origin only
