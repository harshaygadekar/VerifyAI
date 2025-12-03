'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { createOrGetUser } from '@/lib/db/queries'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function getChatHistory(userId: string) {
    const user = await currentUser()
    if (user?.id !== userId) return []

    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('queries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) {
        console.error('Error fetching chat history:', error)
        return []
    }

    return data
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
