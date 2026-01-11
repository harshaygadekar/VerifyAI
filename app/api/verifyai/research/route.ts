import { NextResponse } from 'next/server'
import { createGroq } from '@ai-sdk/groq'
import { streamText, generateText, createUIMessageStream, createUIMessageStreamResponse } from 'ai'
import type { ModelMessage } from 'ai'
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
    updateConversationTitle,
    createResearchSession,
    updateResearchSession,
    addResearchQueryResult,
} from '@/lib/db/queries'
import type { QueryInsert, SearchResultInsert } from '@/lib/db/types'
import { validateSearchQuery } from '@/lib/validations'
import { rateLimit, getClientIdentifier } from '@/lib/rate-limit'

// ============================================================================
// Types
// ============================================================================

interface ExpandedQuery {
    query: string
    order: number
    isOriginal: boolean
}

interface SearchSource {
    url: string
    title: string
    description: string
    content?: string
    markdown?: string
    favicon?: string
    image?: string
    siteName?: string
    querySource?: string // Track which query found this source
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate expanded queries using LLM
 */
async function generateExpandedQueries(
    groq: any,
    originalQuery: string,
    count: number = 3
): Promise<string[]> {
    try {
        const response = await generateText({
            model: groq('llama-3.1-8b-instant'),
            messages: [
                {
                    role: 'system',
                    content: `You are a research assistant. Given a user's query, generate ${count} related search queries that would help gather comprehensive information on the topic.

Rules:
- Each query should explore a different angle or aspect of the topic
- Keep queries concise (under 15 words)
- Make them specific and searchable
- Return ONLY the queries, one per line, no numbering or bullets`
                },
                {
                    role: 'user',
                    content: originalQuery
                }
            ],
            temperature: 0.7,
            maxRetries: 2
        })

        return response.text
            .split('\n')
            .map(q => q.trim())
            .filter(q => q.length > 5 && q.length < 150)
            .slice(0, count)
    } catch (error) {
        console.error('Error generating expanded queries:', error)
        return []
    }
}

/**
 * Execute a single Exa search
 */
async function executeExaSearch(
    query: string,
    apiKey: string,
    numResults: number = 8,
    options: { includeSubpages?: boolean; forceLiveCrawl?: boolean } = {}
): Promise<SearchSource[]> {
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 25000)

        // Build contents config with optional subpages and livecrawl
        const contentsConfig: Record<string, any> = {
            text: { maxCharacters: 3000 },
            highlights: { numSentences: 3 }
        }

        // Add livecrawl if force refresh is enabled
        if (options.forceLiveCrawl) {
            contentsConfig.livecrawl = 'always'
            contentsConfig.livecrawlTimeout = 15000
        }

        // Add subpages if enabled
        if (options.includeSubpages) {
            contentsConfig.subpages = 1
        }

        const response = await fetch('https://api.exa.ai/search', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query,
                numResults,
                type: 'auto',
                useAutoprompt: true,
                contents: contentsConfig
            }),
            signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            console.error(`Exa search failed for query "${query}":`, response.status)
            return []
        }

        const data = await response.json()
        const results = data.results || []

        return results.map((item: any) => ({
            url: item.url,
            title: item.title || item.url,
            description: item.highlights?.[0] || item.text?.substring(0, 300) || '',
            content: item.text,
            markdown: item.text,
            favicon: item.favicon,
            image: item.image || item.ogImage,
            siteName: item.url ? new URL(item.url).hostname : undefined,
            querySource: query
        })).filter((item: SearchSource) => item.url)
    } catch (error) {
        if ((error as Error).name === 'AbortError') {
            console.error(`Search timed out for query: ${query}`)
        } else {
            console.error(`Error searching for "${query}":`, error)
        }
        return []
    }
}

/**
 * Deduplicate sources by URL, keeping the first occurrence
 */
function deduplicateSources(sources: SearchSource[]): SearchSource[] {
    const seen = new Set<string>()
    return sources.filter(source => {
        if (seen.has(source.url)) {
            return false
        }
        seen.add(source.url)
        return true
    })
}

/**
 * Prepare research context from multiple sources
 */
function prepareResearchContext(
    sources: SearchSource[],
    query: string,
    maxSources: number = 8
): string {
    return sources
        .slice(0, maxSources)
        .map((source, index) => {
            const content = source.markdown || source.content || ''
            const relevantContent = selectRelevantContent(content, query, 600)
            return `[${index + 1}] ${source.title}\nURL: ${source.url}\nFrom query: "${source.querySource}"\n${relevantContent}`
        })
        .join('\n\n---\n\n')
}

/**
 * Prepare AI messages for research synthesis
 */
function prepareResearchMessages(
    originalQuery: string,
    expandedQueries: string[],
    context: string
): ModelMessage[] {
    const systemPrompt = `You are VerifyAI Deep Research, an advanced AI research assistant that synthesizes information from multiple search queries.

RESEARCH MODE:
You have access to search results from multiple related queries:
- Original query: "${originalQuery}"
- Expanded queries: ${expandedQueries.map((q, i) => `"${q}"`).join(', ')}

CORE OBJECTIVE:
Provide a comprehensive, well-researched answer by synthesizing information across ALL sources. Your answer should be thorough and cover multiple aspects of the topic.

CITATION & SOURCING RULES:
- CITATION STRICTNESS: You MUST cite your sources for every factual claim.
- FORMAT: Use inline citations like [1], [2] immediately after the claim.
- ACCURACY: Use the source numbers as provided in the context.
- PLACEMENT: Place citations at the end of sentences or clauses.

RESPONSE GUIDELINES:
- **Comprehensive**: Cover multiple angles of the topic using the expanded queries.
- **Structured**: Use headings (##), bullet points, and bold text for organization.
- **Synthesis**: Don't just list facts; weave information from multiple sources into a coherent narrative.
- **Length**: Aim for a thorough answer (800-1500 words) that fully addresses the research question.
- **Tone**: Professional, objective, and informative.

Formatting Numbers:
- Write "1 million" instead of "$1$ million".
- Write "50%" instead of "$50\\%".
- Never use LaTeX for simple numbers.`

    const userPrompt = `RESEARCH QUERY: "${originalQuery}"

COMPREHENSIVE SEARCH RESULTS (from multiple related queries):
${context}

INSTRUCTIONS:
Synthesize a comprehensive research report using ALL the sources above. Cover different aspects of the topic from the various queries. Cite sources as [1], [2], etc.`

    return [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ]
}

/**
 * Generate follow-up questions for research
 */
async function generateResearchFollowUps(
    groq: any,
    query: string,
    expandedQueries: string[],
    fullText: string
): Promise<string[]> {
    try {
        const response = await generateText({
            model: groq('llama-3.1-8b-instant'),
            messages: [
                {
                    role: 'system',
                    content: 'Generate 3-4 follow-up research questions to explore the topic further. One per line, under 12 words, no bullets or numbers.'
                },
                {
                    role: 'user',
                    content: `Original: ${query}\nExpanded: ${expandedQueries.slice(0, 2).join(', ')}\n\nAnswer: ${fullText.substring(0, 500)}`
                }
            ],
            temperature: 0.7,
            maxRetries: 2
        })

        return response.text
            .split('\n')
            .map(q => q.trim().replace(/^[\d.)\-•]+\s*/, ''))
            .filter(q => q.length > 5 && q.length < 100)
            .slice(0, 4)
    } catch (error) {
        console.error('Error generating research follow-ups:', error)
        return []
    }
}

// ============================================================================
// Main POST Handler
// ============================================================================

export async function POST(request: Request) {
    const requestId = Math.random().toString(36).substring(7)

    // Rate limiting
    const identifier = getClientIdentifier(request)
    const rateLimitResult = rateLimit(identifier, {
        windowMs: 60 * 1000,
        maxRequests: 15, // Lower limit for research (more expensive)
    })

    if (!rateLimitResult.allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
        )
    }

    try {
        const body = await request.json()
        const messages = body.messages || []
        const userId = body.userId || null
        const userEmail = body.userEmail || null
        const sessionId = body.sessionId || null
        const additionalQueriesCount = Math.min(body.additionalQueriesCount || 3, 5)
        const includeSubpages = body.includeSubpages || false
        const forceLiveCrawl = body.forceLiveCrawl || false

        // Extract query
        let query = body.query
        if (!query && messages.length > 0) {
            const lastMessage = messages[messages.length - 1]
            if (lastMessage.parts?.length > 0) {
                query = lastMessage.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join(' ')
            } else if (lastMessage.content) {
                query = lastMessage.content
            }
        }

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 })
        }

        // Validate query
        const validation = validateSearchQuery(query)
        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 })
        }
        query = validation.sanitized

        // Check API keys
        const exaApiKey = body.firecrawlApiKey || process.env.FIRECRAWL_API_KEY
        const groqApiKey = process.env.GROQ_API_KEY

        if (!exaApiKey || !groqApiKey) {
            return NextResponse.json({ error: 'API keys not configured' }, { status: 500 })
        }

        const groq = createGroq({ apiKey: groqApiKey })

        // Create UI message stream
        const stream = createUIMessageStream({
            originalMessages: messages,
            execute: async ({ writer }) => {
                console.log('[Research] Starting deep research for:', query)
                let researchSessionId: string | null = null

                try {
                    // 1. Send initial status
                    writer.write({ type: 'data-status', id: 'status-1', data: { message: 'Starting deep research...' } })

                    // 2. Get Supabase user ID
                    let supabaseUserId: string | null = null
                    if (userEmail) {
                        try {
                            const user = await createOrGetUser(userEmail)
                            supabaseUserId = user?.id || null
                        } catch (err) {
                            console.error('Failed to get user:', err)
                        }
                    }

                    // 3. Generate expanded queries
                    writer.write({ type: 'data-status', id: 'status-2', data: { message: 'Expanding research queries...' } })
                    writer.write({
                        type: 'data-research-progress',
                        id: 'progress-expanding',
                        data: { step: 'expanding', percentage: 10 }
                    })

                    const expandedQueries = await generateExpandedQueries(groq, query, additionalQueriesCount)
                    console.log('[Research] Expanded queries:', expandedQueries)

                    // Send expanded queries to frontend
                    writer.write({
                        type: 'data-expanded-queries',
                        id: 'expanded-1',
                        data: { original: query, expanded: expandedQueries }
                    })

                    // 4. Create research session in database
                    try {
                        const session = await createResearchSession({
                            user_id: supabaseUserId,
                            conversation_id: sessionId,
                            original_query: query,
                            research_mode: 'deep',
                            additional_queries_count: additionalQueriesCount,
                            expanded_queries: expandedQueries,
                            total_sources_found: 0,
                            synthesis_status: 'in_progress',
                            final_report: null,
                            total_cost_usd: null,
                            total_tokens_used: null,
                            metadata: { requestId }
                        })
                        if (session) {
                            researchSessionId = session.id
                            console.log('[Research] Created session:', researchSessionId)
                        }
                    } catch (err) {
                        console.error('Failed to create research session:', err)
                    }

                    // 5. Execute parallel searches
                    const allQueries: ExpandedQuery[] = [
                        { query, order: 0, isOriginal: true },
                        ...expandedQueries.map((q, i) => ({ query: q, order: i + 1, isOriginal: false }))
                    ]

                    const allSources: SearchSource[] = []

                    const totalQueries = allQueries.length
                    const queriesExploredData: { query: string; isOriginal: boolean; sources: any[]; count: number }[] = []

                    for (const [idx, q] of allQueries.entries()) {
                        // Calculate progress percentage: 20% for expansion, 60% for searching, 20% for synthesis
                        const searchProgress = 20 + Math.round((idx / totalQueries) * 60)

                        // Send detailed progress event
                        writer.write({
                            type: 'data-research-progress',
                            id: `progress-${idx}`,
                            data: {
                                step: 'searching',
                                current: idx + 1,
                                total: totalQueries,
                                currentQuery: q.query,
                                percentage: searchProgress
                            }
                        })

                        writer.write({
                            type: 'data-status',
                            id: `status-search-${idx}`,
                            data: { message: `Searching: "${q.query.substring(0, 50)}..."` }
                        })

                        const sources = await executeExaSearch(q.query, exaApiKey, 8, { includeSubpages, forceLiveCrawl })
                        console.log(`[Research] Query ${idx + 1} found ${sources.length} sources`)

                        allSources.push(...sources)

                        // Track sources per query for grouped display
                        queriesExploredData.push({
                            query: q.query,
                            isOriginal: q.isOriginal,
                            sources: sources.map(s => ({ url: s.url, title: s.title, favicon: s.favicon })),
                            count: sources.length
                        })

                        // Track API usage
                        trackApiUsage({
                            user_id: supabaseUserId,
                            query_id: null,
                            api_provider: 'exa',
                            api_endpoint: '/search',
                            status_code: 200,
                            response_time_ms: null,
                            was_successful: sources.length > 0,
                            error_message: null,
                            request_count: 1,
                            tokens_used: null,
                            cost_usd: null,
                            metadata: { query: q.query, resultsCount: sources.length }
                        }).catch(err => console.error('Failed to track API usage:', err))
                    }

                    // Send queries explored data for grouped display
                    writer.write({
                        type: 'data-queries-explored',
                        id: 'queries-explored-1',
                        data: { queriesExplored: queriesExploredData }
                    })

                    // 6. Deduplicate and prepare sources
                    writer.write({ type: 'data-status', id: 'status-3', data: { message: 'Analyzing sources...' } })

                    const uniqueSources = deduplicateSources(allSources)
                    console.log(`[Research] Total unique sources: ${uniqueSources.length}`)

                    // Update research session with source count
                    if (researchSessionId) {
                        updateResearchSession(researchSessionId, {
                            total_sources_found: uniqueSources.length
                        }).catch(err => console.error('Failed to update session:', err))
                    }

                    // 7. Send sources to frontend
                    const sourcesForUI = uniqueSources.map(s => ({
                        url: s.url,
                        title: s.title,
                        description: s.description,
                        content: s.content,
                        favicon: s.favicon,
                        image: s.image,
                        siteName: s.siteName
                    }))

                    writer.write({
                        type: 'data-sources',
                        id: 'sources-1',
                        data: { sources: sourcesForUI, newsResults: [], imageResults: [] }
                    })

                    // 8. Prepare context and generate research report
                    writer.write({ type: 'data-status', id: 'status-4', data: { message: 'Synthesizing comprehensive research report...' } })
                    writer.write({
                        type: 'data-research-progress',
                        id: 'progress-synthesizing',
                        data: { step: 'synthesizing', percentage: 85 }
                    })

                    const context = prepareResearchContext(uniqueSources, query, 10)
                    const aiMessages = prepareResearchMessages(query, expandedQueries, context)

                    console.log('[Research] Starting synthesis with', aiMessages.length, 'messages')
                    const groqStartTime = Date.now()

                    // Generate the full research report
                    const result = streamText({
                        model: groq('llama-3.1-8b-instant'),
                        messages: aiMessages,
                        temperature: 0.7,
                        onFinish: async ({ text }) => {
                            console.log('[Research] Synthesis complete. Length:', text.length)

                            // Update research session
                            if (researchSessionId) {
                                updateResearchSession(researchSessionId, {
                                    synthesis_status: 'completed',
                                    final_report: text,
                                    completed_at: new Date().toISOString()
                                }).catch(err => console.error('Failed to update session:', err))
                            }
                        }
                    })

                    // CRITICAL: Wait for full response to avoid truncation
                    const accumulatedText = await result.text
                    console.log('[Research] FULL TEXT RECEIVED:', accumulatedText.length, 'chars')

                    // Write complete text to stream
                    writer.write({ type: 'text-start', id: 'answer' })
                    writer.write({ type: 'text-delta', id: 'answer', delta: accumulatedText })
                    writer.write({ type: 'text-end', id: 'answer' })

                    const groqEndTime = Date.now()
                    console.log('[Research] Synthesis took:', groqEndTime - groqStartTime, 'ms')

                    // Track Groq usage
                    trackApiUsage({
                        user_id: supabaseUserId,
                        query_id: null,
                        api_provider: 'groq',
                        api_endpoint: 'llama-3.1-8b-instant',
                        status_code: 200,
                        response_time_ms: groqEndTime - groqStartTime,
                        was_successful: true,
                        error_message: null,
                        request_count: 1,
                        tokens_used: null,
                        cost_usd: null,
                        metadata: { researchMode: true, queriesCount: allQueries.length }
                    }).catch(err => console.error('Failed to track API usage:', err))

                    // 9. Generate follow-up questions
                    const followUps = await generateResearchFollowUps(groq, query, expandedQueries, accumulatedText)
                    if (followUps.length > 0) {
                        writer.write({ type: 'data-followup', id: 'followup-1', data: { questions: followUps } })
                    }

                    // 10. Save to conversation (if session exists)
                    try {
                        let conversationId = sessionId
                        let isNewConversation = false

                        if (!await getConversation(sessionId) && supabaseUserId) {
                            const newConv = await createConversation(supabaseUserId, `🔬 ${query.slice(0, 40)}`)
                            if (newConv) {
                                conversationId = newConv.id
                                isNewConversation = true
                                writer.write({
                                    type: 'data-conversation-id',
                                    id: 'conv-id-1',
                                    data: { conversationId }
                                })
                            }
                        }

                        if (conversationId && supabaseUserId) {
                            await saveMessage({
                                conversation_id: conversationId,
                                role: 'user',
                                content: query,
                                parts: [{ type: 'text', text: query }],
                                metadata: { researchMode: true },
                                query_id: null
                            })

                            await saveMessage({
                                conversation_id: conversationId,
                                role: 'assistant',
                                content: accumulatedText,
                                parts: [{ type: 'text', text: accumulatedText }],
                                metadata: {
                                    researchMode: true,
                                    researchSessionId,
                                    expandedQueries,
                                    sourcesCount: uniqueSources.length,
                                    followUpQuestions: followUps
                                },
                                query_id: null
                            })

                            if (isNewConversation) {
                                // Auto-generate title
                                generateText({
                                    model: groq('llama-3.1-8b-instant'),
                                    messages: [
                                        { role: 'system', content: 'Generate a 3-5 word title. No punctuation, no quotes.' },
                                        { role: 'user', content: query }
                                    ],
                                    temperature: 0.5
                                }).then(res => {
                                    const title = res.text.trim().slice(0, 50)
                                    if (title && conversationId) {
                                        updateConversationTitle(conversationId, `🔬 ${title}`)
                                    }
                                }).catch(console.error)
                            }
                        }
                    } catch (err) {
                        console.error('Failed to save conversation:', err)
                    }

                    // 11. Send progress complete at 100%
                    writer.write({
                        type: 'data-research-progress',
                        id: 'progress-complete',
                        data: {
                            step: 'complete',
                            percentage: 100
                        }
                    })

                    // 12. Send completion
                    writer.write({
                        type: 'data-research-completed',
                        id: 'completed-1',
                        data: {
                            success: true,
                            researchSessionId,
                            sourcesCount: uniqueSources.length,
                            queriesExpanded: expandedQueries.length
                        }
                    })

                    console.log('[Research] Research complete')

                } catch (error) {
                    console.error('[Research] Error:', error)
                    writer.write({
                        type: 'error',
                        errorText: error instanceof Error ? error.message : 'Research failed'
                    })

                    // Update session status to failed
                    if (researchSessionId) {
                        updateResearchSession(researchSessionId, {
                            synthesis_status: 'failed'
                        }).catch(console.error)
                    }
                }
            }
        })

        return createUIMessageStreamResponse({ stream })

    } catch (error) {
        console.error('[Research] Fatal error:', error)
        return NextResponse.json(
            { error: 'Research failed', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
