'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Key, Shield, Save, Check } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [firecrawlApiKey, setFirecrawlApiKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    const storedFirecrawlKey = localStorage.getItem('firecrawl-api-key')
    if (storedFirecrawlKey) setFirecrawlApiKey(storedFirecrawlKey)
  }, [])

  const handleSave = () => {
    // Save API key
    if (firecrawlApiKey) {
      localStorage.setItem('firecrawl-api-key', firecrawlApiKey)
      setSaved(true)
      toast.success('Firecrawl API key saved successfully!')
      setTimeout(() => setSaved(false), 2000)
    } else {
      toast.error('Please enter a valid API key')
    }
  }

  const handleClearData = () => {
    localStorage.removeItem('firecrawl-api-key')
    setFirecrawlApiKey('')
    toast.success('API key cleared!')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation currentPage="settings" />
      
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your API keys, preferences, and account settings.
              </p>
            </div>

            <div className="space-y-6">
              {/* API Keys Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-orange-500" />
                    API Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your Firecrawl API key for custom searches. Server keys are used by default.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="firecrawl-key">Firecrawl API Key (Optional)</Label>
                    <Input
                      id="firecrawl-key"
                      type="password"
                      value={firecrawlApiKey}
                      onChange={(e) => setFirecrawlApiKey(e.target.value)}
                      placeholder="fc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Use your own API key to bypass server limits. Get one from{' '}
                      <a
                        href="https://www.firecrawl.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 dark:text-orange-400 hover:underline"
                      >
                        firecrawl.dev
                      </a>
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleSave} className="flex items-center gap-2">
                      {saved ? (
                        <>
                          <Check className="w-4 h-4" />
                          Saved!
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Key
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleClearData}>
                      Clear Key
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Database Features Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-orange-500" />
                    Database Features
                  </CardTitle>
                  <CardDescription>
                    All search queries and results are automatically tracked and saved.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                        Query History
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        All your searches are saved with full metadata and analytics.
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                        API Usage Tracking
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Monitor Firecrawl and Groq API usage with detailed metrics.
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                        Search Results
                      </h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Web, news, and image results preserved with full content.
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                        Analytics Views
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Popular queries, user stats, and daily analytics available.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                    Data is stored securely in Supabase with Row Level Security enabled.
                  </p>
                </CardContent>
              </Card>

              {/* About Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-orange-500" />
                    About VerifyAI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>Version:</strong> 2.0.0</p>
                    <p><strong>Build:</strong> {new Date().toISOString().split('T')[0]}</p>
                    <p><strong>Status:</strong> <span className="text-green-500">Operational</span></p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      VerifyAI combines web search, news, and images with AI analysis 
                      to provide comprehensive answers to your questions.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}