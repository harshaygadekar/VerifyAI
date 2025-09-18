'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ChatPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to main page since chat is integrated there
    router.push('/')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Redirecting to Chat...
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Taking you to the main search interface.
        </p>
      </div>
    </div>
  )
}