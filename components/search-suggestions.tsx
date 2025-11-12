'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Clock, TrendingUp } from 'lucide-react'
import { getSearchSuggestions } from '@/lib/search-suggestions'

interface SearchSuggestionsProps {
  input: string
  onSelectSuggestion: (suggestion: string) => void
  isVisible: boolean
}

export function SearchSuggestions({
  input,
  onSelectSuggestion,
  isVisible
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)

  // Update suggestions when input changes
  useEffect(() => {
    if (isVisible) {
      const results = getSearchSuggestions(input, 8)
      setSuggestions(results)
      setSelectedIndex(-1)
    } else {
      setSuggestions([])
    }
  }, [input, isVisible])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible || suggestions.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault()
        onSelectSuggestion(suggestions[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, suggestions, selectedIndex, onSelectSuggestion])

  if (!isVisible || suggestions.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="py-2">
          {suggestions.map((suggestion, index) => {
            const isRecent = input.trim().length === 0
            const Icon = isRecent ? Clock : TrendingUp

            return (
              <motion.button
                key={index}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${
                  selectedIndex === index
                    ? 'bg-gray-50 dark:bg-gray-700'
                    : ''
                }`}
                onClick={() => onSelectSuggestion(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                  {suggestion}
                </span>
                <Search className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
              </motion.button>
            )
          })}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Use ↑↓ to navigate • Enter to select
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
