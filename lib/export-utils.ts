import { SearchResult, NewsResult, ImageResult } from '@/app/types'
import { formatCitations } from './citation-formatters'

interface ExportData {
  query: string
  timestamp: number
  messages: any[]
  sources: SearchResult[]
  newsResults: NewsResult[]
  imageResults: ImageResult[]
}

/**
 * Extract text content from UIMessage
 */
function getMessageText(message: any): string {
  if (!message.parts) return ''
  return message.parts
    .filter((part: any) => part.type === 'text')
    .map((part: any) => part.text)
    .join('')
}

/**
 * Export conversation as Markdown
 */
export function exportAsMarkdown(data: ExportData): string {
  const date = new Date(data.timestamp).toLocaleString()

  let markdown = `# VerifyAI Search Results\n\n`
  markdown += `**Date:** ${date}\n\n`
  markdown += `---\n\n`

  // Add conversation
  markdown += `## Conversation\n\n`

  data.messages.forEach((message, index) => {
    const role = message.role === 'user' ? '### User' : '### AI Assistant'
    const content = getMessageText(message)

    markdown += `${role}\n\n`
    markdown += `${content}\n\n`
  })

  // Add sources
  if (data.sources.length > 0) {
    markdown += `---\n\n`
    markdown += `## Sources\n\n`

    data.sources.forEach((source, index) => {
      markdown += `### [${index + 1}] ${source.title}\n\n`
      markdown += `**URL:** ${source.url}\n\n`

      if (source.description) {
        markdown += `**Description:** ${source.description}\n\n`
      }

      if (source.publishedDate) {
        markdown += `**Published:** ${source.publishedDate}\n\n`
      }

      if (source.author) {
        markdown += `**Author:** ${source.author}\n\n`
      }

      markdown += `---\n\n`
    })
  }

  // Add news results
  if (data.newsResults.length > 0) {
    markdown += `## News Articles\n\n`

    data.newsResults.forEach((news, index) => {
      markdown += `### ${news.title}\n\n`
      markdown += `**URL:** ${news.url}\n\n`

      if (news.description) {
        markdown += `${news.description}\n\n`
      }

      if (news.publishedDate || news.date) {
        markdown += `**Published:** ${news.publishedDate || news.date}\n\n`
      }

      if (news.source) {
        markdown += `**Source:** ${news.source}\n\n`
      }

      markdown += `---\n\n`
    })
  }

  // Add image results
  if (data.imageResults.length > 0) {
    markdown += `## Images\n\n`

    data.imageResults.forEach((image, index) => {
      markdown += `### ${image.title || `Image ${index + 1}`}\n\n`
      markdown += `![${image.title}](${image.thumbnail || image.url})\n\n`
      markdown += `**Source:** ${image.url}\n\n`
      markdown += `---\n\n`
    })
  }

  // Add citations
  markdown += `## Citations\n\n`
  markdown += `### APA Format\n\n`
  markdown += `\`\`\`\n`
  markdown += formatCitations(data.sources, 'apa')
  markdown += `\n\`\`\`\n\n`

  return markdown
}

/**
 * Download Markdown file
 */
export function downloadMarkdown(data: ExportData, filename?: string): void {
  const markdown = exportAsMarkdown(data)
  const defaultFilename = `verifyai-search-${Date.now()}.md`

  const blob = new Blob([markdown], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || defaultFilename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Export conversation as PDF using jsPDF
 * Note: This is a simplified version. For better PDF quality,
 * consider using a dedicated PDF library or server-side rendering
 */
export async function exportAsPDF(data: ExportData): Promise<void> {
  try {
    // Dynamic import to avoid SSR issues
    const { jsPDF } = await import('jspdf')

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const maxWidth = pageWidth - 2 * margin
    let yPos = margin

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize: number = 10, isBold: boolean = false) => {
      doc.setFontSize(fontSize)
      if (isBold) {
        doc.setFont('helvetica', 'bold')
      } else {
        doc.setFont('helvetica', 'normal')
      }

      const lines = doc.splitTextToSize(text, maxWidth)
      lines.forEach((line: string) => {
        if (yPos + 10 > pageHeight - margin) {
          doc.addPage()
          yPos = margin
        }
        doc.text(line, margin, yPos)
        yPos += fontSize * 0.5
      })
      yPos += 3 // Extra spacing
    }

    // Title
    addText('VerifyAI Search Results', 18, true)
    yPos += 5

    // Date
    const date = new Date(data.timestamp).toLocaleString()
    addText(`Date: ${date}`, 10, false)
    yPos += 10

    // Conversation
    addText('Conversation', 14, true)
    yPos += 5

    data.messages.forEach((message) => {
      const role = message.role === 'user' ? 'User:' : 'AI Assistant:'
      const content = getMessageText(message)

      addText(role, 11, true)
      addText(content, 10, false)
      yPos += 5
    })

    // Sources
    if (data.sources.length > 0) {
      yPos += 10
      addText('Sources', 14, true)
      yPos += 5

      data.sources.forEach((source, index) => {
        addText(`[${index + 1}] ${source.title}`, 11, true)
        addText(`URL: ${source.url}`, 9, false)

        if (source.description) {
          addText(source.description, 9, false)
        }

        yPos += 3
      })
    }

    // Save PDF
    doc.save(`verifyai-search-${Date.now()}.pdf`)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF. Please try Markdown export instead.')
  }
}

/**
 * Copy conversation to clipboard
 */
export async function copyToClipboard(data: ExportData): Promise<boolean> {
  try {
    const markdown = exportAsMarkdown(data)
    await navigator.clipboard.writeText(markdown)
    return true
  } catch (error) {
    console.error('Error copying to clipboard:', error)
    return false
  }
}

/**
 * Generate a shareable summary
 */
export function generateSummary(data: ExportData): string {
  const firstUserMessage = data.messages.find(m => m.role === 'user')
  const query = firstUserMessage ? getMessageText(firstUserMessage) : 'Untitled'

  const firstAssistantMessage = data.messages.find(m => m.role === 'assistant')
  const response = firstAssistantMessage ? getMessageText(firstAssistantMessage) : ''

  const summary = response.length > 200 ? response.substring(0, 200) + '...' : response

  return `VerifyAI Search: ${query}\n\n${summary}\n\nSources: ${data.sources.length} | News: ${data.newsResults.length} | Images: ${data.imageResults.length}`
}
