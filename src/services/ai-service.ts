import { FamilyEvent } from '../hooks/useEvents'
import { Profile } from '../hooks/useProfile'

// AI Service Configuration
interface AIConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
  maxTokens?: number
  temperature?: number
  rateLimitPerMinute?: number
}

// AI Service Response Types
interface AIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  usage?: {
    tokens: number
    cost?: number
  }
}

interface ParsedEvent {
  title: string
  date: string
  time: string
  location: string
  description: string
  type: 'event' | 'deadline' | 'meeting'
  attendees: string[]
  confidence: number
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface DocumentAnalysis {
  summary: string
  extractedEvents: ParsedEvent[]
  keyDates: string[]
  actionItems: string[]
  confidence: number
}

// Rate Limiting
class RateLimiter {
  private requests: number[] = []
  private limit: number

  constructor(limit: number = 60) {
    this.limit = limit
  }

  canMakeRequest(): boolean {
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    // Remove requests older than 1 minute
    this.requests = this.requests.filter(time => time > oneMinuteAgo)

    if (this.requests.length >= this.limit) {
      return false
    }

    this.requests.push(now)
    return true
  }

  getTimeUntilNextRequest(): number {
    if (this.requests.length < this.limit) return 0
    
    const oldestRequest = Math.min(...this.requests)
    return Math.max(0, 60000 - (Date.now() - oldestRequest))
  }
}

// Caching
class AICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttlMinutes: number = 30): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Logging
class AILogger {
  private logs: Array<{
    timestamp: Date
    level: 'info' | 'warn' | 'error'
    operation: string
    data?: any
    error?: string
  }> = []

  log(level: 'info' | 'warn' | 'error', operation: string, data?: any, error?: string): void {
    this.logs.push({
      timestamp: new Date(),
      level,
      operation,
      data,
      error
    })

    // Keep only last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000)
    }

    // Console logging for development
    if (import.meta.env.DEV) {
      const message = `[AI Service] ${operation}`
      switch (level) {
        case 'info':
          console.log(message, data)
          break
        case 'warn':
          console.warn(message, data)
          break
        case 'error':
          console.error(message, error || data)
          break
      }
    }
  }

  getLogs(limit: number = 100): typeof this.logs {
    return this.logs.slice(-limit)
  }

  clearLogs(): void {
    this.logs = []
  }
}

// Main AI Service Class
export class AIService {
  private config: AIConfig
  private rateLimiter: RateLimiter
  private cache: AICache
  private logger: AILogger
  private isInitialized: boolean = false

  constructor(config: AIConfig = {}) {
    this.config = {
      model: 'gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7,
      rateLimitPerMinute: 60,
      ...config
    }
    
    this.rateLimiter = new RateLimiter(this.config.rateLimitPerMinute)
    this.cache = new AICache()
    this.logger = new AILogger()
    
    this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      this.logger.log('info', 'AI Service initializing', { config: this.config })
      
      // Check if we have necessary configuration
      if (!this.config.apiKey && !import.meta.env.VITE_OPENAI_API_KEY) {
        this.logger.log('warn', 'No API key configured, using mock responses')
      }
      
      this.isInitialized = true
      this.logger.log('info', 'AI Service initialized successfully')
    } catch (error: any) {
      this.logger.log('error', 'Failed to initialize AI Service', undefined, error.message)
      throw error
    }
  }

  private async makeRequest<T>(
    operation: string,
    prompt: string,
    cacheKey?: string,
    cacheTTL: number = 30
  ): Promise<AIResponse<T>> {
    try {
      // Check rate limiting
      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getTimeUntilNextRequest()
        this.logger.log('warn', 'Rate limit exceeded', { waitTime })
        return {
          success: false,
          error: `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`
        }
      }

      // Check cache
      if (cacheKey) {
        const cached = this.cache.get(cacheKey)
        if (cached) {
          this.logger.log('info', 'Cache hit', { operation, cacheKey })
          return { success: true, data: cached }
        }
      }

      this.logger.log('info', 'Making AI request', { operation, prompt: prompt.substring(0, 100) + '...' })

      // For now, we'll use mock responses since we don't have a real AI API configured
      const mockResponse = await this.getMockResponse<T>(operation, prompt)
      
      // Cache the response
      if (cacheKey && mockResponse.success) {
        this.cache.set(cacheKey, mockResponse.data, cacheTTL)
      }

      this.logger.log('info', 'AI request completed', { operation, success: mockResponse.success })
      return mockResponse

    } catch (error: any) {
      this.logger.log('error', 'AI request failed', { operation }, error.message)
      return {
        success: false,
        error: error.message || 'AI request failed'
      }
    }
  }

  private async getMockResponse<T>(operation: string, prompt: string): Promise<AIResponse<T>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    switch (operation) {
      case 'parseEvents':
        return this.getMockEventParsing(prompt) as AIResponse<T>
      case 'chatResponse':
        return this.getMockChatResponse(prompt) as AIResponse<T>
      case 'analyzeDocument':
        return this.getMockDocumentAnalysis(prompt) as AIResponse<T>
      case 'generateSuggestions':
        return this.getMockSuggestions(prompt) as AIResponse<T>
      default:
        return {
          success: false,
          error: 'Unknown operation'
        }
    }
  }

  private getMockEventParsing(text: string): AIResponse<ParsedEvent[]> {
    const events: ParsedEvent[] = []
    const lowerText = text.toLowerCase()

    // Simple pattern matching for demo purposes
    if (lowerText.includes('field trip') || lowerText.includes('museum')) {
      events.push({
        title: 'Science Museum Field Trip',
        date: 'March 15, 2024',
        time: '9:00 AM - 3:00 PM',
        location: 'Natural History Museum',
        description: '4th grade class trip with packed lunch required',
        type: 'event',
        attendees: ['Emma'],
        confidence: 0.92
      })
    }

    if (lowerText.includes('conference') || lowerText.includes('teacher')) {
      events.push({
        title: 'Parent-Teacher Conference',
        date: 'March 19, 2024',
        time: '3:30 PM',
        location: 'Room 204',
        description: 'Quarterly progress review',
        type: 'meeting',
        attendees: ['Parent'],
        confidence: 0.88
      })
    }

    if (lowerText.includes('soccer') || lowerText.includes('practice')) {
      events.push({
        title: 'Soccer Practice',
        date: 'March 27, 2024',
        time: '4:00 PM',
        location: 'Lincoln Park Field',
        description: 'Weekly team practice',
        type: 'event',
        attendees: ['Emma'],
        confidence: 0.95
      })
    }

    return {
      success: true,
      data: events,
      usage: { tokens: 150 }
    }
  }

  private getMockChatResponse(message: string): AIResponse<string> {
    const lowerMessage = message.toLowerCase()
    
    let response = ''
    
    if (lowerMessage.includes('schedule') || lowerMessage.includes('today')) {
      response = "Based on your calendar, you have 3 events today: Soccer practice at 4:00 PM, parent-teacher conference at 3:30 PM, and piano lesson at 2:00 PM. The soccer practice and conference overlap - would you like me to help reschedule?"
    } else if (lowerMessage.includes('conflict')) {
      response = "I found 1 scheduling conflict: The parent-teacher conference (3:30-4:00 PM) overlaps with soccer practice (4:00-5:30 PM). I suggest moving the conference to 3:00 PM or rescheduling soccer practice to 5:00 PM."
    } else if (lowerMessage.includes('tip') || lowerMessage.includes('advice')) {
      const tips = [
        "Here's a parenting tip: Create a family command center with a shared calendar, important documents, and emergency contacts all in one place.",
        "Try the 'Sunday Planning Session' - spend 15 minutes each Sunday reviewing the upcoming week with your family to prevent surprises.",
        "Use color coding for different family members in your calendar - it makes it easier to see everyone's commitments at a glance."
      ]
      response = tips[Math.floor(Math.random() * tips.length)]
    } else {
      response = "I'm here to help with your family scheduling! You can ask me about today's events, upcoming activities, scheduling conflicts, or request parenting tips. What would you like to know?"
    }

    return {
      success: true,
      data: response,
      usage: { tokens: 75 }
    }
  }

  private getMockDocumentAnalysis(content: string): AIResponse<DocumentAnalysis> {
    return {
      success: true,
      data: {
        summary: "School newsletter containing information about upcoming events, field trips, and important deadlines.",
        extractedEvents: [
          {
            title: "Spring Break",
            date: "March 25-29, 2024",
            time: "All day",
            location: "No school",
            description: "Spring break vacation",
            type: "event",
            attendees: [],
            confidence: 0.98
          }
        ],
        keyDates: ["March 25, 2024", "April 5, 2024"],
        actionItems: ["Submit permission slip by March 13", "RSVP for team dinner by April 1"],
        confidence: 0.89
      },
      usage: { tokens: 200 }
    }
  }

  private getMockSuggestions(context: string): AIResponse<string[]> {
    return {
      success: true,
      data: [
        "Schedule a family meeting to discuss the upcoming busy week",
        "Set up carpools for soccer practice to reduce driving time",
        "Prepare permission slips and forms the night before they're due",
        "Create a shared grocery list for school lunch items"
      ],
      usage: { tokens: 100 }
    }
  }

  // Public API Methods
  async parseEvents(text: string): Promise<AIResponse<ParsedEvent[]>> {
    const cacheKey = `parse_events_${btoa(text).substring(0, 32)}`
    return this.makeRequest<ParsedEvent[]>('parseEvents', text, cacheKey, 60)
  }

  async generateChatResponse(
    message: string, 
    context: { events: FamilyEvent[]; user: Profile | null }
  ): Promise<AIResponse<string>> {
    const prompt = `User message: ${message}\nContext: ${JSON.stringify(context)}`
    const cacheKey = `chat_${btoa(message).substring(0, 32)}`
    return this.makeRequest<string>('chatResponse', prompt, cacheKey, 15)
  }

  async analyzeDocument(content: string, fileName: string): Promise<AIResponse<DocumentAnalysis>> {
    const prompt = `Analyze this document (${fileName}):\n${content}`
    const cacheKey = `doc_${btoa(content).substring(0, 32)}`
    return this.makeRequest<DocumentAnalysis>('analyzeDocument', prompt, cacheKey, 120)
  }

  async generateSuggestions(events: FamilyEvent[], user: Profile | null): Promise<AIResponse<string[]>> {
    const context = JSON.stringify({ events, user })
    const cacheKey = `suggestions_${btoa(context).substring(0, 32)}`
    return this.makeRequest<string[]>('generateSuggestions', context, cacheKey, 30)
  }

  async processVoiceNote(transcript: string): Promise<AIResponse<ParsedEvent[]>> {
    return this.parseEvents(transcript)
  }

  // Utility Methods
  getStats() {
    return {
      cacheSize: this.cache.size(),
      recentLogs: this.logger.getLogs(10),
      isInitialized: this.isInitialized,
      config: {
        model: this.config.model,
        rateLimitPerMinute: this.config.rateLimitPerMinute
      }
    }
  }

  clearCache(): void {
    this.cache.clear()
    this.logger.log('info', 'Cache cleared')
  }

  updateConfig(newConfig: Partial<AIConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.rateLimiter = new RateLimiter(this.config.rateLimitPerMinute)
    this.logger.log('info', 'Configuration updated', newConfig)
  }
}

// Export singleton instance
export const aiService = new AIService({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  rateLimitPerMinute: 60,
  temperature: 0.7
})

// Export types
export type { AIConfig, AIResponse, ParsedEvent, ChatMessage, DocumentAnalysis }