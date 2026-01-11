'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ExternalLink, Microscope, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QueryGroup {
    query: string
    isOriginal: boolean
    sources: { url: string; title: string; favicon?: string }[]
    count: number
}

interface QueriesExploredSectionProps {
    readonly queriesExplored: QueryGroup[]
}

export function QueriesExploredSection({ queriesExplored }: QueriesExploredSectionProps) {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

    if (!queriesExplored || queriesExplored.length === 0) return null

    const totalSources = queriesExplored.reduce((sum, q) => sum + q.count, 0)

    return (
        <div className="w-full p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Microscope className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
                    Queries Explored
                </span>
                <span className="ml-auto text-xs text-indigo-600 dark:text-indigo-400">
                    {queriesExplored.length} queries • {totalSources} sources
                </span>
            </div>

            {/* Query List */}
            <div className="space-y-2">
                {queriesExplored.map((item, index) => (
                    <div
                        key={index}
                        className="bg-white/60 dark:bg-gray-900/40 rounded-lg overflow-hidden"
                    >
                        {/* Query Header */}
                        <button
                            type="button"
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                            className="w-full flex items-center gap-2 p-3 hover:bg-white/80 dark:hover:bg-gray-800/40 transition-colors text-left"
                        >
                            <Search className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                            <span className={cn(
                                "text-sm flex-1 truncate",
                                item.isOriginal
                                    ? "font-medium text-indigo-700 dark:text-indigo-300"
                                    : "text-gray-700 dark:text-gray-300"
                            )}>
                                {item.query}
                            </span>
                            {item.isOriginal && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full">
                                    Original
                                </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {item.count} sources
                            </span>
                            <ChevronDown className={cn(
                                "w-4 h-4 text-gray-400 transition-transform",
                                expandedIndex === index && "rotate-180"
                            )} />
                        </button>

                        {/* Expanded Sources */}
                        <AnimatePresence>
                            {expandedIndex === index && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-gray-100 dark:border-gray-800"
                                >
                                    <div className="p-2 space-y-1">
                                        {item.sources && item.sources.length > 0 ? (
                                            item.sources.map((source, sIdx) => (
                                                <a
                                                    key={`${source.url}-${sIdx}`}
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md group"
                                                >
                                                    {source.favicon ? (
                                                        <img src={source.favicon} alt="" className="w-4 h-4 rounded" />
                                                    ) : (
                                                        <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                                                    )}
                                                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate flex-1">
                                                        {source.title}
                                                    </span>
                                                    <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </a>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 p-2 italic">
                                                No source details available for this query
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    )
}
