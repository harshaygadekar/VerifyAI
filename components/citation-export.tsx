'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Quote, Copy, Download, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchResult, NewsResult, CitationFormat } from '@/app/types'
import {
  downloadCitations,
  copyCitationsToClipboard,
  formatCitations
} from '@/lib/citation-formatters'
import { toast } from 'sonner'

interface CitationExportProps {
  sources: SearchResult[]
  newsResults?: NewsResult[]
}

export function CitationExport({ sources, newsResults = [] }: CitationExportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<CitationFormat>('apa')
  const [copied, setCopied] = useState(false)

  const allSources = [...sources, ...newsResults]

  if (allSources.length === 0) return null

  const handleCopy = async () => {
    const success = await copyCitationsToClipboard(allSources, selectedFormat)
    if (success) {
      setCopied(true)
      toast.success('Citations copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast.error('Failed to copy citations')
    }
  }

  const handleDownload = () => {
    try {
      downloadCitations(allSources, selectedFormat)
      toast.success('Citations downloaded')
    } catch (error) {
      toast.error('Failed to download citations')
    }
  }

  const preview = formatCitations(allSources.slice(0, 2), selectedFormat)

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <Quote className="w-4 h-4 mr-2" />
        Citations
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-30"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-40"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Export Citations ({allSources.length})
                </h3>

                {/* Format Selection */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setSelectedFormat('apa')}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      selectedFormat === 'apa'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    APA
                  </button>
                  <button
                    onClick={() => setSelectedFormat('mla')}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      selectedFormat === 'mla'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    MLA
                  </button>
                  <button
                    onClick={() => setSelectedFormat('bibtex')}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                      selectedFormat === 'bibtex'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    BibTeX
                  </button>
                </div>

                {/* Preview */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Preview (first 2 sources):
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                      {preview}
                    </pre>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCopy}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    size="sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy All
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                {/* Info */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                  All {allSources.length} citations will be included
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
