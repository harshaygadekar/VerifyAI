'use client'

import { useChat } from '@ai-sdk/react'
import { useUser } from '@clerk/nextjs'
import { DefaultChatTransport } from 'ai'
import { motion } from 'framer-motion'
import { SearchComponent } from './search'
import { SearchResult, NewsResult, ImageResult } from './types'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Navigation } from '@/components/navigation'
import { ModernChatInterface } from '@/components/modern-chat-interface'
import { LandingPage } from '@/components/landing-page'

interface MessageData {
  sources: SearchResult[]
  newsResults?: NewsResult[]
  imageResults?: ImageResult[]
  followUpQuestions: string[]
  ticker?: string
  queryId?: string
}

export default function VerifyAIPage() {
  const [sources, setSources] = useState<SearchResult[]>([])
  const [newsResults, setNewsResults] = useState<NewsResult[]>([])
  const [imageResults, setImageResults] = useState<ImageResult[]>([])
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([])
  const [searchStatus, setSearchStatus] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const lastDataLength = useRef(0)
  const [messageData, setMessageData] = useState<Map<number, MessageData>>(new Map())
  const currentMessageIndex = useRef(0)
  const [currentTicker, setCurrentTicker] = useState<string | null>(null)
  const [firecrawlApiKey, setFirecrawlApiKey] = useState<string>('')
  const [hasApiKey, setHasApiKey] = useState<boolean>(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false)
  const [, setIsCheckingEnv] = useState<boolean>(true)
  const [pendingQuery, setPendingQuery] = useState<string>('')
  const [input, setInput] = useState<string>('')

  const [showLanding, setShowLanding] = useState<boolean>(true)
  const { isSignedIn } = useUser()

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/verifyai/search',
      body: firecrawlApiKey ? { firecrawlApiKey } : undefined
    })
  })

  // Single consolidated effect for handling streaming data
  useEffect(() => {
    // Handle response start
    if (status === 'streaming' && messages.length > 0) {
      const assistantMessages = messages.filter(m => m.role === 'assistant')
      const newIndex = assistantMessages.length

      // Only clear if we're starting a new message
      if (newIndex !== currentMessageIndex.current) {
        setSearchStatus('')
        setSources([])
        setNewsResults([])
        setImageResults([])
        setFollowUpQuestions([])
        setCurrentTicker(null)
        currentMessageIndex.current = newIndex
        lastDataLength.current = 0  // Reset data tracking for new message
      }
    }

    // Handle data parts from messages
    if (messages.length > 0) {
      const lastMessage = messages.at(-1)
      if (!lastMessage?.parts || lastMessage.parts.length === 0) return

      // Check if we've already processed this data
      const partsLength = lastMessage.parts.length
      if (partsLength === lastDataLength.current) return
      lastDataLength.current = partsLength

      // Process ALL parts to accumulate data
      let hasSourceData = false
      let latestSources: SearchResult[] = []
      let latestNewsResults: NewsResult[] = []
      let latestImageResults: ImageResult[] = []
      let latestTicker: string | null = null
      let latestFollowUpQuestions: string[] = []
      let latestStatus: string | null = null
      let latestQueryId: string | null = null

      for (const part of lastMessage.parts) {
        // Handle different data part types
        if (part.type === 'data-sources' && part.data) {
          const data = part.data as any
          hasSourceData = true
          // Use the latest data from this part
          if (data.sources) latestSources = data.sources
          if (data.newsResults) latestNewsResults = data.newsResults
          if (data.imageResults) latestImageResults = data.imageResults
        }

        if (part.type === 'data-ticker' && part.data) {
          const data = part.data as any
          latestTicker = data.symbol
        }

        if (part.type === 'data-followup' && part.data && (part.data as any).questions) {
          const data = part.data as any
          latestFollowUpQuestions = data.questions
        }

        if (part.type === 'data-status' && part.data) {
          const data = part.data as any
          latestStatus = data.message || ''
        }

        if (part.type === 'data-error' && part.data) {
          const data = part.data as any
          toast.error(data.error, {
            description: data.suggestion,
            duration: 5000,
          })
        }

        if (part.type === 'data-query-id' && part.data) {
          const data = part.data as any
          latestQueryId = data.queryId
        }
      }

      // Apply updates
      if (hasSourceData) {
        setSources(latestSources)
        setNewsResults(latestNewsResults)
        setImageResults(latestImageResults)
      }
      if (latestTicker !== null) setCurrentTicker(latestTicker)
      if (latestFollowUpQuestions.length > 0) setFollowUpQuestions(latestFollowUpQuestions)
      if (latestStatus !== null) setSearchStatus(latestStatus)

      // Update message data map
      if (hasSourceData || latestTicker !== null || latestFollowUpQuestions.length > 0 || latestQueryId !== null) {
        setMessageData(prevMap => {
          const newMap = new Map(prevMap)
          const existingData = newMap.get(currentMessageIndex.current) || { sources: [], followUpQuestions: [] }
          newMap.set(currentMessageIndex.current, {
            ...existingData,
            ...(hasSourceData && {
              sources: latestSources,
              newsResults: latestNewsResults,
              imageResults: latestImageResults
            }),
            ...(latestTicker !== null && { ticker: latestTicker }),
            ...(latestFollowUpQuestions.length > 0 && { followUpQuestions: latestFollowUpQuestions }),
            ...(latestQueryId !== null && { queryId: latestQueryId })
          })
          return newMap
        })
      }
    }
  }, [status, messages.length, messages[messages.length - 1]?.parts?.length])

  // Check for environment variables on mount
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await fetch('/api/verifyai/check-env')
        const data = await response.json()

        if (data.hasFirecrawlKey) {
          setHasApiKey(true)
        } else {
          // Check localStorage for user's API key
          const storedKey = localStorage.getItem('firecrawl-api-key')
          if (storedKey) {
            setFirecrawlApiKey(storedKey)
            setHasApiKey(true)
          }
        }
      } catch (error) {
        // Error checking environment - silently fail
        console.error('Failed to check environment:', error)
      } finally {
        setIsCheckingEnv(false)
      }
    }

    checkApiKey()
  }, [])

  const handleApiKeySubmit = () => {
    if (firecrawlApiKey.trim()) {
      localStorage.setItem('firecrawl-api-key', firecrawlApiKey)
      setHasApiKey(true)
      setShowApiKeyModal(false)
      toast.success('API key saved successfully!')

      // If there's a pending query, submit it
      if (pendingQuery) {
        sendMessage({ text: pendingQuery })
        setPendingQuery('')
      }
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return

    // Check if we have an API key
    if (!hasApiKey) {
      setPendingQuery(input)
      setShowApiKeyModal(true)
      return
    }

    setHasSearched(true)
    setShowLanding(false)
    // Don't clear data here - wait for new data to arrive
    // This prevents layout jump
    sendMessage({ text: input })
    setInput('')
  }

  // Wrapped submit handler for chat interface
  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return

    // Check if we have an API key
    if (!hasApiKey) {
      setPendingQuery(input)
      setShowApiKeyModal(true)
      return
    }

    // Store current data in messageData before new query
    if (messages.length > 0 && sources.length > 0) {
      const assistantMessages = messages.filter(m => m.role === 'assistant')
      const lastAssistantIndex = assistantMessages.length - 1
      if (lastAssistantIndex >= 0) {
        const newMap = new Map(messageData)
        newMap.set(lastAssistantIndex, {
          sources: sources,
          newsResults: newsResults,
          imageResults: imageResults,
          followUpQuestions: followUpQuestions,
          ticker: currentTicker || undefined
        })
        setMessageData(newMap)
      }
    }

    // Don't clear data here - wait for new data to arrive
    // The useEffect will clear when it detects a new assistant message starting
    sendMessage({ text: input })
    setInput('')
  }

  const isChatActive = hasSearched || messages.length > 0
  const showSearchInterface = !showLanding && !isChatActive

  const handleNewChat = () => {
    setHasSearched(false)
    setSources([])
    setNewsResults([])
    setImageResults([])
    setFollowUpQuestions([])
    setCurrentTicker(null)
    setInput('')
    setMessageData(new Map())
    setShowLanding(false)
    // Reset messages would need to be handled by the chat hook
  }

  const handleGetStarted = () => {
    setShowLanding(false)
  }

  // Show landing page if showLanding is true
  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} isSignedIn={!!isSignedIn} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors">
      {/* Navigation */}
      <Navigation
        currentPage={isChatActive ? 'chat' : 'home'}
        onNewChat={isChatActive ? handleNewChat : undefined}
        showNewChatButton={isChatActive}
      />

      {/* Hero section - matching other pages */}
      {showSearchInterface && (
        <div className="px-4 sm:px-6 lg:px-8 pt-24 pb-8 transition-all duration-500">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-[3rem] lg:text-[4rem] font-bold tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent block">
                  VerifyAI v2
                </span>
                <span className="text-[#262626] dark:text-white block text-[3rem] lg:text-[4rem] font-bold -mt-2 transition-colors">
                  Search & Scrape
                </span>
              </h1>
              <p className="mt-6 text-xl text-zinc-600 dark:text-zinc-400 transition-colors max-w-3xl mx-auto">
                Multi-source search with AI-powered insights, news, and images. Get comprehensive answers from across the web.
              </p>
            </motion.div>
          </div>
        </div>
      )}

      {/* Main content wrapper */}
      <div className={`flex-1 ${isChatActive ? 'pt-16' : ''}`}>
        <div className="h-full">
          {showSearchInterface ? (
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <SearchComponent
                  handleSubmit={handleSearch}
                  input={input}
                  handleInputChange={(e) => setInput(e.target.value)}
                  isLoading={status === 'streaming'}
                />
              </div>
            </div>
          ) : (
            <ModernChatInterface
              messages={messages}
              sources={sources}
              newsResults={newsResults}
              imageResults={imageResults}
              followUpQuestions={followUpQuestions}
              searchStatus={searchStatus}
              isLoading={status === 'streaming'}
              input={input}
              handleInputChange={(e) => setInput(e.target.value)}
              handleSubmit={handleChatSubmit}
              messageData={messageData}
              currentTicker={currentTicker}
            />
          )}
        </div>
      </div>


      {/* API Key Modal */}
      <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
        <DialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Firecrawl API Key Required</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              To use VerifyAI search, you need a Firecrawl API key. Get one for free at{' '}
              <a
                href="https://www.firecrawl.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline transition-colors"
              >
                firecrawl.dev
              </a>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Enter your Firecrawl API key"
              value={firecrawlApiKey}
              onChange={(e) => setFirecrawlApiKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleApiKeySubmit()
                }
              }}
              className="h-12 bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
            <Button onClick={handleApiKeySubmit} variant="orange" className="w-full">
              Save API Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}