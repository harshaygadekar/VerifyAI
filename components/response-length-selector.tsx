'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, FileText, BookOpen, Check } from 'lucide-react'

export type ResponseLength = 'concise' | 'default' | 'detailed'

interface ResponseLengthSelectorProps {
  value: ResponseLength
  onChange: (length: ResponseLength) => void
  disabled?: boolean
}

const options = [
  {
    value: 'concise' as ResponseLength,
    label: 'Concise',
    description: 'Brief, to-the-point answers',
    icon: MessageSquare,
    color: 'text-blue-500'
  },
  {
    value: 'default' as ResponseLength,
    label: 'Default',
    description: 'Balanced detail and brevity',
    icon: FileText,
    color: 'text-orange-500'
  },
  {
    value: 'detailed' as ResponseLength,
    label: 'Detailed',
    description: 'Comprehensive, in-depth responses',
    icon: BookOpen,
    color: 'text-purple-500'
  }
]

export function ResponseLengthSelector({ value, onChange, disabled = false }: ResponseLengthSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = options.find(option => option.value === value) || options[1]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-orange-300 dark:hover:border-orange-600 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        <selectedOption.icon className={`w-4 h-4 ${selectedOption.color}`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedOption.label}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-1"
        >
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <motion.div
            className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    value === option.value ? 'bg-orange-50 dark:bg-orange-900/20' : ''
                  }`}
                >
                  <option.icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${option.color}`} />
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </span>
                      {value === option.value && (
                        <Check className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {option.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}