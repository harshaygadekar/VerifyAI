'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, FileText, File, Share2, Link2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchResult, NewsResult, ImageResult } from '@/app/types'
import { downloadMarkdown, exportAsPDF } from '@/lib/export-utils'
import { copyShareableLink, ShareableData } from '@/lib/shareable-links'
import { toast } from 'sonner'

interface ExportMenuProps {
  messages: any[]
  sources: SearchResult[]
  newsResults: NewsResult[]
  imageResults: ImageResult[]
  query: string
  ticker?: string
}

export function ExportMenu({
  messages,
  sources,
  newsResults,
  imageResults,
  query,
  ticker
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const exportData = {
    query,
    timestamp: Date.now(),
    messages,
    sources,
    newsResults,
    imageResults,
    ticker
  }

  const handleExportMarkdown = () => {
    try {
      downloadMarkdown(exportData)
      toast.success('Markdown file downloaded')
      setIsOpen(false)
    } catch (error) {
      toast.error('Failed to export Markdown')
      console.error(error)
    }
  }

  const handleExportPDF = async () => {
    setIsExporting(true)
    try {
      await exportAsPDF(exportData)
      toast.success('PDF file downloaded')
      setIsOpen(false)
    } catch (error) {
      toast.error('Failed to export PDF. Try Markdown instead.')
      console.error(error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleShareLink = async () => {
    try {
      const shareData: ShareableData = {
        query,
        timestamp: Date.now(),
        messages,
        sources,
        newsResults,
        imageResults,
        ticker
      }

      const url = await copyShareableLink(shareData)
      toast.success('Link copied to clipboard!')
      setIsOpen(false)
    } catch (error) {
      toast.error('Failed to generate shareable link')
      console.error(error)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
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
              className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-40"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="py-2">
                {/* Export as Markdown */}
                <button
                  onClick={handleExportMarkdown}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Export as Markdown
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      .md file with full content
                    </p>
                  </div>
                </button>

                {/* Export as PDF */}
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                  ) : (
                    <File className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Export as PDF
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isExporting ? 'Generating...' : 'Formatted document'}
                    </p>
                  </div>
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

                {/* Share Link */}
                <button
                  onClick={handleShareLink}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <Link2 className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Copy Shareable Link
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Share this conversation
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
