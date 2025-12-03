'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { getChatHistory } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { MessageSquare, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export function HistorySidebar() {
    const { user, isLoaded, isSignedIn } = useUser()
    const [history, setHistory] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (isOpen && isLoaded && isSignedIn && user) {
            loadHistory()
        }
    }, [isOpen, isLoaded, isSignedIn, user])

    const loadHistory = async () => {
        setIsLoading(true)
        try {
            const data = await getChatHistory(user!.id)
            setHistory(data)
        } catch (error) {
            console.error('Failed to load history:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isLoaded || !isSignedIn) return null

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                    <Clock className="w-5 h-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
                <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                        <Clock className="w-5 h-5 text-orange-500" />
                        History
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-100px)] pr-4">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No history yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {history.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link
                                        href={`/?q=${encodeURIComponent(item.query_text)}`}
                                        onClick={() => setIsOpen(false)}
                                        className="block p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {item.query_text}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 dark:text-gray-600 dark:group-hover:text-gray-400 opacity-0 group-hover:opacity-100 transition-all" />
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
