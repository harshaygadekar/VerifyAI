import { NextResponse } from 'next/server'
import { createGroq } from '@ai-sdk/groq'
import { streamText, generateText, createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import type { ModelMessage } from 'ai'
import { detectCompanyTicker } from '@/lib/company-ticker-map'
import { selectRelevantContent } from '@/lib/content-selection'
import {
  saveQuery,
  saveSearchResults,
  trackApiUsage,
  createOrGetUser,
  updateQueryResponse,
  createConversation,
  saveMessage,
  getConversation,
  updateConversationTitle
} from '@/lib/db/queries'
import type { QueryInsert, SearchResultInsert } from '@/lib/db/types'
import { validateSearchQuery } from '@/lib/validations'
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit'

// Helper: Parse date strings safely
function parseDate(dateStr: string | undefined | null): string | null {
  if (!dateStr) return null
  try {
    const date = new Date(dateStr)
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString()
    }
    return null
  } catch (e) {
    console.warn('Failed to parse date:', dateStr, e)
    return null
  }
}

// Helper: Fetch and track Firecrawl search (uses Exa AI under the hood)
async function fetchFirecrawlSearch(
  query: string,
  firecrawlApiKey: string,
  userId: string | null,
  savedQueryId: string | null
) {
  const firecrawlStartTime = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

  let searchResponse
  try {
    console.log('Fetching from Firecrawl...')
    // Using Exa AI search endpoint
    searchResponse = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'x-api-key': firecrawlApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        numResults: 10,
        type: 'auto',
        useAutoprompt: true, // Enable Exa's auto-prompting for better results
        contents: {
          text: { maxCharacters: 4000 },
          highlights: { numSentences: 3 } // Get highlights for better context
        }
      }),
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    console.log('Firecrawl response status:', searchResponse.status)
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Search timed out')
    }
    throw error
  }

  const firecrawlEndTime = Date.now()
  const firecrawlResponseTime = firecrawlEndTime - firecrawlStartTime

  if (!searchResponse.ok) {
    const errorData = await searchResponse.json().catch(() => ({ error: 'Unknown error' }))
    console.error('Firecrawl error:', errorData)

    trackApiUsage({
      user_id: userId,
      query_id: savedQueryId,
      api_provider: 'firecrawl',
      api_endpoint: '/search',
      status_code: searchResponse.status,
      response_time_ms: firecrawlResponseTime,
      was_successful: false,
      error_message: errorData.error || searchResponse.statusText,
      request_count: 1,
      tokens_used: null,
      cost_usd: null,
      metadata: {},
    }).catch(err => console.error('Failed to track API usage:', err))

    throw new Error(`Firecrawl API error: ${errorData.error || searchResponse.statusText}`)
  }

  const searchResult = await searchResponse.json()

  trackApiUsage({
    user_id: userId,
    query_id: savedQueryId,
    api_provider: 'firecrawl',
    api_endpoint: '/search',
    status_code: searchResponse.status,
    response_time_ms: firecrawlResponseTime,
    was_successful: true,
    error_message: null,
    request_count: 1,
    tokens_used: null,
    cost_usd: null,
    metadata: {
      numResults: 8,
      type: 'auto',
    },
  }).catch(err => console.error('Failed to track API usage:', err))

  // Return results in a format compatible with the existing transform function
  // Exa returns { results: [...] }, we need to map it to { web: [...] }
  return { web: searchResult.results || [], news: [], images: [] }
}

// Helper: Transform search results (handles Exa AI response format)
function transformSearchResults(searchData: any) {
  const webResults = searchData.web || []
  const newsData = searchData.news || []
  const imagesData = searchData.images || []

  const sources = webResults.map((item: any) => {
    // Handle Exa AI response format
    // Exa returns: { url, title, text, publishedDate, author, image, favicon, highlights }
    const description = item.highlights?.[0] || item.description || item.text?.substring(0, 300) || item.snippet || ''

    return {
      url: item.url,
      title: item.title || item.url,
      description: description,
      content: item.text || item.content,
      markdown: item.text || item.markdown, // Exa returns text, not markdown
      favicon: item.favicon,
      image: item.image || item.ogImage || item.metadata?.ogImage,
      siteName: item.url ? new URL(item.url).hostname : undefined
    }
  }).filter((item: any) => item.url) || []

  const newsResults = newsData.map((item: any) => ({
    url: item.url,
    title: item.title,
    description: item.text?.substring(0, 300) || item.snippet || item.description,
    publishedDate: parseDate(item.publishedDate || item.date),
    source: item.source || (item.url ? new URL(item.url).hostname : undefined),
    image: item.image || item.imageUrl
  })).filter((item: any) => item.url) || []

  const imageResults = imagesData.map((item: any) => {
    if (!item.url || !item.imageUrl) return null
    return {
      url: item.url,
      title: item.title || 'Untitled',
      thumbnail: item.imageUrl,
      source: item.url ? new URL(item.url).hostname : undefined,
      width: item.imageWidth,
      height: item.imageHeight,
      position: item.position
    }
  }).filter(Boolean) || []

  return { sources, newsResults, imageResults }
}

// Helper: Save query and results to database
async function saveQueryAndResults({
  userId,
  userEmail,
  sessionId,
  query,
  requestId,
  sources,
  newsResults,
  imageResults
}: {
  userId: string | null,
  userEmail: string | null,
  sessionId: string | null,
  query: string,
  requestId: string,
  sources: any[],
  newsResults: any[],
  imageResults: any[]
}) {
  try {
    // Ensure user exists in Supabase before saving query
    // This is non-blocking - if it fails, we still save the query with null user_id
    let supabaseUserId = null
    if (userEmail) {
      try {
        const user = await createOrGetUser(userEmail, userId ? { id: userId } : undefined)
        if (user) {
          supabaseUserId = user.id
        }
      } catch (userError) {
        console.error('Failed to create/get user (non-blocking):', userError)
        // Continue with null user_id - the query will still be saved
      }
    }

    const queryData: QueryInsert = {
      user_id: supabaseUserId,
      query_text: query,
      query_type: 'mixed',
      response_metadata: {
        request_id: requestId,
        sources_count: sources.length + newsResults.length + imageResults.length,
        web_count: sources.length,
        news_count: newsResults.length,
        image_count: imageResults.length,
      },
      response_time_ms: null,
      sources_count: sources.length + newsResults.length + imageResults.length,
      was_successful: true,
      error_message: null,
      session_id: sessionId,
      ip_address: null,
      user_agent: null,
      referer: null,
    }

    const savedQuery = await saveQuery(queryData)
    if (!savedQuery) return null

    const searchResultsToSave: SearchResultInsert[] = []

    for (const [index, source] of sources.entries()) {
      searchResultsToSave.push({
        query_id: savedQuery.id,
        url: source.url,
        title: source.title,
        description: source.description || null,
        content: source.content || null,
        markdown: source.markdown || null,
        rank: index + 1,
        result_type: 'web',
        author: source.author || null,
        source: source.siteName || null,
        site_name: source.siteName || null,
        image_url: source.image || null,
        thumbnail_url: null,
        favicon_url: source.favicon || null,
        image_width: null,
        image_height: null,
        published_date: source.publishedDate || null,
        was_clicked: false,
        click_count: 0,
        time_spent_seconds: 0,
        metadata: {},
      })
    }

    for (const [index, news] of newsResults.entries()) {
      searchResultsToSave.push({
        query_id: savedQuery.id,
        url: news.url,
        title: news.title,
        description: news.description || null,
        content: null,
        markdown: null,
        rank: sources.length + index + 1,
        result_type: 'news',
        published_date: news.publishedDate || null,
        author: null,
        source: news.source || null,
        site_name: null,
        image_url: news.image || null,
        thumbnail_url: null,
        favicon_url: null,
        image_width: null,
        image_height: null,
        was_clicked: false,
        click_count: 0,
        time_spent_seconds: 0,
        metadata: {},
      })
    }

    for (const [index, image] of imageResults.entries()) {
      searchResultsToSave.push({
        query_id: savedQuery.id,
        url: image.url,
        title: image.title,
        description: null,
        content: null,
        markdown: null,
        rank: sources.length + newsResults.length + index + 1,
        result_type: 'image',
        published_date: null,
        author: null,
        source: image.source || null,
        site_name: null,
        image_url: image.url,
        thumbnail_url: image.thumbnail || null,
        favicon_url: null,
        image_width: image.width || null,
        image_height: image.height || null,
        was_clicked: false,
        click_count: 0,
        time_spent_seconds: 0,
        metadata: {
          position: image.position,
        },
      })
    }

    if (searchResultsToSave.length > 0) {
      await saveSearchResults(searchResultsToSave)
    }

    return savedQuery.id
  } catch (dbError) {
    console.error('Failed to save query to database:', dbError)
    return null
  }
}

// Helper: Prepare AI messages
function prepareAIMessages(
  isFollowUp: boolean,
  query: string,
  context: string,
  messages: any[]
): ModelMessage[] {
  const systemPrompt = String.raw`You are VerifyAI, an advanced AI search assistant powered by Example.com's deep search capabilities.

CORE OBJECTIVE:
Provide accurate, comprehensive, and well-structured answers based strictly on the provided search results. Your answers should be high-quality, professional, and easy to read.

CITATION & SOURCING RULES:
- CITATION STRICTNESS: You MUST cite your sources for every factual claim.
- FORMAT: Use inline citations like [1], [2] immediately after the claim.
- ORDER: Respect the source numbering provided in the context context.
- ACCURACY: Do not invent sources or misattribute information.
- PLACEMENT: Place citations at the end of sentences or clauses.
- EXAMPLE: "The sky is blue [1], and the grass is green [2]."

RESPONSE GUIDELINES:
- **Direct & Concise**: Answer the user's question directly in the first paragraph.
- **Structure**: Use headings (##), bullet points, and bold text to organize information effectively.
- **Synthesis**: Don't just list facts; synthesize information from multiple sources to provide a cohesive answer.
- **Tone**: Professional, helpful, objective, and confident.
- **No Fluff**: Avoid filler phrases like "Based on the search results" or "Here is what I found". Just state the facts.
- **Formatting**:
  - NEVER use LaTeX ($...$) for regular numbers (e.g., write "50%", not "$50\%$").
  - Use markdown tables for comparisons if appropriate.

Handling Missing Information:
- If the search results don't fully answer the query, state clearly what is missing.
- Do not hallucinate information not present in the sources.

Formatting Numbers:
- Write "1 million" instead of "$1$ million".
- Write "50%" instead of "$50\%$".
`

  // Sanitize messages to only keep text content for the model
  const sanitizedMessages = messages.slice(0, -1).map(m => {
    // If message has parts, extract only text parts
    if (m.parts && Array.isArray(m.parts)) {
      const textContent = m.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('')

      return {
        role: m.role,
        content: textContent || m.content || ''
      }
    }
    // Return as is if simple content
    return {
      role: m.role,
      content: m.content || ''
    }
  })

  // Filter out any messages with empty content if necessary, though empty content might be valid for some models (usually not user messages)
  const validMessages = sanitizedMessages.filter(m => m.content.trim().length > 0)

  // Enforce context in the last user message
  const userPromptWithContext = `USER QUERY: "${query}"

SEARCH CONTEXT (Use these sources to answer):
${context}

INSTRUCTIONS:
Answer the user's query comprehensively using ONLY the sources above. Cite them as [1], [2], etc.`

  if (isFollowUp) {
    try {
      // sanitizedMessages are already in { role, content } format which is compatible with CoreMessage
      const history = validMessages as any[]
      return [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userPromptWithContext }
      ]
    } catch (error) {
      console.error('Error converting messages to model messages:', error)
      // Fallback: simplified history
      return [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPromptWithContext }
      ]
    }
  }

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPromptWithContext }
  ]
}

// Helper: Generate follow-up questions
async function generateFollowUpQuestions(
  groq: any,
  query: string,
  fullAnswer: string,
  sources: any[],
  isFollowUp: boolean,
  writer: any
) {
  try {
    // const sourceTitles = sources.map((s: { title: string }) => s.title).join(', ')
    // const sourceContext = sources.length > 0 ? `Available sources about: ${sourceTitles}\n\n` : '' // Removed to reduce context size if not needed

    const followUpResponse = await generateText({
      model: groq('llama-3.1-8b-instant'),
      messages: [
        {
          role: 'system',
          content: `You are an engagement expert. Generate 3-4 short, relevant follow-up questions based on the user's query and the answer provided.
          
          Guidelines:
          - Questions should explore the topic deeper or related aspects.
          - Keep them short (under 10 words).
          - Make them sound natural.
          - Return ONLY the questions, one per line. No bullets/numbering.`
        },
        {
          role: 'user',
          content: `Query: ${query}\n\nAnswer Summary: ${fullAnswer.substring(0, 300)}...`
        }
      ],
      temperature: 0.7,
      maxRetries: 2
    })

    const followUpQuestions = followUpResponse.text
      .split('\n')
      .map((q: string) => q.trim())
      .filter((q: string) => q.length > 0)
      .slice(0, 4) // Limit to 4

    writer.write({
      type: 'data-followup',
      id: 'followup-1',
      data: { questions: followUpQuestions }
    })
  } catch (followUpError) {
    console.error('Failed to generate follow-up questions:', followUpError)
  }
}

// Helper: Handle execution errors
function handleExecutionError(error: unknown, writer: any) {
  console.error('Search execution error:', error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'

  let statusCode: number | undefined
  if (error && typeof error === 'object') {
    if ('statusCode' in error) {
      statusCode = (error as any).statusCode
    } else if ('status' in error) {
      statusCode = (error as any).status
    }
  }

  const errorResponses: Record<number, { error: string; suggestion?: string }> = {
    401: {
      error: 'Invalid API key',
      suggestion: 'Please check your Firecrawl API key is correct.'
    },
    402: {
      error: 'Insufficient credits',
      suggestion: 'You\'ve run out of Firecrawl credits. Please upgrade your plan.'
    },
    429: {
      error: 'Rate limit exceeded',
      suggestion: 'Too many requests. Please wait a moment and try again.'
    },
    504: {
      error: 'Request timeout',
      suggestion: 'The search took too long. Try a simpler query or fewer sources.'
    }
  }

  const errorResponse = statusCode && errorResponses[statusCode]
    ? errorResponses[statusCode]
    : { error: errorMessage }

  writer.write({
    type: 'data-error',
    id: 'error-1',
    data: {
      error: errorResponse.error,
      ...(errorResponse.suggestion ? { suggestion: errorResponse.suggestion } : {}),
      ...(statusCode ? { statusCode } : {})
    },
    transient: true
  })
}

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7)

  // Rate limiting
  const identifier = getClientIdentifier(request)
  const rateLimitResult = rateLimit(identifier, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
  })

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  try {
    const body = await request.json()
    const messages = body.messages || []
    const userId = body.userId || null // Optional user ID from the request
    const userEmail = body.userEmail || null // Optional user email for Supabase user creation
    const sessionId = body.sessionId || null // Optional session ID from the request

    // Debug: Log the structure of received messages
    console.log('DEBUG: Received messages count:', messages.length)
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      console.log('DEBUG: Last message structure:', JSON.stringify(lastMessage, null, 2))
    }

    // Extract query from v5 message structure (messages have parts array)
    let query = body.query
    if (!query && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]

      // Check for v5 structure with parts array
      if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
        const textParts = lastMessage.parts.filter((p: any) => p.type === 'text')
        query = textParts.map((p: any) => p.text).join(' ')
      }
      // Check for v4 structure with content string
      else if (lastMessage.content) {
        query = typeof lastMessage.content === 'string'
          ? lastMessage.content
          : JSON.stringify(lastMessage.content)
      }
      // Also check for 'text' field directly (some AI SDK versions)
      else if (lastMessage.text) {
        query = lastMessage.text
      }
    }

    console.log('DEBUG: Extracted query:', query)

    if (!query) {
      console.error('DEBUG: Query extraction failed. Body:', JSON.stringify(body, null, 2))
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Validate and sanitize query
    const validation = validateSearchQuery(query)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    query = validation.sanitized

    // Use API key from request body if provided, otherwise fall back to environment variable
    const firecrawlApiKey = body.firecrawlApiKey || process.env.FIRECRAWL_API_KEY
    const groqApiKey = process.env.GROQ_API_KEY

    if (!firecrawlApiKey) {
      return NextResponse.json({ error: 'Firecrawl API key not configured' }, { status: 500 })
    }

    if (!groqApiKey) {
      return NextResponse.json({ error: 'Groq API key not configured' }, { status: 500 })
    }

    // Configure Groq client
    const groq = createGroq({
      apiKey: groqApiKey
    })

    // Always perform a fresh search for each query to ensure relevant results
    const isFollowUp = messages.length > 2

    // Use createUIMessageStream with writer.write for all parts
    // The execute function is async and returns a Promise that the SDK should await
    const stream = createUIMessageStream({
      originalMessages: messages,
      execute: async ({ writer }) => {
        console.log('Starting search execution...');
        let savedQueryId: string | null = null

        try {
          // 1. Send status updates
          writer.write({ type: 'data-status', id: 'status-1', data: { message: 'Starting search...' } })
          writer.write({ type: 'data-status', id: 'status-2', data: { message: 'Searching for relevant sources...' } })

          // 2. Fetch and transform search results
          console.log('DEBUG: Starting Firecrawl fetch...');
          const searchData = await fetchFirecrawlSearch(query, firecrawlApiKey, userId, savedQueryId)
          console.log('DEBUG: Firecrawl complete, sources count:', searchData?.web?.length || 0);

          const { sources, newsResults, imageResults } = transformSearchResults(searchData)
          console.log('DEBUG: Transformed - sources:', sources.length, 'news:', newsResults.length, 'images:', imageResults.length);

          // 3. Save to database
          try {
            savedQueryId = await saveQueryAndResults({
              userId, userEmail, sessionId, query, requestId, sources, newsResults, imageResults
            })
            if (savedQueryId) {
              writer.write({ type: 'data-query-id', id: 'query-id-1', data: { queryId: savedQueryId } })
            }
          } catch (err) {
            console.error('Failed to save query to database:', err)
          }

          // 4. Send sources (with correct schema for frontend)
          writer.write({
            type: 'data-sources',
            id: 'sources-1',
            data: { sources, newsResults, imageResults }
          })

          await new Promise(resolve => setTimeout(resolve, 50))
          writer.write({ type: 'data-status', id: 'status-3', data: { message: 'Analyzing sources and generating answer...' } })

          // 5. Detect and send Ticker (correct schema: { symbol })
          const ticker = detectCompanyTicker(query)
          if (ticker) {
            writer.write({ type: 'data-ticker', id: 'ticker-1', data: { symbol: ticker } })
          }

          // 6. Context Preparation
          const context = sources
            .slice(0, 5)
            .map((source: { title: string; markdown?: string; content?: string; url: string }, index: number) => {
              const content = source.markdown || source.content || ''
              const relevantContent = selectRelevantContent(content, query, 800)
              return `[${index + 1}] ${source.title}\nURL: ${source.url}\n${relevantContent}`
            })
            .join('\n\n---\n\n')

          console.log('DEBUG: Preparing AI messages, isFollowUp:', isFollowUp);
          const aiMessages = prepareAIMessages(isFollowUp, query, context, messages)
          console.log('DEBUG: AI messages prepared, count:', aiMessages.length);

          // 7. Text Generation & Streaming
          console.log('Starting Groq streamText...');
          const groqStartTime = Date.now()

          try {
            const result = streamText({
              model: groq('llama-3.1-8b-instant'),
              messages: aiMessages,
              temperature: 0.7,
              onFinish: async ({ text }) => {
                console.log('Text streaming complete. Full answer length:', text.length);
                if (savedQueryId) {
                  try {
                    await updateQueryResponse(savedQueryId, text)
                    console.log('Successfully saved response for query:', savedQueryId)
                  } catch (err) {
                    console.error('Failed to update query response:', err)
                  }
                }
              }
            })

            // Wait for the FULL response text 
            const accumulatedText = await result.text
            console.log('FULL TEXT RECEIVED:', accumulatedText.length, 'chars');

            // Write the complete text as UI message stream parts
            // The SDK consolidates text-delta parts into a single 'text' part for the frontend
            writer.write({ type: 'text-start', id: 'answer' })
            writer.write({
              type: 'text-delta',
              id: 'answer',
              delta: accumulatedText
            })
            writer.write({ type: 'text-end', id: 'answer' })

            // Stream complete
            console.log('Generation finished. Total text length:', accumulatedText.length);

            // 8. Track Usage
            const groqEndTime = Date.now()
            trackApiUsage({
              user_id: userId,
              query_id: savedQueryId,
              api_provider: 'groq',
              api_endpoint: 'llama-3.1-8b-instant',
              status_code: 200,
              response_time_ms: groqEndTime - groqStartTime,
              was_successful: true,
              error_message: null,
              request_count: 1,
              tokens_used: null,
              cost_usd: null,
              metadata: { temperature: 0.7, model: 'llama-3.1-8b-instant', message_count: aiMessages.length },
            }).catch(err => console.error('Failed to track API usage:', err))

            // 9. Generate & Send Follow-up questions
            const generatedFollowUps = await generateAndSendFollowUps(query, accumulatedText, writer, groq)

            // 10. Save to Conversations/Messages tables (new chat history system)
            try {
              // Get Supabase user ID (from email) - this is what getChatHistory uses
              let supabaseUserId: string | null = null
              if (userEmail) {
                const supabaseUser = await createOrGetUser(userEmail)
                supabaseUserId = supabaseUser?.id || null
              }

              // Get or create conversation
              let conversationId = sessionId
              let isNewConversation = false
              const existingConversation = await getConversation(sessionId)

              if (!existingConversation && supabaseUserId) {
                // Create new conversation (first message in this session)
                const newConv = await createConversation(supabaseUserId, query.slice(0, 50))
                if (newConv) {
                  conversationId = newConv.id
                  isNewConversation = true
                  console.log('Created new conversation:', conversationId)

                  // Stream the new conversation ID to client so it can update URL
                  writer.write({
                    type: 'data-conversation-id',
                    id: 'conv-id-1',
                    data: { conversationId }
                  })
                }
              }

              if (conversationId && supabaseUserId) {
                // Save user message
                await saveMessage({
                  conversation_id: conversationId,
                  role: 'user',
                  content: query,
                  parts: [{ type: 'text', text: query }],
                  metadata: {},
                  query_id: savedQueryId
                })

                // Save assistant message with metadata
                await saveMessage({
                  conversation_id: conversationId,
                  role: 'assistant',
                  content: accumulatedText,
                  parts: [{ type: 'text', text: accumulatedText }],
                  metadata: {
                    sources: sources.slice(0, 5), // Store just metadata, not full content
                    followUpQuestions: generatedFollowUps || [],
                    queryId: savedQueryId
                  },
                  query_id: savedQueryId
                })

                console.log('Messages saved to conversation:', conversationId)

                // Generate auto-title for new conversations (after first exchange)
                if (isNewConversation) {
                  generateAutoTitle(conversationId, query, groq).catch((err: Error) =>
                    console.error('Failed to generate auto-title:', err)
                  )
                }
              }
            } catch (err) {
              console.error('Failed to save messages to conversation:', err)
            }

            // 11. Send search completed
            writer.write({ type: 'data-search-completed', id: 'search-completed-1', data: { success: true, queryId: savedQueryId } })

          } catch (error) {
            console.error('Error in Groq generation:', error);
            writer.write({ type: 'error', errorText: error instanceof Error ? error.message : 'AI generation failed' })
          }

        } catch (error) {
          console.error('Error in search execution:', error)
          writer.write({ type: 'error', errorText: error instanceof Error ? error.message : 'Search failed' })
        }

        console.log('Execute function completed.')
      }
    })

    return createUIMessageStreamResponse({ stream })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : ''
    return NextResponse.json(
      { error: 'Search failed', message: errorMessage, details: errorStack },
      { status: 500 }
    )
  }
}


// Helper: Generate and send follow-up questions
async function generateAndSendFollowUps(query: string, fullText: string, writer: any, groq: any): Promise<string[]> {
  try {
    const followUpResponse = await generateText({
      model: groq('llama-3.1-8b-instant'),
      messages: [
        { role: 'system', content: 'Generate 3-4 short follow-up questions. One per line, under 10 words, no bullets or numbers.' },
        { role: 'user', content: `Query: ${query}\n\nAnswer: ${fullText.substring(0, 400)}` }
      ],
      temperature: 0.7,
      maxRetries: 2
    })

    const questions = followUpResponse.text.trim().split('\n')
      .map((q: string) => q.trim().replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, ''))
      .filter((q: string) => q.length > 5 && q.length < 100)
      .slice(0, 4)

    if (questions.length > 0) {
      writer.write({ type: 'data-followup', id: 'followup-1', data: { questions } })
      console.log('Follow-up questions sent:', questions.length)
    }

    return questions
  } catch (err) {
    console.error('Error generating follow-ups:', err)
    return []
  }
}

/**
 * Generate auto-title for new conversations (like ChatGPT/Gemini)
 * Runs in background after first exchange
 */
async function generateAutoTitle(conversationId: string, userQuery: string, groq: any): Promise<void> {
  try {
    const titleResponse = await generateText({
      model: groq('llama-3.1-8b-instant'),
      messages: [
        {
          role: 'system',
          content: 'Generate a 3-5 word title summarizing this request. No punctuation, no quotes, just the title.'
        },
        { role: 'user', content: userQuery }
      ],
      temperature: 0.5,
      maxRetries: 2
    })

    const title = titleResponse.text.trim().slice(0, 50)

    if (title && title.length > 2) {
      await updateConversationTitle(conversationId, title)
      console.log('Auto-generated title:', title)
    }
  } catch (err) {
    console.error('Error generating auto-title:', err)
  }
}