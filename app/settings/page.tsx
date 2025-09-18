'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Key, Palette, Bell, Shield, Save, Check } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [firecrawlApiKey, setFirecrawlApiKey] = useState('')
  const [groqApiKey, setGroqApiKey] = useState('')
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [autoSave, setAutoSave] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    const storedFirecrawlKey = localStorage.getItem('firecrawl-api-key')
    const storedGroqKey = localStorage.getItem('groq-api-key')
    const storedNotifications = localStorage.getItem('notifications')
    const storedAutoSave = localStorage.getItem('auto-save')

    if (storedFirecrawlKey) setFirecrawlApiKey(storedFirecrawlKey)
    if (storedGroqKey) setGroqApiKey(storedGroqKey)
    if (storedNotifications) setNotifications(JSON.parse(storedNotifications))
    if (storedAutoSave) setAutoSave(JSON.parse(storedAutoSave))

    // Check system theme
    setDarkMode(document.documentElement.classList.contains('dark'))
  }, [])

  const handleSave = () => {
    // Save API keys
    if (firecrawlApiKey) {
      localStorage.setItem('firecrawl-api-key', firecrawlApiKey)
    }
    if (groqApiKey) {
      localStorage.setItem('groq-api-key', groqApiKey)
    }

    // Save preferences
    localStorage.setItem('notifications', JSON.stringify(notifications))
    localStorage.setItem('auto-save', JSON.stringify(autoSave))

    setSaved(true)
    toast.success('Settings saved successfully!')
    
    setTimeout(() => setSaved(false), 2000)
  }

  const handleClearData = () => {
    localStorage.removeItem('firecrawl-api-key')
    localStorage.removeItem('groq-api-key')
    setFirecrawlApiKey('')
    setGroqApiKey('')
    toast.success('API keys cleared!')
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
                    API Keys
                  </CardTitle>
                  <CardDescription>
                    Configure your API keys for Firecrawl and Groq services.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="firecrawl-key">Firecrawl API Key</Label>
                    <Input
                      id="firecrawl-key"
                      type="password"
                      value={firecrawlApiKey}
                      onChange={(e) => setFirecrawlApiKey(e.target.value)}
                      placeholder="fc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Get your API key from{' '}
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

                  <div>
                    <Label htmlFor="groq-key">Groq API Key</Label>
                    <Input
                      id="groq-key"
                      type="password"
                      value={groqApiKey}
                      onChange={(e) => setGroqApiKey(e.target.value)}
                      placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Get your API key from{' '}
                      <a 
                        href="https://console.groq.com/keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-orange-600 dark:text-orange-400 hover:underline"
                      >
                        console.groq.com
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
                          Save Keys
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleClearData}>
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-orange-500" />
                    Preferences
                  </CardTitle>
                  <CardDescription>
                    Customize your VerifyAI experience.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="notifications">Notifications</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive notifications about search results and updates
                      </p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={notifications}
                      onCheckedChange={setNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-save">Auto-save Searches</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Automatically save your search history
                      </p>
                    </div>
                    <Switch
                      id="auto-save"
                      checked={autoSave}
                      onCheckedChange={setAutoSave}
                    />
                  </div>
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