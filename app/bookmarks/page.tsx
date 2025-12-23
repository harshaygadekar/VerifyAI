'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { getBookmarks, deleteBookmark } from '@/lib/actions'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, ExternalLink, Bookmark, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export default function BookmarksPage() {
    const { user, isLoaded, isSignedIn } = useUser()
    const [bookmarks, setBookmarks] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const loadBookmarks = useCallback(async () => {
        if (!user) return
        try {
            const data = await getBookmarks(user.id)
            setBookmarks(data)
        } catch (error) {
            console.error('Failed to load bookmarks:', error)
            toast.error('Failed to load bookmarks')
        } finally {
            setIsLoading(false)
        }
    }, [user])

    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            loadBookmarks()
        } else if (isLoaded && !isSignedIn) {
            setIsLoading(false)
        }
    }, [isLoaded, isSignedIn, user, loadBookmarks])

    const handleDelete = async (id: string) => {
        try {
            await deleteBookmark(id)
            setBookmarks(bookmarks.filter(b => b.id !== id))
            toast.success('Bookmark removed')
        } catch (error) {
            console.error('Failed to delete bookmark:', error)
            toast.error('Failed to remove bookmark')
        }
    }

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id)
    }

    if (!isLoaded) return null

    if (!isSignedIn) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900">
                <Navigation currentPage="bookmarks" />
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
            <Navigation currentPage="bookmarks" />

            <main className="max-w-4xl mx-auto px-4 py-8 pt-24">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                        <Bookmark className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Saved Answers</h1>
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
                            Bookmark AI answers to find them quickly later.
                        </p>
                        <Button asChild>
                            <Link href="/">Start Searching</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {bookmarks.map((bookmark, index) => {
                            const isExpanded = expandedId === bookmark.id
                            const aiResponse = bookmark.metadata?.ai_response

                            return (
                                <motion.div
                                    key={bookmark.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-800 transition-all shadow-sm overflow-hidden"
                                >
                                    {/* Header - Always visible */}
                                    <div
                                        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                        onClick={() => toggleExpand(bookmark.id)}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <MessageSquare className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                                                        {bookmark.title}
                                                    </h3>
                                                </div>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-1">
                                                    {aiResponse ? aiResponse.slice(0, 100) + '...' : bookmark.query_text}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-gray-400 mt-2">
                                                    <span>{new Date(bookmark.created_at).toLocaleDateString()}</span>
                                                    {aiResponse && (
                                                        <span className="text-orange-500">
                                                            {isExpanded ? 'Click to collapse' : 'Click to expand'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {aiResponse && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-400"
                                                    >
                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDelete(bookmark.id)
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                                    asChild
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Link href={`/?q=${encodeURIComponent(bookmark.query_text)}`}>
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded AI Response */}
                                    <AnimatePresence>
                                        {isExpanded && aiResponse && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                                                        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                                            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300">
                                                                {aiResponse}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}
