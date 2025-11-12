import { SearchResult, NewsResult, SourceType } from '@/app/types'

// Academic domains and patterns
const ACADEMIC_DOMAINS = [
  'edu',
  'ac.uk',
  'edu.au',
  'edu.cn',
  'scholar.google.com',
  'arxiv.org',
  'ieee.org',
  'acm.org',
  'springer.com',
  'sciencedirect.com',
  'jstor.org',
  'researchgate.net',
  'academia.edu',
  'pubmed.ncbi.nlm.nih.gov',
  'nih.gov',
  'nature.com',
  'science.org',
  'wiley.com',
  'tandfonline.com',
  'sagepub.com',
  'elsevier.com'
]

// News domains
const NEWS_DOMAINS = [
  'news',
  'cnn.com',
  'bbc.com',
  'reuters.com',
  'apnews.com',
  'nytimes.com',
  'washingtonpost.com',
  'theguardian.com',
  'wsj.com',
  'bloomberg.com',
  'forbes.com',
  'time.com',
  'newsweek.com',
  'usatoday.com',
  'abcnews.go.com',
  'cbsnews.com',
  'nbcnews.com',
  'foxnews.com',
  'aljazeera.com',
  'bbc.co.uk',
  'economist.com',
  'ft.com',
  'theverge.com',
  'techcrunch.com',
  'wired.com',
  'arstechnica.com'
]

// Blog platforms and patterns
const BLOG_DOMAINS = [
  'medium.com',
  'substack.com',
  'wordpress.com',
  'blogspot.com',
  'tumblr.com',
  'ghost.io',
  'hashnode.dev',
  'dev.to',
  'notion.site',
  'webflow.io',
  '/blog',
  '/blog/',
  '-blog.',
  'blog.'
]

// Forum domains
const FORUM_DOMAINS = [
  'reddit.com',
  'stackoverflow.com',
  'stackexchange.com',
  'quora.com',
  'hackernews.ycombinator.com',
  'forum',
  'discuss',
  'community',
  'discourse',
  'disqus.com',
  'github.com/discussions',
  'github.com/issues'
]

/**
 * Detect the type of a source based on its URL
 */
export function detectSourceType(url: string): SourceType {
  const lowerUrl = url.toLowerCase()

  // Check for academic sources
  if (ACADEMIC_DOMAINS.some(domain => lowerUrl.includes(domain))) {
    return 'academic'
  }

  // Check for news sources
  if (NEWS_DOMAINS.some(domain => lowerUrl.includes(domain))) {
    return 'news'
  }

  // Check for forums
  if (FORUM_DOMAINS.some(domain => lowerUrl.includes(domain))) {
    return 'forums'
  }

  // Check for blogs
  if (BLOG_DOMAINS.some(pattern => lowerUrl.includes(pattern))) {
    return 'blogs'
  }

  // Default to 'all' if no specific type detected
  return 'all'
}

/**
 * Filter sources by type
 */
export function filterSourcesByType(
  sources: SearchResult[],
  sourceType: SourceType
): SearchResult[] {
  if (sourceType === 'all') {
    return sources
  }

  return sources.filter(source => {
    const detectedType = detectSourceType(source.url)
    return detectedType === sourceType
  })
}

/**
 * Filter news results by type
 */
export function filterNewsByType(
  news: NewsResult[],
  sourceType: SourceType
): NewsResult[] {
  if (sourceType === 'all' || sourceType === 'news') {
    return news
  }

  // News results are typically always "news" type
  return []
}

/**
 * Get source type counts
 */
export function getSourceTypeCounts(sources: SearchResult[]): Record<SourceType, number> {
  const counts: Record<SourceType, number> = {
    all: sources.length,
    academic: 0,
    news: 0,
    blogs: 0,
    forums: 0
  }

  sources.forEach(source => {
    const type = detectSourceType(source.url)
    if (type !== 'all') {
      counts[type]++
    }
  })

  return counts
}

/**
 * Get filter label with count
 */
export function getFilterLabel(type: SourceType, count: number): string {
  const labels: Record<SourceType, string> = {
    all: 'All Sources',
    academic: 'Academic',
    news: 'News',
    blogs: 'Blogs',
    forums: 'Forums'
  }

  return `${labels[type]} (${count})`
}

/**
 * Sort sources by type priority
 */
export function sortSourcesByType(sources: SearchResult[]): SearchResult[] {
  const typePriority: Record<string, number> = {
    academic: 1,
    news: 2,
    blogs: 3,
    forums: 4,
    all: 5
  }

  return [...sources].sort((a, b) => {
    const typeA = detectSourceType(a.url)
    const typeB = detectSourceType(b.url)

    const priorityA = typePriority[typeA] || 5
    const priorityB = typePriority[typeB] || 5

    return priorityA - priorityB
  })
}

/**
 * Check if a source is likely to be credible
 */
export function isCredibleSource(source: SearchResult): boolean {
  const type = detectSourceType(source.url)

  // Academic and major news sources are generally credible
  if (type === 'academic' || type === 'news') {
    return true
  }

  // Check for HTTPS
  if (!source.url.startsWith('https://')) {
    return false
  }

  // Check for author attribution
  if (source.author) {
    return true
  }

  // Check for published date
  if (source.publishedDate) {
    return true
  }

  return false
}

/**
 * Get credibility score (0-100)
 */
export function getCredibilityScore(source: SearchResult): number {
  let score = 50 // Base score

  const type = detectSourceType(source.url)

  // Type-based scoring
  if (type === 'academic') score += 30
  else if (type === 'news') score += 20
  else if (type === 'blogs') score += 5
  else if (type === 'forums') score -= 10

  // HTTPS
  if (source.url.startsWith('https://')) score += 10

  // Author attribution
  if (source.author) score += 10

  // Published date
  if (source.publishedDate) score += 10

  // Description
  if (source.description) score += 5

  // Cap at 100
  return Math.min(100, Math.max(0, score))
}
