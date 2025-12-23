'use client'

import { useEffect, useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { getChatHistory } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { MessageSquare, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { toast } from 'sonner'

export function HistorySidebar() {
    const { user, isLoaded, isSignedIn } = useUser()
    const [history, setHistory] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)

    const loadHistory = useCallback(async () => {
        if (!user) return
        setIsLoading(true)
        try {
            const data = await getChatHistory(user.id)
            setHistory(data)
        } catch (error) {
            console.error('Failed to load history:', error)
            toast.error('Failed to load search history')
        } finally {
            setIsLoading(false)
        }
    }, [user])

    useEffect(() => {
        if (isOpen && isLoaded && isSignedIn && user) {
            loadHistory()
        }
    }, [isOpen, isLoaded, isSignedIn, user, loadHistory])

    useEffect(() => {
        const handleSearchCompleted = () => {
            if (user) loadHistory()
        }

        globalThis.addEventListener('verifyai:search-completed', handleSearchCompleted)
        return () => globalThis.removeEventListener('verifyai:search-completed', handleSearchCompleted)
    }, [user, loadHistory])

    const groupHistoryByDate = (history: any[]) => {
        const groups: { [key: string]: any[] } = {
            'Today': [],
            'Yesterday': [],
            'Previous 7 Days': [],
            'Older': []
        }

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const lastWeek = new Date(today)
        lastWeek.setDate(lastWeek.getDate() - 7)

        for (const item of history) {
            const date = new Date(item.created_at)
            const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

            if (itemDate.getTime() === today.getTime()) {
                groups['Today'].push(item)
            } else if (itemDate.getTime() === yesterday.getTime()) {
                groups['Yesterday'].push(item)
            } else if (itemDate > lastWeek) {
                groups['Previous 7 Days'].push(item)
            } else {
                groups['Older'].push(item)
            }
        }

        return groups
    }

    const groupedHistory = groupHistoryByDate(history)

    if (!isLoaded || !isSignedIn) return null

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                    <Clock className="w-5 h-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-0">
                <SheetHeader className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <SheetTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        History
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-80px)]">
                    <div className="p-4 space-y-6">
                        <div className="p-4 space-y-6">
                            {isLoading && (
                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="h-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl animate-pulse" />
                                    ))}
                                </div>
                            )}

                            {!isLoading && history.length === 0 && (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MessageSquare className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="font-medium">No history yet</p>
                                    <p className="text-sm mt-1 opacity-60">Start searching to see your history here</p>
                                </div>
                            )}

                            {!isLoading && history.length > 0 && (
                                Object.entries(groupedHistory).map(([label, items]) => (
                                    items.length > 0 && (
                                        <div key={label} className="space-y-3">
                                            <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2">
                                                {label}
                                            </h3>
                                            <div className="space-y-1">
                                                {items.map((item, index) => (
                                                    <motion.div
                                                        key={item.id}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: index * 0.03 }}
                                                    >
                                                        <Link
                                                            href={item.is_legacy
                                                                ? `/?q=${encodeURIComponent(item.title)}`
                                                                : `/?sid=${item.id}`
                                                            }
                                                            onClick={() => setIsOpen(false)}
                                                            className="block p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group border border-transparent hover:border-gray-100 dark:hover:border-gray-800"
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                                                        {item.title}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-500 font-medium">
                                                                            {item.query_type || 'WEB'}
                                                                        </span>
                                                                        <span className="text-xs text-gray-400">
                                                                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                                                            </div>
                                                        </Link>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
