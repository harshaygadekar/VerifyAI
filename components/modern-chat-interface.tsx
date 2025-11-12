'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, User, Bot, Copy, Check, Sparkles, FileText, Plus, ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SearchResult, NewsResult, ImageResult, SourceType } from '../app/types'
import { type UIMessage } from 'ai'
import { MarkdownRenderer } from '../app/markdown-renderer'
import { TypingIndicator, SearchLoadingSteps } from './loading-animation'
import { ImageResults } from '../app/image-results'
import { NewsResults } from '../app/news-results'
import { ExportMenu } from './export-menu'
import { CitationExport } from './citation-export'
import { SourceFilter } from './source-filter'
import { SearchSuggestions } from './search-suggestions'
import Image from 'next/image'

interface MessageData {
  sources: SearchResult[]
  newsResults?: NewsResult[]
  imageResults?: ImageResult[]
  followUpQuestions: string[]
  ticker?: string
}

interface ModernChatInterfaceProps {
  messages: UIMessage[]
  sources: SearchResult[]
  newsResults: NewsResult[]
  imageResults: ImageResult[]
  followUpQuestions: string[]
  searchStatus: string
  isLoading: boolean
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  messageData?: Map<number, MessageData>
  currentTicker?: string | null
  allSources?: SearchResult[]
  sourceFilter?: SourceType
  onSourceFilterChange?: (type: SourceType) => void
}

// Helper function to extract text content from UIMessage
function getMessageContent(message: UIMessage): string {
  if (!message.parts) return ''
  return message.parts
    .filter((part: any) => part.type === 'text')
    .map((part: any) => part.text)
    .join('')
}

export function ModernChatInterface({
  messages,
  sources,
  newsResults,
  imageResults,
  followUpQuestions,
  searchStatus,
  isLoading,
  input,
  handleInputChange,
  handleSubmit,
  messageData,
  currentTicker,
  allSources = [],
  sourceFilter = 'all',
  onSourceFilterChange
}: ModernChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const displaySources = allSources.length > 0 ? allSources : sources

  // Extract first user query for export
  const firstUserMessage = messages.find(m => m.role === 'user')
  const query = firstUserMessage ? getMessageContent(firstUserMessage) : 'Untitled'

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  // Auto-scroll to bottom when new content appears
  useEffect(() => {
    if (isAtBottom && scrollContainerRef.current) {
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }, 100)
    }
  }, [messages, sources, followUpQuestions, isAtBottom])

  // Check if user is at bottom
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
      setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 100)
    }
  }

  const scrollToBottom = () => {
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth'
    })
    setIsAtBottom(true)
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    handleSubmit(e)
    setIsAtBottom(true)
    setShowSuggestions(false)
  }

  const handleFollowUpClick = (question: string) => {
    handleInputChange({ target: { value: question } } as React.ChangeEvent<HTMLTextAreaElement>)
    setTimeout(() => formRef.current?.requestSubmit(), 50)
  }

  const handleCopy = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content)
    setCopiedMessageId(messageId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  const handleInputChangeWithSuggestions = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e)
    setShowSuggestions(isFocused && messages.length === 0)
  }

  const handleSelectSuggestion = (suggestion: string) => {
    handleInputChange({ target: { value: suggestion } } as React.ChangeEvent<HTMLTextAreaElement>)
    setShowSuggestions(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900">
      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
        onScroll={handleScroll}
      >
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to VerifyAI
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Ask me anything and I'll search the web, analyze sources, and provide you with comprehensive answers.
              </p>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id || index}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                <div className={`max-w-3xl ${message.role === 'user' ? 'order-first' : ''}`}>
                  {message.role === 'user' ? (
                    <div className="bg-orange-500 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-lg">
                      <p className="text-sm font-medium">{getMessageContent(message)}</p>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="prose prose-gray max-w-none dark:prose-invert prose-sm">
                        <MarkdownRenderer
                          content={getMessageContent(message)}
                          sources={sources}
                        />
                      </div>

                      {/* Message Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(getMessageContent(message), message.id || `${index}`)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {copiedMessageId === (message.id || `${index}`) ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          <span className="ml-2 text-xs">
                            {copiedMessageId === (message.id || `${index}`) ? 'Copied!' : 'Copy'}
                          </span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading States */}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <motion.div
              className="flex gap-4 justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="max-w-3xl">
                {searchStatus ? (
                  <SearchLoadingSteps currentStep={searchStatus} />
                ) : (
                  <TypingIndicator />
                )}
              </div>
            </motion.div>
          )}

          {/* Source Filter & Export Actions */}
          {sources.length > 0 && !isLoading && (
            <motion.div
              className="flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {onSourceFilterChange && (
                <SourceFilter
                  sources={displaySources}
                  selectedType={sourceFilter}
                  onSelectType={onSourceFilterChange}
                />
              )}

              <div className="ml-auto flex gap-2">
                <CitationExport sources={sources} newsResults={newsResults} />
                <ExportMenu
                  messages={messages}
                  sources={sources}
                  newsResults={newsResults}
                  imageResults={imageResults}
                  query={query}
                  ticker={currentTicker || undefined}
                />
              </div>
            </motion.div>
          )}

          {/* Sources Display */}
          {sources.length > 0 && !isLoading && (
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Sources</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sources.slice(0, 6).map((source, index) => (
                  <motion.a
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start gap-3">
                      {source.favicon && (
                        <Image
                          src={source.favicon}
                          alt=""
                          width={16}
                          height={16}
                          className="w-4 h-4 mt-1 flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                          {source.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {source.siteName || new URL(source.url).hostname}
                        </p>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}

          {/* Image Results Display */}
          {imageResults.length > 0 && !isLoading && (
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <ImageResults results={imageResults} isLoading={false} />
            </motion.div>
          )}

          {/* News Results Display */}
          {newsResults.length > 0 && !isLoading && (
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <NewsResults results={newsResults} isLoading={false} />
            </motion.div>
          )}

          {/* Follow-up Questions */}
          {followUpQuestions.length > 0 && !isLoading && (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Related Questions</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {followUpQuestions.map((question, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleFollowUpClick(question)}
                    className="text-left p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md transition-all group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start gap-3">
                      <Plus className="w-4 h-4 text-gray-400 group-hover:text-orange-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400">
                        {question}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {!isAtBottom && (
          <motion.div
            className="absolute bottom-32 right-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <Button
              onClick={scrollToBottom}
              size="sm"
              className="rounded-full w-10 h-10 p-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl"
              variant="outline"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto p-4">
          <form ref={formRef} onSubmit={handleFormSubmit} className="relative">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg focus-within:border-orange-300 dark:focus-within:border-orange-600 focus-within:shadow-xl transition-all">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChangeWithSuggestions}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  setIsFocused(true)
                  setShowSuggestions(messages.length === 0)
                }}
                onBlur={() => {
                  setIsFocused(false)
                  setTimeout(() => setShowSuggestions(false), 200)
                }}
                placeholder="Ask me anything..."
                className="w-full resize-none border-0 bg-transparent px-4 py-4 pr-12 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-0 focus:outline-none"
                rows={1}
                disabled={isLoading}
              />
              <div className="absolute right-2 bottom-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isLoading}
                  className="rounded-xl w-8 h-8 p-0 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 dark:disabled:bg-gray-600"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Search Suggestions */}
            <SearchSuggestions
              input={input}
              onSelectSuggestion={handleSelectSuggestion}
              isVisible={showSuggestions}
            />

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
