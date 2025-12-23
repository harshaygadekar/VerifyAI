'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, Sparkles, Zap, Globe, Image as ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { InlineLoading } from '@/components/loading-animation'

interface SearchComponentProps {
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void
  isLoading: boolean
}

const suggestedQueries = [
  "What's the latest news about AI?",
  "How does climate change affect ocean levels?",
  "Best programming languages to learn in 2024",
  "Latest developments in quantum computing",
  "How to start a sustainable business?",
  "What are the benefits of meditation?"
]

const features = [
  { icon: Globe, text: "Web Search", color: "text-blue-500" },
  { icon: ImageIcon, text: "Image Results", color: "text-green-500" },
  { icon: Sparkles, text: "AI Analysis", color: "text-purple-500" },
  { icon: Zap, text: "Real-time Data", color: "text-orange-500" }
]

export function SearchComponent({ handleSubmit, input, handleInputChange, isLoading }: SearchComponentProps) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSuggestionClick = (query: string) => {
    handleInputChange({ target: { value: query } } as React.ChangeEvent<HTMLInputElement>)
    inputRef.current?.focus()
  }

  return (
    <div className="max-w-4xl mx-auto pt-12 space-y-8">
      {/* Main Search Form */}
      <motion.form
        onSubmit={handleSubmit}
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className={`relative flex items-center transition-all duration-300 ${isFocused ? 'transform scale-105' : ''
          }`}>
          <div className="absolute left-4 z-10">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask anything... I'll search the web and give you comprehensive answers"
            className="pl-12 pr-24 h-16 text-lg rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all duration-300 focus:border-orange-400 dark:focus:border-orange-500 focus:shadow-xl focus:shadow-orange-100 dark:focus:shadow-orange-900/20"
            disabled={isLoading}
          />
          <motion.button
            type="submit"
            disabled={isLoading || !input || input.trim() === ''}
            className="absolute right-3 p-0 flex items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-[50px] h-[40px] flex items-center justify-center">
              {isLoading ? (
                <div className="text-white">
                  <InlineLoading size="sm" />
                </div>
              ) : (
                <svg
                  fill="none"
                  height="20"
                  viewBox="0 0 20 20"
                  width="20"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M11.6667 4.79163L16.875 9.99994M16.875 9.99994L11.6667 15.2083M16.875 9.99994H3.125"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                  />
                </svg>
              )}
            </div>
          </motion.button>
        </div>
      </motion.form>

      {/* Features */}
      <motion.div
        className="flex flex-wrap justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.text}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
          >
            <feature.icon className={`w-4 h-4 ${feature.color}`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {feature.text}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* Suggested Queries */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <h3 className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
          Try asking about:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestedQueries.map((query, index) => (
            <motion.button
              key={query}
              onClick={() => handleSuggestionClick(query)}
              className="text-left p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-md transition-all duration-200 group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
            >
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0 group-hover:bg-orange-500 transition-colors" />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  {query}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-orange-50 dark:bg-orange-900/20 rounded-full">
            <InlineLoading size="sm" />
            <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
              Searching and analyzing...
            </span>
          </div>
        </motion.div>
      )}
    </div>
  )
}