'use client'

import { motion } from 'framer-motion'
import { Microscope, Check, Loader2, Search, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResearchProgressIndicatorProps {
    readonly progress: {
        step: 'expanding' | 'searching' | 'synthesizing' | 'complete'
        current?: number
        total?: number
        currentQuery?: string
        percentage: number
    }
}

const steps = [
    { id: 'expanding', label: 'Expanding queries', icon: Search },
    { id: 'searching', label: 'Searching sources', icon: Microscope },
    { id: 'synthesizing', label: 'Synthesizing report', icon: FileText },
]

export function ResearchProgressIndicator({ progress }: ResearchProgressIndicatorProps) {
    const currentStepIndex = steps.findIndex(s => s.id === progress.step)

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
                <Microscope className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    Deep Research in Progress
                </span>
                <span className="ml-auto text-xs font-medium text-purple-600 dark:text-purple-400">
                    {progress.percentage}%
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-purple-100 dark:bg-purple-800/30 rounded-full overflow-hidden mb-4">
                <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />
            </div>

            {/* Step Indicators */}
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isComplete = index < currentStepIndex || progress.step === 'complete'
                    const isCurrent = step.id === progress.step && progress.step !== 'complete'
                    const StepIcon = step.icon

                    return (
                        <div
                            key={step.id}
                            className={cn(
                                "flex items-center gap-2 text-xs",
                                isComplete && "text-green-600 dark:text-green-400",
                                isCurrent && "text-purple-600 dark:text-purple-400",
                                !isComplete && !isCurrent && "text-gray-400 dark:text-gray-500"
                            )}
                        >
                            <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center",
                                isComplete && "bg-green-100 dark:bg-green-900/30",
                                isCurrent && "bg-purple-100 dark:bg-purple-900/30",
                                !isComplete && !isCurrent && "bg-gray-100 dark:bg-gray-800"
                            )}>
                                {isComplete ? (
                                    <Check className="w-3 h-3" />
                                ) : isCurrent ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <StepIcon className="w-3 h-3" />
                                )}
                            </div>
                            <span className="hidden sm:inline font-medium">{step.label}</span>
                        </div>
                    )
                })}
            </div>

            {/* Current Query Display */}
            {progress.step === 'searching' && progress.currentQuery && progress.current && progress.total && (
                <div className="mt-3 p-2 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                            Query {progress.current}/{progress.total}:
                        </span>{' '}
                        <span className="text-gray-700 dark:text-gray-300">
                            &ldquo;{progress.currentQuery.length > 60 ? progress.currentQuery.substring(0, 60) + '...' : progress.currentQuery}&rdquo;
                        </span>
                    </div>
                </div>
            )}
        </motion.div>
    )
}
