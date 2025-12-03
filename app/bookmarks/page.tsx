'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { getBookmarks, deleteBookmark } from '@/lib/actions'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, ExternalLink, Bookmark } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function BookmarksPage() {
    const { user, isLoaded, isSignedIn } = useUser()
    const [bookmarks, setBookmarks] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            loadBookmarks()
        } else if (isLoaded && !isSignedIn) {
            setIsLoading(false)
        }
    }, [isLoaded, isSignedIn, user])

    const loadBookmarks = async () => {
        try {
            const data = await getBookmarks(user!.id)
            setBookmarks(data)
        } catch (error) {
            toast.error('Failed to load bookmarks')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteBookmark(id)
            setBookmarks(bookmarks.filter(b => b.id !== id))
            toast.success('Bookmark removed')
        } catch (error) {
            toast.error('Failed to remove bookmark')
        }
    }

    if (!isLoaded) return null

    if (!isSignedIn) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900">
                <Navigation currentPage="settings" />
                <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                    <Bookmark className="w-16 h-16 text-gray-300 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sign in to view bookmarks</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Save your favorite searches and access them anytime.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <Navigation currentPage="settings" />

            <main className="max-w-4xl mx-auto px-4 py-8 pt-24">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                        <Bookmark className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Saved Searches</h1>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : bookmarks.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                        <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No bookmarks yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Bookmark interesting searches to find them quickly later.
                        </p>
                        <Button asChild>
                            <Link href="/">Start Searching</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {bookmarks.map((bookmark, index) => (
                            <motion.div
                                key={bookmark.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800 transition-all shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
                                            {bookmark.title}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                                            {bookmark.query_text}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                            <span>{new Date(bookmark.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            onClick={() => handleDelete(bookmark.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                            asChild
                                        >
                                            <Link href={`/?q=${encodeURIComponent(bookmark.query_text)}`}>
                                                <ExternalLink className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
