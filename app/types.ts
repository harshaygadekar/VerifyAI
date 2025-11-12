export interface SearchResult {
  url: string
  title: string
  description?: string
  content?: string
  publishedDate?: string
  author?: string
  markdown?: string
  image?: string
  favicon?: string
  siteName?: string
}

export interface NewsResult {
  url: string
  title: string
  description?: string
  publishedDate?: string
  date?: string  // Added for compatibility with the API schema
  source?: string
  image?: string
}

export interface ImageResult {
  url: string
  title: string
  thumbnail?: string
  source?: string
}

// Chat History Types
export interface ChatSession {
  id: string
  timestamp: number
  title: string
  messages: any[] // UIMessage type from ai package
  sources: SearchResult[]
  newsResults: NewsResult[]
  imageResults: ImageResult[]
  followUpQuestions: string[]
  ticker?: string
}

// Source Type for filtering
export type SourceType = 'all' | 'academic' | 'news' | 'blogs' | 'forums'

// Citation Format Types
export type CitationFormat = 'bibtex' | 'apa' | 'mla'

export interface CitationData {
  title: string
  url: string
  author?: string
  publishedDate?: string
  siteName?: string
  accessedDate: string
}