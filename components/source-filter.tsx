'use client'

import { motion } from 'framer-motion'
import { GraduationCap, Newspaper, BookOpen, MessageSquare, Check } from 'lucide-react'
import { SourceType } from '@/app/types'
import { getSourceTypeCounts } from '@/lib/source-filters'
import { SearchResult } from '@/app/types'

interface SourceFilterProps {
  sources: SearchResult[]
  selectedType: SourceType
  onSelectType: (type: SourceType) => void
}

const FILTER_OPTIONS: Array<{
  type: SourceType
  label: string
  icon: any
  color: string
}> = [
  { type: 'all', label: 'All', icon: Check, color: 'text-gray-600 dark:text-gray-400' },
  { type: 'academic', label: 'Academic', icon: GraduationCap, color: 'text-blue-600 dark:text-blue-400' },
  { type: 'news', label: 'News', icon: Newspaper, color: 'text-red-600 dark:text-red-400' },
  { type: 'blogs', label: 'Blogs', icon: BookOpen, color: 'text-green-600 dark:text-green-400' },
  { type: 'forums', label: 'Forums', icon: MessageSquare, color: 'text-purple-600 dark:text-purple-400' }
]

export function SourceFilter({ sources, selectedType, onSelectType }: SourceFilterProps) {
  const counts = getSourceTypeCounts(sources)

  if (sources.length === 0) return null

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
        Filter:
      </span>
      <div className="flex gap-2">
        {FILTER_OPTIONS.map(({ type, label, icon: Icon, color }) => {
          const count = counts[type]
          const isSelected = selectedType === type
          const isDisabled = count === 0 && type !== 'all'

          return (
            <motion.button
              key={type}
              onClick={() => !isDisabled && onSelectType(type)}
              disabled={isDisabled}
              className={`
                relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 flex-shrink-0
                ${isSelected
                  ? 'bg-orange-500 text-white shadow-md'
                  : isDisabled
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
              whileHover={!isDisabled ? { scale: 1.05 } : {}}
              whileTap={!isDisabled ? { scale: 0.95 } : {}}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : color}`} />
              <span>{label}</span>
              <span className={`
                ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold
                ${isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                }
              `}>
                {count}
              </span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
