import { getRecentSearches } from './chat-history'

// Popular/trending search suggestions
const POPULAR_SUGGESTIONS = [
  'Latest AI developments in 2025',
  'Climate change solutions',
  'Cryptocurrency market trends',
  'Space exploration updates',
  'Quantum computing breakthroughs',
  'Electric vehicle innovations',
  'Renewable energy advancements',
  'Medical research discoveries',
  'Machine learning applications',
  'Cybersecurity best practices',
  'Remote work productivity tips',
  'Sustainable living practices',
  'Global economy outlook',
  'Emerging technology trends',
  'Health and wellness tips'
]

/**
 * Get search suggestions based on input
 */
export function getSearchSuggestions(
  input: string,
  limit: number = 8
): string[] {
  if (!input || input.trim().length === 0) {
    // Return popular suggestions if no input
    return POPULAR_SUGGESTIONS.slice(0, limit)
  }

  const query = input.toLowerCase().trim()

  // Get recent searches
  const recentSearches = getRecentSearches(20)

  // Combine recent and popular suggestions
  const allSuggestions = [
    ...recentSearches,
    ...POPULAR_SUGGESTIONS
  ]

  // Filter suggestions that match the input
  const filtered = allSuggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(query)
  )

  // Remove duplicates
  const unique = Array.from(new Set(filtered))

  // Return limited results
  return unique.slice(0, limit)
}

/**
 * Get trending/popular suggestions
 */
export function getPopularSuggestions(limit: number = 10): string[] {
  return POPULAR_SUGGESTIONS.slice(0, limit)
}

/**
 * Get recent search suggestions
 */
export function getRecentSuggestions(limit: number = 10): string[] {
  return getRecentSearches(limit)
}

/**
 * Add a custom suggestion to localStorage (optional feature)
 */
const CUSTOM_SUGGESTIONS_KEY = 'verifyai-custom-suggestions'

export function addCustomSuggestion(suggestion: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const stored = localStorage.getItem(CUSTOM_SUGGESTIONS_KEY)
    const custom = stored ? JSON.parse(stored) : []

    // Add if not already present
    if (!custom.includes(suggestion)) {
      custom.unshift(suggestion)

      // Keep only last 50 custom suggestions
      if (custom.length > 50) {
        custom.length = 50
      }

      localStorage.setItem(CUSTOM_SUGGESTIONS_KEY, JSON.stringify(custom))
    }

    return true
  } catch (error) {
    console.error('Error adding custom suggestion:', error)
    return false
  }
}

export function getCustomSuggestions(): string[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(CUSTOM_SUGGESTIONS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading custom suggestions:', error)
    return []
  }
}
