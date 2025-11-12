'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Trash2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChatSession } from '@/app/types'
import { getChatHistory, deleteChatSession, clearChatHistory } from '@/lib/chat-history'
import { toast } from 'sonner'

interface HistorySidebarProps {
  isOpen: boolean
  onClose: () => void
  onLoadChat: (session: ChatSession) => void
}

export function HistorySidebar({ isOpen, onClose, onLoadChat }: HistorySidebarProps) {
  const [history, setHistory] = useState<ChatSession[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredHistory, setFilteredHistory] = useState<ChatSession[]>([])

  // Load history on mount and when sidebar opens
  useEffect(() => {
    if (isOpen) {
      loadHistory()
    }
  }, [isOpen])

  // Filter history based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = history.filter(session =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredHistory(filtered)
    } else {
      setFilteredHistory(history)
    }
  }, [searchQuery, history])

  const loadHistory = () => {
    const data = getChatHistory()
    setHistory(data)
    setFilteredHistory(data)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the load action

    const success = deleteChatSession(id)
    if (success) {
      toast.success('Chat deleted')
      loadHistory()
    } else {
      toast.error('Failed to delete chat')
    }
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all chat history?')) {
      const success = clearChatHistory()
      if (success) {
        toast.success('All history cleared')
        loadHistory()
      } else {
        toast.error('Failed to clear history')
      }
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Chat History
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                />
              </div>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No chats found' : 'No chat history yet'}
                  </p>
                </div>
              ) : (
                filteredHistory.map((session) => (
                  <motion.div
                    key={session.id}
                    className="group p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                    onClick={() => {
                      onLoadChat(session)
                      onClose()
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {session.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatTimestamp(session.timestamp)}
                        </p>
                        {session.sources.length > 0 && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {session.sources.length} sources
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDelete(session.id, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500 dark:hover:text-red-400 p-1 h-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {history.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  className="w-full text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-200 dark:border-red-800"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All History
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
