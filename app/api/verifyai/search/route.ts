import { NextResponse } from 'next/server'
import { createGroq } from '@ai-sdk/groq'
import { streamText, generateText, createUIMessageStream, createUIMessageStreamResponse, convertToModelMessages } from 'ai'
import type { ModelMessage } from 'ai'
import { detectCompanyTicker } from '@/lib/company-ticker-map'
import { selectRelevantContent } from '@/lib/content-selection'
import { saveQuery, saveSearchResults, trackApiUsage } from '@/lib/db/queries'
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

// Helper: Fetch and track Firecrawl search
async function fetchFirecrawlSearch(
  query: string,
  firecrawlApiKey: string,
  userId: string | null,
  savedQueryId: string | null
) {
  const firecrawlStartTime = Date.now()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  let searchResponse
  try {
    console.log('Fetching from Firecrawl...')
    searchResponse = await fetch('https://api.firecrawl.dev/v2/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        sources: ['web', 'news', 'images'],
        limit: 6,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
          maxAge: 86400000
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
      api_endpoint: '/v2/search',
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
    api_endpoint: '/v2/search',
    status_code: searchResponse.status,
    response_time_ms: firecrawlResponseTime,
    was_successful: true,
    error_message: null,
    request_count: 1,
    tokens_used: null,
    cost_usd: null,
    metadata: {
      sources_requested: ['web', 'news', 'images'],
      limit: 6,
    },
  }).catch(err => console.error('Failed to track API usage:', err))

  return searchResult.data || {}
}

// Helper: Transform search results
function transformSearchResults(searchData: any) {
  const webResults = searchData.web || []
  const newsData = searchData.news || []
  const imagesData = searchData.images || []

  const sources = webResults.map((item: any) => ({
    url: item.url,
    title: item.title || item.url,
    description: item.description || item.snippet,
    content: item.content,
    markdown: item.markdown,
    favicon: item.favicon,
    image: item.ogImage || item.image || item.metadata?.ogImage,
    siteName: new URL(item.url).hostname
  })).filter((item: any) => item.url) || []

  const newsResults = newsData.map((item: any) => ({
    url: item.url,
    title: item.title,
    description: item.snippet || item.description,
    publishedDate: parseDate(item.date),
    source: item.source || (item.url ? new URL(item.url).hostname : undefined),
    image: item.imageUrl
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
async function saveQueryAndResults(
  userId: string | null,
  sessionId: string | null,
  query: string,
  requestId: string,
  sources: any[],
  newsResults: any[],
  imageResults: any[]
) {
  try {
    const queryData: QueryInsert = {
      user_id: userId,
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
  const systemPrompt = `You are a friendly assistant that helps users find information.

CRITICAL FORMATTING RULE:
- NEVER use LaTeX/math syntax ($...$) for regular numbers in your response
- Write ALL numbers as plain text: "1 million" NOT "$1$ million", "50%" NOT "$50\\\\%$"
- Only use math syntax for actual mathematical equations if absolutely necessary

RESPONSE STYLE:
- For greetings (hi, hello), respond warmly and ask how you can help
- For simple questions, give direct, concise answers
- For complex topics, provide detailed explanations only when needed
- Match the user's energy level - be brief if they're brief

FORMAT:
- Use markdown for readability when appropriate
- Keep responses natural and conversational
- Include citations inline as [1], [2], etc. when referencing specific sources
- Citations should correspond to the source order (first source = [1], second = [2], etc.)
- Use the format [1] not CITATION_1 or any other format
- DO NOT list the sources at the end of your response. They are already displayed in the UI.`

  if (isFollowUp) {
    return [
      { role: 'system', content: systemPrompt },
      ...convertToModelMessages(messages.slice(0, -1)),
      { role: 'user', content: `Answer this query: "${query}"\n\nBased on these sources:\n${context}` }
    ]
  }

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Answer this query: "${query}"\n\nBased on these sources:\n${context}` }
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
    const sourceTitles = sources.map((s: { title: string }) => s.title).join(', ')
    const sourceContext = sources.length > 0 ? `Available sources about: ${sourceTitles}\n\n` : ''

    const followUpResponse = await generateText({
      model: groq('llama-3.1-8b-instant'),
      messages: [
        {
          role: 'system',
          content: `Generate 5 natural follow-up questions based on the query and answer.
                
                ONLY generate questions if the query warrants them:
                - Skip for simple greetings or basic acknowledgments
                - Create questions that feel natural, not forced
                - Make them genuinely helpful, not just filler
                - Focus on the topic and sources available
                
                If the query doesn't need follow-ups, return an empty response.
                  ${isFollowUp ? 'Consider the full conversation history and avoid repeating previous questions.' : ''}
                  Return only the questions, one per line, no numbering or bullets.`
        },
        {
          role: 'user',
          content: `Query: ${query}\n\nAnswer provided: ${fullAnswer.substring(0, 500)}...\n\n${sourceContext}Generate 5 diverse follow-up questions that would help the user learn more about this topic from different angles.`
        }
      ],
      temperature: 0.7,
      maxRetries: 2
    })

    const followUpQuestions = followUpResponse.text
      .split('\n')
      .map((q: string) => q.trim())
      .filter((q: string) => q.length > 0)
      .slice(0, 5)

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
    const sessionId = body.sessionId || null // Optional session ID from the request

    // Extract query from v5 message structure (messages have parts array)
    let query = body.query
    if (!query && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.parts) {
        // v5 structure
        const textParts = lastMessage.parts.filter((p: any) => p.type === 'text')
        query = textParts.map((p: any) => p.text).join(' ')
      } else if (lastMessage.content) {
        // Fallback for v4 structure
        query = lastMessage.content
      }
    }

    if (!query) {
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

    // Create a UIMessage stream with custom data parts
    const stream = createUIMessageStream({
      originalMessages: messages,
      execute: async ({ writer }) => {
        console.log('Starting search execution...');
        let savedQueryId: string | null = null

        try {
          // Send status updates
          writer.write({
            type: 'data-status',
            id: 'status-1',
            data: { message: 'Starting search...' },
            transient: true
          })

          writer.write({
            type: 'data-status',
            id: 'status-2',
            data: { message: 'Searching for relevant sources...' },
            transient: true
          })

          // Fetch and transform search results
          const searchData = await fetchFirecrawlSearch(query, firecrawlApiKey, userId, savedQueryId)
          const { sources, newsResults, imageResults } = transformSearchResults(searchData)

          // Save to database
          savedQueryId = await saveQueryAndResults(
            userId,
            sessionId,
            query,
            requestId,
            sources,
            newsResults,
            imageResults
          )

          // Send query ID to client
          if (savedQueryId) {
            writer.write({
              type: 'data-query-id',
              id: 'query-id-1',
              data: { queryId: savedQueryId }
            })
          }

          // Send all sources as a persistent data part
          writer.write({
            type: 'data-sources',
            id: 'sources-1',
            data: {
              sources,
              newsResults,
              imageResults
            }
          })

          // Small delay to ensure sources render first
          await new Promise(resolve => setTimeout(resolve, 300))

          // Update status
          writer.write({
            type: 'data-status',
            id: 'status-3',
            data: { message: 'Analyzing sources and generating answer...' },
            transient: true
          })

          // Detect if query is about a company
          const ticker = detectCompanyTicker(query)
          if (ticker) {
            writer.write({
              type: 'data-ticker',
              id: 'ticker-1',
              data: { symbol: ticker }
            })
          }

          // Prepare context from sources
          const context = sources
            .map((source: { title: string; markdown?: string; content?: string; url: string }, index: number) => {
              const content = source.markdown || source.content || ''
              const relevantContent = selectRelevantContent(content, query, 2000)
              return `[${index + 1}] ${source.title}\nURL: ${source.url}\n${relevantContent}`
            })
            .join('\n\n---\n\n')

          // Prepare AI messages
          const aiMessages = prepareAIMessages(isFollowUp, query, context, messages)

          // Stream the text generation using Groq's Llama model
          console.log('Starting Groq streamText...');
          const groqStartTime = Date.now()
          try {
            const result = streamText({
              model: groq('llama-3.1-8b-instant'),
              messages: aiMessages,
              temperature: 0.7,
              maxRetries: 2
            })

            console.log('Groq stream created, merging...');
            writer.merge(result.toUIMessageStream())
            console.log('Groq stream merged.');

            // Get the full answer for follow-up generation
            const fullAnswer = await result.text
            console.log('Full answer received length:', fullAnswer.length);
            const groqEndTime = Date.now()
            const groqResponseTime = groqEndTime - groqStartTime

            // Track Groq API usage
            trackApiUsage({
              user_id: userId,
              query_id: savedQueryId,
              api_provider: 'groq',
              api_endpoint: 'llama-3.1-8b-instant',
              status_code: 200,
              response_time_ms: groqResponseTime,
              was_successful: true,
              error_message: null,
              request_count: 1,
              tokens_used: null,
              cost_usd: null,
              metadata: {
                temperature: 0.7,
                model: 'llama-3.1-8b-instant',
                message_count: aiMessages.length,
              },
            }).catch(err => console.error('Failed to track Groq API usage:', err))

            // Generate follow-up questions
            await generateFollowUpQuestions(groq, query, fullAnswer, sources, isFollowUp, writer)
          } catch (error) {
            console.error('Error in Groq generation:', error);
            throw error;
          }

        } catch (error) {
          handleExecutionError(error, writer)
        }
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