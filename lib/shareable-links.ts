import { SearchResult, NewsResult, ImageResult } from '@/app/types'
import pako from 'pako'

export interface ShareableData {
  query: string
  timestamp: number
  messages: any[]
  sources: SearchResult[]
  newsResults: NewsResult[]
  imageResults: ImageResult[]
  ticker?: string
}

/**
 * Encode chat data to base64 string with compression
 */
export function encodeShareableLink(data: ShareableData): string {
  try {
    // Convert to JSON string
    const jsonString = JSON.stringify(data)

    // Compress using pako (gzip)
    const compressed = pako.deflate(jsonString, { level: 9 })

    // Convert to base64
    const base64 = btoa(String.fromCharCode(...compressed))

    // URL-safe base64
    const urlSafe = base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    return urlSafe
  } catch (error) {
    console.error('Error encoding shareable link:', error)
    throw new Error('Failed to generate shareable link')
  }
}

/**
 * Decode chat data from base64 string
 */
export function decodeShareableLink(encoded: string): ShareableData | null {
  try {
    // Restore standard base64
    let base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    // Add padding if needed
    while (base64.length % 4) {
      base64 += '='
    }

    // Decode from base64
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Decompress
    const decompressed = pako.inflate(bytes, { to: 'string' })

    // Parse JSON
    const data = JSON.parse(decompressed) as ShareableData

    return data
  } catch (error) {
    console.error('Error decoding shareable link:', error)
    return null
  }
}

/**
 * Generate a shareable URL for the current chat
 */
export function generateShareableUrl(data: ShareableData): string {
  const encoded = encodeShareableLink(data)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return `${baseUrl}/share?data=${encoded}`
}

/**
 * Copy shareable link to clipboard
 */
export async function copyShareableLink(data: ShareableData): Promise<string> {
  try {
    const url = generateShareableUrl(data)
    await navigator.clipboard.writeText(url)
    return url
  } catch (error) {
    console.error('Error copying shareable link:', error)
    throw new Error('Failed to copy link to clipboard')
  }
}

/**
 * Alternative: Store in localStorage and generate short link
 * This is useful for very long chats that exceed URL length limits
 */
const SHARED_CHATS_KEY = 'verifyai-shared-chats'

export function generateShortLink(data: ShareableData): string {
  if (typeof window === 'undefined') return ''

  try {
    // Generate a unique short ID
    const shortId = Math.random().toString(36).substr(2, 8)

    // Get existing shared chats
    const stored = localStorage.getItem(SHARED_CHATS_KEY)
    const sharedChats = stored ? JSON.parse(stored) : {}

    // Store the data
    sharedChats[shortId] = {
      ...data,
      sharedAt: Date.now()
    }

    // Save back to localStorage
    localStorage.setItem(SHARED_CHATS_KEY, JSON.stringify(sharedChats))

    // Generate short URL
    const baseUrl = window.location.origin
    return `${baseUrl}/share/${shortId}`
  } catch (error) {
    console.error('Error generating short link:', error)
    throw new Error('Failed to generate short link')
  }
}

/**
 * Retrieve shared chat by short ID
 */
export function getSharedChat(shortId: string): ShareableData | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(SHARED_CHATS_KEY)
    if (!stored) return null

    const sharedChats = JSON.parse(stored)
    return sharedChats[shortId] || null
  } catch (error) {
    console.error('Error retrieving shared chat:', error)
    return null
  }
}

/**
 * Clean up old shared chats (older than 7 days)
 */
export function cleanupSharedChats(): void {
  if (typeof window === 'undefined') return

  try {
    const stored = localStorage.getItem(SHARED_CHATS_KEY)
    if (!stored) return

    const sharedChats = JSON.parse(stored)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    // Filter out old chats
    const filtered: Record<string, any> = {}
    for (const [id, chat] of Object.entries(sharedChats)) {
      const chatData = chat as any
      if (chatData.sharedAt && chatData.sharedAt > sevenDaysAgo) {
        filtered[id] = chat
      }
    }

    localStorage.setItem(SHARED_CHATS_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error cleaning up shared chats:', error)
  }
}

/**
 * Validate shareable data
 */
export function validateShareableData(data: any): data is ShareableData {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.query === 'string' &&
    typeof data.timestamp === 'number' &&
    Array.isArray(data.messages) &&
    Array.isArray(data.sources) &&
    Array.isArray(data.newsResults) &&
    Array.isArray(data.imageResults)
  )
}
