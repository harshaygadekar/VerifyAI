'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Loader2, User, Bot, Copy, Sparkles, FileText, Plus, ArrowUp,
  Paperclip, Globe, Image as ImageIcon, Search, Check, Bookmark
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@clerk/nextjs'
import { toggleBookmark } from '@/lib/actions'
import { toast } from 'sonner'
import { SearchResult, NewsResult, ImageResult } from '../app/types'
import { type UIMessage } from 'ai'
import { MarkdownRenderer } from '../app/markdown-renderer'
import { TypingIndicator, SearchLoadingSteps } from './loading-animation'
import { ImageResults } from '../app/image-results'

import { NewsResults } from '../app/news-results'
import Image from 'next/image'
import { useAutoResizeTextarea } from '@/hooks/use-auto-resize-textarea'
import { cn } from '@/lib/utils'

interface MessageData {
  sources: SearchResult[]
  newsResults?: NewsResult[]
  imageResults?: ImageResult[]
  followUpQuestions: string[]

  ticker?: string
  queryId?: string
}

interface ModernChatInterfaceProps {
  readonly messages: UIMessage[]
  readonly sources: SearchResult[]
  readonly newsResults: NewsResult[]
  readonly imageResults: ImageResult[]
  readonly followUpQuestions: string[]
  readonly searchStatus: string
  readonly isLoading: boolean
  readonly input: string
  readonly handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  readonly handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  readonly messageData?: Map<number, MessageData>
}

// Helper function to extract text content from UIMessage
function getMessageContent(message: UIMessage): string {
  if (!message.parts) {
    console.log('Message has no parts:', message);
    return (message as any).content || '';
  }
  const text = message.parts
    .filter((part: any) => part.type === 'text')
    .map((part: any) => part.text)
    .join('')
  console.log('Extracted text for message:', message.id, text);
  return text;
}

interface ActionButtonProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly onClick?: () => void;
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors shadow-sm"
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
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
  messageData
}: ModernChatInterfaceProps) {
  console.log('ModernChatInterface messages:', messages);
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  })

  const { user } = useUser()

  const handleBookmark = async (index: number) => {
    if (!user) {
      toast.error('Please sign in to bookmark')
      return
    }

    const data = messageData?.get(index)
    const queryId = data?.queryId

    if (!queryId) {
      toast.error('Cannot bookmark: Missing query ID')
      return
    }

    // Find the preceding user message for the query text
    const userMessage = messages[index - 1]
    const queryText = userMessage?.role === 'user' ? getMessageContent(userMessage) : 'Saved Search'

    try {
      const { isBookmarked } = await toggleBookmark(user.id, queryId, queryText.slice(0, 50), queryText)
      toast.success(isBookmarked ? 'Bookmark added' : 'Bookmark removed')
    } catch (error) {
      console.error('Bookmark error:', error)
      toast.error('Failed to update bookmark')
    }
  };

  // Adjust height when input changes
  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

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
    // Reset height after submit (though input clearing usually handles this via useEffect)
    setTimeout(() => adjustHeight(true), 0)
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      formRef.current?.requestSubmit()
    }
  }

  const handleActionClick = (action: string) => {
    // For now, just populate the input
    const prompts: Record<string, string> = {
      'search': 'Search the web for the latest news on ',
      'image': 'Find images of ',
      'research': 'Deep research on ',
    }
    const text = prompts[action] || ''
    handleInputChange({ target: { value: text } } as React.ChangeEvent<HTMLTextAreaElement>)
    textareaRef.current?.focus()
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/50 dark:to-gray-900">
      {/* Messages Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pb-48 scroll-smooth"
        onScroll={handleScroll}
      >
        <div className="max-w-4xl mx-auto py-8">
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/20">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                  What can I help you find?
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
                  Ask me anything and I&apos;ll search the web, analyze sources, and provide you with comprehensive answers.
                </p>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <ActionButton
                    icon={<Globe className="w-4 h-4 text-blue-500" />}
                    label="Search Web"
                    onClick={() => handleActionClick('search')}
                  />
                  <ActionButton
                    icon={<ImageIcon className="w-4 h-4 text-purple-500" />}
                    label="Find Images"
                    onClick={() => handleActionClick('image')}
                  />
                  <ActionButton
                    icon={<Search className="w-4 h-4 text-orange-500" />}
                    label="Deep Research"
                    onClick={() => handleActionClick('research')}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          <AnimatePresence>
            {messages
              .filter(msg => {
                // Filter out empty assistant messages to prevent blank bubbles
                if (msg.role === 'assistant') {
                  const content = getMessageContent(msg)
                  return content.trim().length > 0
                }
                return true
              })
              .map((message, index) => (
                <motion.div
                  key={message.id || `msg-${index}`}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div className={`max-w-3xl ${message.role === 'user' ? 'order-first' : ''}`}>
                    {message.role === 'user' ? (
                      <div className="bg-orange-600 text-white rounded-3xl rounded-br-sm px-6 py-4 shadow-md max-w-[85%] ml-auto">
                        <p className="text-base leading-relaxed">{getMessageContent(message)}</p>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-gray-800/50 rounded-3xl rounded-bl-sm px-6 py-4 shadow-sm border border-gray-100 dark:border-gray-700/50">
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBookmark(index)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <Bookmark className="w-4 h-4" />
                            <span className="ml-2 text-xs">Bookmark</span>
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
          {isLoading && messages.at(-1)?.role === 'user' && (
            <motion.div
              className="flex gap-4 justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
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
                    key={source.url || index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group p-3 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-md transition-all duration-200"
                    whileHover={{ scale: 1.02, y: -2 }}
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
                    key={question || index}
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
            className="fixed bottom-32 right-8 z-50"
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

      {/* Input Area - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 pb-6 pt-4">
        <div className="max-w-4xl mx-auto px-4">
          <form ref={formRef} onSubmit={handleFormSubmit} className="relative max-w-3xl mx-auto">
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl shadow-orange-500/10 focus-within:border-orange-400 dark:focus-within:border-orange-600 focus-within:shadow-orange-500/20 transition-all duration-300 overflow-hidden group">
              <div className="overflow-y-auto max-h-[200px]">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    handleInputChange(e);
                    adjustHeight();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className={cn(
                    "w-full px-4 py-3",
                    "resize-none",
                    "bg-transparent",
                    "border-none",
                    "text-gray-900 dark:text-white text-base md:text-sm",
                    "focus:outline-none focus:ring-0",
                    "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                    "min-h-[60px]"
                  )}
                  style={{ overflow: 'hidden' }}
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="group/btn p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-gray-500 dark:text-gray-400"
                  >
                    <Paperclip className="w-4 h-4 group-hover/btn:text-orange-500 transition-colors" />
                    <span className="text-xs hidden sm:inline font-medium group-hover/btn:text-gray-700 dark:group-hover/btn:text-gray-300 transition-colors">
                      Attach
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 transition-colors border border-dashed border-gray-300 dark:border-gray-600 hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Project
                  </button>
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
                      input.trim() && !isLoading
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowUp className="w-3.5 h-3.5" />
                    )}
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center font-medium tracking-wide uppercase opacity-70">
              VerifyAI can make mistakes. Check important info.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}