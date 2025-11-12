import { ChatSession, SearchResult, NewsResult, ImageResult } from '@/app/types'

const STORAGE_KEY = 'verifyai-chat-history'
const MAX_HISTORY_ITEMS = 100

/**
 * Get all chat sessions from localStorage
 */
export function getChatHistory(): ChatSession[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const sessions = JSON.parse(stored) as ChatSession[]
    // Sort by timestamp descending (newest first)
    return sessions.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Error loading chat history:', error)
    return []
  }
}

/**
 * Save a chat session to history
 */
export function saveChatSession(
  messages: any[],
  sources: SearchResult[],
  newsResults: NewsResult[],
  imageResults: ImageResult[],
  followUpQuestions: string[],
  ticker?: string
): string {
  if (typeof window === 'undefined') return ''

  try {
    // Generate a unique ID
    const id = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Extract title from first user message
    const firstUserMessage = messages.find(m => m.role === 'user')
    const title = firstUserMessage?.parts?.[0]?.text?.substring(0, 60) || 'Untitled Chat'

    const session: ChatSession = {
      id,
      timestamp: Date.now(),
      title,
      messages,
      sources,
      newsResults,
      imageResults,
      followUpQuestions,
      ticker
    }

    // Get existing history
    const history = getChatHistory()

    // Add new session to beginning
    const updatedHistory = [session, ...history]

    // Trim to max items
    if (updatedHistory.length > MAX_HISTORY_ITEMS) {
      updatedHistory.length = MAX_HISTORY_ITEMS
    }

    // Save back to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory))

    return id
  } catch (error) {
    console.error('Error saving chat session:', error)
    return ''
  }
}

/**
 * Get a specific chat session by ID
 */
export function getChatSession(id: string): ChatSession | null {
  if (typeof window === 'undefined') return null

  try {
    const history = getChatHistory()
    return history.find(session => session.id === id) || null
  } catch (error) {
    console.error('Error loading chat session:', error)
    return null
  }
}

/**
 * Delete a chat session by ID
 */
export function deleteChatSession(id: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const history = getChatHistory()
    const filtered = history.filter(session => session.id !== id)

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error deleting chat session:', error)
    return false
  }
}

/**
 * Clear all chat history
 */
export function clearChatHistory(): boolean {
  if (typeof window === 'undefined') return false

  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Error clearing chat history:', error)
    return false
  }
}

/**
 * Get recent search queries from history
 */
export function getRecentSearches(limit: number = 10): string[] {
  if (typeof window === 'undefined') return []

  try {
    const history = getChatHistory()
    const queries = history
      .map(session => session.title)
      .filter((title, index, self) => self.indexOf(title) === index) // Remove duplicates
      .slice(0, limit)

    return queries
  } catch (error) {
    console.error('Error loading recent searches:', error)
    return []
  }
}

/**
 * Update an existing chat session
 */
export function updateChatSession(
  id: string,
  updates: Partial<ChatSession>
): boolean {
  if (typeof window === 'undefined') return false

  try {
    const history = getChatHistory()
    const index = history.findIndex(session => session.id === id)

    if (index === -1) return false

    history[index] = {
      ...history[index],
      ...updates,
      timestamp: history[index].timestamp // Preserve original timestamp
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    return true
  } catch (error) {
    console.error('Error updating chat session:', error)
    return false
  }
}
