import { SearchResult, NewsResult, CitationData, CitationFormat } from '@/app/types'

/**
 * Convert SearchResult or NewsResult to CitationData
 */
export function toCitationData(
  source: SearchResult | NewsResult
): CitationData {
  const accessedDate = new Date().toISOString().split('T')[0]

  return {
    title: source.title,
    url: source.url,
    author: 'author' in source ? source.author : undefined,
    publishedDate: source.publishedDate || ('date' in source ? source.date : undefined),
    siteName: 'siteName' in source ? source.siteName : ('source' in source ? source.source : undefined),
    accessedDate
  }
}

/**
 * Format citation in BibTeX format
 */
export function formatBibTeX(citation: CitationData, index: number): string {
  const hostname = new URL(citation.url).hostname.replace(/\./g, '')
  const year = citation.publishedDate ? new Date(citation.publishedDate).getFullYear() : new Date().getFullYear()
  const key = `${hostname}${year}_${index}`

  let bibtex = `@misc{${key},\n`
  bibtex += `  title = {${citation.title}},\n`

  if (citation.author) {
    bibtex += `  author = {${citation.author}},\n`
  }

  if (citation.publishedDate) {
    const date = new Date(citation.publishedDate)
    bibtex += `  year = {${date.getFullYear()}},\n`
    bibtex += `  month = {${date.toLocaleString('en', { month: 'short' })}},\n`
  }

  if (citation.siteName) {
    bibtex += `  howpublished = {${citation.siteName}},\n`
  }

  bibtex += `  url = {${citation.url}},\n`
  bibtex += `  note = {Accessed: ${citation.accessedDate}}\n`
  bibtex += `}`

  return bibtex
}

/**
 * Format citation in APA format (7th edition)
 */
export function formatAPA(citation: CitationData): string {
  let apa = ''

  // Author (if available, otherwise use site name)
  if (citation.author) {
    apa += `${citation.author}. `
  } else if (citation.siteName) {
    apa += `${citation.siteName}. `
  }

  // Date
  if (citation.publishedDate) {
    const date = new Date(citation.publishedDate)
    apa += `(${date.getFullYear()}, ${date.toLocaleString('en', { month: 'long' })} ${date.getDate()}). `
  } else {
    apa += `(n.d.). `
  }

  // Title (italicized in real APA, but we'll use plain text)
  apa += `${citation.title}. `

  // Site name if not already used
  if (!citation.author && citation.siteName) {
    // Already included as author
  } else if (citation.siteName) {
    apa += `${citation.siteName}. `
  }

  // URL
  apa += `Retrieved ${citation.accessedDate}, from ${citation.url}`

  return apa
}

/**
 * Format citation in MLA format (9th edition)
 */
export function formatMLA(citation: CitationData): string {
  let mla = ''

  // Author (if available)
  if (citation.author) {
    mla += `${citation.author}. `
  }

  // Title (in quotes)
  mla += `"${citation.title}." `

  // Container (site name)
  if (citation.siteName) {
    mla += `${citation.siteName}, `
  }

  // Date
  if (citation.publishedDate) {
    const date = new Date(citation.publishedDate)
    mla += `${date.getDate()} ${date.toLocaleString('en', { month: 'short' })}. ${date.getFullYear()}, `
  }

  // URL
  mla += `${citation.url}. `

  // Accessed date
  mla += `Accessed ${citation.accessedDate}.`

  return mla
}

/**
 * Format a single citation in the specified format
 */
export function formatCitation(
  source: SearchResult | NewsResult,
  format: CitationFormat,
  index: number = 1
): string {
  const citation = toCitationData(source)

  switch (format) {
    case 'bibtex':
      return formatBibTeX(citation, index)
    case 'apa':
      return formatAPA(citation)
    case 'mla':
      return formatMLA(citation)
    default:
      return formatAPA(citation)
  }
}

/**
 * Format multiple citations
 */
export function formatCitations(
  sources: (SearchResult | NewsResult)[],
  format: CitationFormat
): string {
  return sources
    .map((source, index) => formatCitation(source, format, index + 1))
    .join('\n\n')
}

/**
 * Export citations as downloadable text file
 */
export function downloadCitations(
  sources: (SearchResult | NewsResult)[],
  format: CitationFormat,
  filename?: string
): void {
  const content = formatCitations(sources, format)
  const extension = format === 'bibtex' ? 'bib' : 'txt'
  const defaultFilename = `citations-${Date.now()}.${extension}`

  const blob = new Blob([content], { type: 'text/plain' })
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
 * Copy citations to clipboard
 */
export async function copyCitationsToClipboard(
  sources: (SearchResult | NewsResult)[],
  format: CitationFormat
): Promise<boolean> {
  try {
    const content = formatCitations(sources, format)
    await navigator.clipboard.writeText(content)
    return true
  } catch (error) {
    console.error('Error copying citations:', error)
    return false
  }
}
