import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { 
  Send, 
  Bot, 
  User,
  Loader2,
  Sparkles,
  Heart,
  Leaf
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatResponse {
  message: string
  suggestions?: string[]
}
const quickSuggestions = [
  {
    category: 'Skin Care',
    icon: Sparkles,
    color: 'bg-pink-500',
    suggestions: [
      "What's a good skincare routine for acne?",
      "Natural remedies for dark spots",
      "Best foods for glowing skin",
      "How to reduce oily skin naturally?"
    ]
  },
  {
    category: 'Hair Care',
    icon: Heart,
    color: 'bg-purple-500',
    suggestions: [
      "How to stop hair fall naturally?",
      "Best foods for hair growth",
      "Natural remedies for dandruff",
      "How to make hair grow faster?"
    ]
  },
  {
    category: 'Natural Remedies',
    icon: Leaf,
    color: 'bg-green-500',
    suggestions: [
      "DIY face masks for dry skin",
      "Home remedies for scalp health",
      "Natural ingredients for anti-aging",
      "Herbal treatments for hair problems"
    ]
  }
]
export default function SkinHairChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your personal skin & hair care assistant! 🌟 I can help you with skincare routines, hair care tips, natural remedies, and nutritional advice for healthy skin and hair. What would you like to know today?",
      timestamp: new Date()
    }
  ])


  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string): Promise<ChatResponse> => {
      const response = await axios.post('/api/skin-hair-chat', {
        message,
        conversation: messages.slice(-5) // Send last 5 messages for context
      })
      return response.data
    },
    onSuccess: (response) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsTyping(false)
    },
    onError: (error) => {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setIsTyping(false)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sendMessageMutation.isPending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)
    sendMessageMutation.mutate(input.trim())
  }



  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    // Auto-submit the suggestion
    if (!sendMessageMutation.isPending) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: suggestion,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, userMessage])
      setInput('')
      setIsTyping(true)
      sendMessageMutation.mutate(suggestion)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-[700px] bg-background">
      {/* Chat Header */}
        <div className="wellness-card p-4 border-b">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Skin & Hair Care Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Get personalized tips and natural remedies
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex items-start gap-3',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}
            
            <div
              className={cn(
                'max-w-[70%] p-3 rounded-lg',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>



      {/* Input Form */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about skin care, hair care, or natural remedies..."
            className="wellness-input flex-1"
            disabled={sendMessageMutation.isPending}
          />
          <button
            type="submit"
            disabled={!input.trim() || sendMessageMutation.isPending}
            className={cn(
              'wellness-button bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2',
              (!input.trim() || sendMessageMutation.isPending) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Get personalized advice for your skin and hair care needs
        </p>
      </div>
             {messages.length === 1 && (
        <div className="p-6 border-t bg-muted/50">
          <h4 className="text-sm font-small text-foreground mb-3">Quick suggestions:</h4>
          <div className="space-y-3">
            {quickSuggestions.map((category) => {
              const IconComponent = category.icon
              return (
                <div key={category.category}>
                  <div className="flex items-center mb-2">
                    <div className={cn('w-4 h-4 rounded mr-2', category.color)}>
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {category.category}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {category.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-left text-xs p-2 rounded bg-background hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )} 
    </div>
  )
} 