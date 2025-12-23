'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { createOrGetUser, getConversations as getConversationsDb, getConversationWithMessages } from '@/lib/db/queries'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

/**
 * Get chat history (conversations) for sidebar display
 * Uses the new conversations table, with fallback to legacy query-based history
 */
export async function getChatHistory(userId: string) {
    const user = await currentUser()
    if (user?.id !== userId) return []

    const supabase = createAdminClient()

    // First, get the Supabase user ID by email
    const userEmail = user.emailAddresses?.[0]?.emailAddress
    if (!userEmail) return []

    const { data: supabaseUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single()

    if (userError || !supabaseUser) {
        console.error('Error fetching Supabase user:', userError)
        return []
    }

    const supabaseUserId = (supabaseUser as any).id

    // Try to get conversations from the new table first
    const conversations = await getConversationsDb(supabaseUserId)

    if (conversations.length > 0) {
        // Use new conversations table
        return conversations.map(conv => ({
            id: conv.id,
            title: conv.title,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            is_legacy: false
        }))
    }

    // Fallback: Legacy query-based history (for existing data)
    const { data: queries, error } = await supabase
        .from('queries')
        .select('id, query_text, created_at, session_id, query_type')
        .eq('user_id', supabaseUserId)
        .order('created_at', { ascending: false })
        .limit(100)

    if (error) {
        console.error('Error fetching chat history:', error)
        return []
    }

    const sessionsMap = new Map()

    for (const query of (queries as any[])) {
        const sessionId = query.session_id || `legacy-${query.id}`
        if (!sessionsMap.has(sessionId)) {
            sessionsMap.set(sessionId, {
                id: sessionId,
                title: query.query_text?.slice(0, 50) || 'Untitled',
                created_at: query.created_at,
                updated_at: query.created_at,
                is_legacy: true,
                query_type: query.query_type
            })
        }
    }

    return Array.from(sessionsMap.values())
}

export async function getBookmarks(userId: string) {
    const user = await currentUser()
    if (user?.id !== userId) return []

    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching bookmarks:', error)
        return []
    }

    return data
}

export async function toggleBookmark(userId: string, queryId: string, title: string, queryText: string, aiResponse?: string) {
    const user = await currentUser()
    if (user?.id !== userId) throw new Error('Unauthorized')

    // Ensure user exists in Supabase
    await createOrGetUser(user.emailAddresses[0].emailAddress, {
        id: user.id,
        email: user.emailAddresses[0].emailAddress
    })

    const supabase = createAdminClient()

    // Check if already bookmarked
    const { data: existing } = await supabase
        .from('saved_searches')
        .select('id')
        .eq('user_id', userId)
        .eq('query_id', queryId)
        .single()

    if (existing) {
        // Remove bookmark
        const { error } = await supabase
            .from('saved_searches')
            .delete()
            .eq('id', (existing as any).id)

        if (error) throw error
        revalidatePath('/bookmarks')
        return { isBookmarked: false }
    } else {
        // Add bookmark with AI response stored in metadata
        const { error } = await supabase
            .from('saved_searches')
            .insert({
                user_id: userId,
                query_id: queryId,
                title: title,
                query_text: queryText,
                metadata: aiResponse ? { ai_response: aiResponse } : {}
            } as any)

        if (error) throw error
        revalidatePath('/bookmarks')
        return { isBookmarked: true }
    }
}

export async function deleteBookmark(bookmarkId: string) {
    const user = await currentUser()
    if (!user) throw new Error('Unauthorized')

    const supabase = createAdminClient()

    const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', bookmarkId)

    if (error) throw error
    revalidatePath('/bookmarks')
}

export async function getSessionMessages(sessionId: string) {
    const user = await currentUser()
    if (!user) return { messages: [], messageData: [] }

    const supabase = createAdminClient()

    // Check if this is a new-style conversation ID (try to fetch from conversations table)
    const conversationData = await getConversationWithMessages(sessionId)

    if (conversationData) {
        // New conversation-based format
        const messages = conversationData.messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            parts: msg.parts || [{ type: 'text', text: msg.content }],
            createdAt: new Date(msg.created_at)
        }))

        // Extract messageData from metadata
        const messageData: [string, any][] = []
        let assistantIndex = 1
        for (const msg of conversationData.messages) {
            if (msg.role === 'assistant' && msg.metadata) {
                messageData.push([assistantIndex.toString(), msg.metadata])
                assistantIndex++
            }
        }

        return { messages, messageData }
    }

    // Fallback: Legacy session-based format
    const { data, error } = await supabase
        .from('queries')
        .select('*, search_results(*)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching session messages:', error)
        return { messages: [], messageData: [] }
    }

    const queryData = data as any[]

    // Convert queries to messages format
    const messages: any[] = []
    const messageDataMap = new Map()

    for (const query of queryData) {
        messages.push({
            id: query.id,
            role: 'user',
            content: query.query_text,
            parts: [{ type: 'text', text: query.query_text }],
            createdAt: new Date(query.created_at)
        })

        const fullResponse = (query.response_metadata as any)?.full_response
        if (fullResponse) {
            const assistantId = `assistant-${query.id}`
            messages.push({
                id: assistantId,
                role: 'assistant',
                content: fullResponse,
                parts: [{ type: 'text', text: fullResponse }],
                createdAt: new Date(query.created_at)
            })

            // Store sources in messageData if they exist
            if (query.search_results && query.search_results.length > 0) {
                messageDataMap.set(assistantId, {
                    sources: query.search_results.filter((r: any) => r.result_type === 'web'),
                    news: query.search_results.filter((r: any) => r.result_type === 'news'),
                    images: query.search_results.filter((r: any) => r.result_type === 'image'),
                    queryId: query.id
                })
            }
        }
    }

    return { messages, messageData: Array.from(messageDataMap.entries()) }
}
