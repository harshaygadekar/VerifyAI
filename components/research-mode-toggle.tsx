'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Microscope, Zap, ChevronDown, RefreshCw, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResearchModeToggleProps {
    isResearchMode: boolean
    onToggle: (enabled: boolean) => void
    queryCount: number
    onQueryCountChange: (count: number) => void
    includeSubpages: boolean
    onIncludeSubpagesChange: (enabled: boolean) => void
    forceLiveCrawl: boolean
    onForceLiveCrawlChange: (enabled: boolean) => void
    disabled?: boolean
}

export function ResearchModeToggle({
    isResearchMode,
    onToggle,
    queryCount,
    onQueryCountChange,
    includeSubpages,
    onIncludeSubpagesChange,
    forceLiveCrawl,
    onForceLiveCrawlChange,
    disabled = false
}: ResearchModeToggleProps) {
    const [showOptions, setShowOptions] = useState(false)

    return (
        <div className="relative">
            {/* Main Toggle Button */}
            <div className="flex items-center">
                <button
                    type="button"
                    onClick={() => {
                        if (!disabled) {
                            onToggle(!isResearchMode)
                        }
                    }}
                    disabled={disabled}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-l-lg text-xs font-medium transition-all border-r-0",
                        isResearchMode
                            ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {isResearchMode ? (
                        <Microscope className="w-3.5 h-3.5" />
                    ) : (
                        <Zap className="w-3.5 h-3.5" />
                    )}
                    <span>{isResearchMode ? 'Deep Research' : 'Quick Search'}</span>
                </button>

                {/* Dropdown arrow for options */}
                {isResearchMode && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowOptions(!showOptions)
                        }}
                        className={cn(
                            "p-1.5 rounded-r-lg border border-l-0 transition-all",
                            isResearchMode
                                ? "bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800"
                                : "bg-gray-100 dark:bg-gray-800 border-transparent"
                        )}
                    >
                        <ChevronDown className={cn(
                            "w-3.5 h-3.5 transition-transform text-purple-600 dark:text-purple-400",
                            showOptions && "rotate-180"
                        )} />
                    </button>
                )}
            </div>

            {/* Options Dropdown */}
            {isResearchMode && showOptions && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute bottom-full left-0 mb-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[220px]"
                >
                    {/* Query Count */}
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Expanded Queries
                    </div>
                    <div className="flex gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => onQueryCountChange(num)}
                                className={cn(
                                    "w-8 h-8 rounded-md text-xs font-medium transition-all",
                                    queryCount === num
                                        ? "bg-purple-600 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                )}
                            >
                                {num}
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

                    {/* Advanced Options */}
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Advanced Options
                    </div>

                    {/* Include Subpages */}
                    <label className="flex items-center gap-2 py-1.5 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={includeSubpages}
                            onChange={(e) => onIncludeSubpagesChange(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                        />
                        <Layers className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200">
                            Include subpages
                        </span>
                    </label>

                    {/* Force Live Crawl */}
                    <label className="flex items-center gap-2 py-1.5 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={forceLiveCrawl}
                            onChange={(e) => onForceLiveCrawlChange(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500"
                        />
                        <RefreshCw className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        <span className="text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200">
                            Force fresh results
                        </span>
                    </label>

                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
                        More queries = deeper research
                    </p>
                </motion.div>
            )}

            {/* Mode explanation tooltip */}
            {isResearchMode && (
                <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden lg:block"
                >
                    <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-[10px] px-2 py-1 rounded border border-purple-200 dark:border-purple-800 whitespace-nowrap">
                        +{queryCount} expanded queries
                    </div>
                </motion.div>
            )}
        </div>
    )
}
