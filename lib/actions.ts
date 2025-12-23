'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { createOrGetUser } from '@/lib/db/queries'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function getChatHistory(userId: string) {
    const user = await currentUser()
    if (user?.id !== userId) return []

    const supabase = createAdminClient()

    // First, get the Supabase user ID by email (since queries are saved with Supabase UUIDs, not Clerk IDs)
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

    const { data: queries, error } = await supabase
        .from('queries')
        .select('id, query_text, created_at, session_id, query_type')
        .eq('user_id', (supabaseUser as any).id)
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
                title: query.query_text,
                created_at: query.created_at,
                is_legacy: !query.session_id,
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

export async function toggleBookmark(userId: string, queryId: string, title: string, queryText: string) {
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
        // Add bookmark
        const { error } = await supabase
            .from('saved_searches')
            .insert({
                user_id: userId,
                query_id: queryId,
                title: title,
                query_text: queryText
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
    if (!user) return []

    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('queries')
        .select('*, search_results(*)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching session messages:', error)
        return []
    }

    const queryData = data as any[]

    // Convert queries to messages format
    const messages: any[] = []
    const messageData = new Map()

    for (const query of queryData) {
        messages.push({
            id: query.id,
            role: 'user',
            content: query.query_text,
            createdAt: new Date(query.created_at)
        })

        const fullResponse = (query.response_metadata as any)?.full_response
        if (fullResponse) {
            const assistantId = `assistant-${query.id}`
            messages.push({
                id: assistantId,
                role: 'assistant',
                content: fullResponse,
                createdAt: new Date(query.created_at)
            })

            // Store sources in messageData if they exist
            if (query.search_results && query.search_results.length > 0) {
                messageData.set(assistantId, {
                    sources: query.search_results.filter((r: any) => r.result_type === 'web'),
                    news: query.search_results.filter((r: any) => r.result_type === 'news'),
                    images: query.search_results.filter((r: any) => r.result_type === 'image'),
                    queryId: query.id
                })
            }
        }
    }

    return { messages, messageData: Array.from(messageData.entries()) }
}

