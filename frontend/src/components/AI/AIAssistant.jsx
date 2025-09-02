import React, { useState, useRef, useEffect } from 'react'
import {
  Bot,
  Send,
  Sparkles,
  Brain,
  Lightbulb,
  Target,
  Clock,
  BarChart3,
  X,
  Minimize2,
  Maximize2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Zap
} from 'lucide-react'
import { useAI } from '../../context/AIContext'
import { useSubscription } from '../../context/SubscriptionContext'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const AIAssistant = ({ isOpen, onClose, onMinimize, isMinimized }) => {
  const { user } = useAuth()
  const { canUseAI, getRemainingAIRequests, loading } = useAI()
  const { hasFeature } = useSubscription()
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: `Hi ${user?.name || 'there'}! I'm your AI assistant. I can help you with task management, productivity insights, and project planning. What would you like to work on today?`,
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, isMinimized])

  const quickActions = [
    {
      id: 'suggest-tasks',
      icon: <Target className="w-4 h-4" />,
      label: 'Suggest Tasks',
      description: 'Get AI-powered task suggestions for your project'
    },
    {
      id: 'optimize-schedule',
      icon: <Clock className="w-4 h-4" />,
      label: 'Optimize Schedule',
      description: 'Let AI optimize your task schedule'
    },
    {
      id: 'productivity-insights',
      icon: <BarChart3 className="w-4 h-4" />,
      label: 'Productivity Insights',
      description: 'Get insights about your work patterns'
    },
    {
      id: 'improve-description',
      icon: <Lightbulb className="w-4 h-4" />,
      label: 'Improve Description',
      description: 'Enhance your task descriptions with AI'
    }
  ]

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    if (!canUseAI()) {
      toast.error('AI request limit reached. Please upgrade your plan.')
      return
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    try {
      // Simulate AI response (replace with actual AI API call)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateAIResponse(inputMessage),
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      toast.error('Failed to get AI response')
    } finally {
      setIsTyping(false)
    }
  }

  const generateAIResponse = (message) => {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
      return "I can help you create and manage tasks more effectively! Here are some suggestions:\n\n• Break down large tasks into smaller, actionable items\n• Set realistic deadlines based on task complexity\n• Use priority levels to focus on what matters most\n• Add detailed descriptions to avoid confusion\n\nWould you like me to help you create a specific task or optimize your current task list?"
    }
    
    if (lowerMessage.includes('schedule') || lowerMessage.includes('time')) {
      return "Time management is crucial for productivity! Here's what I recommend:\n\n• Use time blocking to dedicate specific hours to tasks\n• Consider your energy levels when scheduling demanding work\n• Build in buffer time for unexpected issues\n• Review and adjust your schedule regularly\n\nI can analyze your current workload and suggest an optimized schedule. Would you like me to do that?"
    }
    
    if (lowerMessage.includes('productivity') || lowerMessage.includes('efficient')) {
      return "Great question about productivity! Based on successful patterns, here are key strategies:\n\n• Focus on one task at a time (avoid multitasking)\n• Use the Pomodoro Technique for better focus\n• Eliminate distractions during work sessions\n• Take regular breaks to maintain energy\n• Track your progress to stay motivated\n\nI can analyze your work patterns and provide personalized productivity insights. Interested?"
    }
    
    if (lowerMessage.includes('project') || lowerMessage.includes('plan')) {
      return "Project planning is one of my specialties! Here's a structured approach:\n\n• Define clear project goals and deliverables\n• Break the project into phases or milestones\n• Identify dependencies between tasks\n• Assign realistic timelines and resources\n• Set up regular check-ins and reviews\n\nI can help you create a detailed project plan. What type of project are you working on?"
    }
    
    return "I understand you're looking for help with task management. I can assist with:\n\n• Creating and organizing tasks\n• Optimizing your schedule\n• Providing productivity insights\n• Improving task descriptions\n• Project planning and management\n\nWhat specific area would you like to focus on? Feel free to ask me anything about productivity and task management!"
  }

  const handleQuickAction = async (actionId) => {
    if (!canUseAI()) {
      toast.error('AI request limit reached. Please upgrade your plan.')
      return
    }

    const action = quickActions.find(a => a.id === actionId)
    if (!action) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: `Help me with: ${action.label}`,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      let aiResponse = ''
      switch (actionId) {
        case 'suggest-tasks':
          aiResponse = "Based on your current projects, here are some task suggestions:\n\n• Review and update project documentation\n• Conduct team standup meeting\n• Analyze user feedback from last sprint\n• Plan next quarter's roadmap\n• Optimize database performance\n\nWould you like me to create any of these tasks for you?"
          break
        case 'optimize-schedule':
          aiResponse = "I've analyzed your current workload. Here's an optimized schedule:\n\n**Morning (9-12 PM):** Focus on high-priority creative tasks\n**Afternoon (1-3 PM):** Meetings and collaboration\n**Late Afternoon (3-5 PM):** Administrative tasks and emails\n\nThis schedule aligns with typical energy patterns. Would you like me to apply these changes?"
          break
        case 'productivity-insights':
          aiResponse = "Here are your productivity insights for this week:\n\n📈 **Strengths:**\n• You complete 85% of planned tasks\n• Most productive time: 10-11 AM\n• Best day: Tuesday\n\n⚠️ **Areas for improvement:**\n• 15% of tasks are overdue\n• Meetings interrupt deep work\n• Friday productivity drops 30%\n\n**Recommendation:** Block Friday mornings for focused work."
          break
        case 'improve-description':
          aiResponse = "I can help improve your task descriptions! Here's what makes a great task description:\n\n• Clear, actionable language\n• Specific acceptance criteria\n• Estimated time requirement\n• Dependencies and prerequisites\n• Expected outcome\n\nShare a task description you'd like me to improve!"
          break
        default:
          aiResponse = "I'm ready to help! What would you like to work on?"
      }

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      toast.error('Failed to process request')
    } finally {
      setIsTyping(false)
    }
  }

  const copyMessage = (content) => {
    navigator.clipboard.writeText(content)
    toast.success('Message copied to clipboard')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) return null

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onMinimize}
          className="btn btn-primary btn-circle shadow-lg"
        >
          <Bot className="w-6 h-6" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[600px] bg-base-100 rounded-lg shadow-2xl border border-base-300 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-300 bg-primary text-primary-content rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-xs opacity-75">
              {getRemainingAIRequests()} requests remaining
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimize}
            className="btn btn-ghost btn-xs btn-circle text-primary-content"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-circle text-primary-content"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-200 text-base-content'
              }`}
            >
              {message.type === 'ai' && (
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-medium">AI Assistant</span>
                </div>
              )}
              
              <div className="whitespace-pre-wrap text-sm">{message.content}</div>
              
              {message.type === 'ai' && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-base-300">
                  <button
                    onClick={() => copyMessage(message.content)}
                    className="btn btn-ghost btn-xs"
                    title="Copy message"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button className="btn btn-ghost btn-xs" title="Helpful">
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button className="btn btn-ghost btn-xs" title="Not helpful">
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-base-200 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs">AI is typing</span>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-base-content rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-base-content rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-base-content rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length === 1 && (
        <div className="p-4 border-t border-base-300">
          <p className="text-xs text-base-content/60 mb-3">Quick actions:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.id)}
                className="btn btn-outline btn-xs justify-start"
                disabled={!canUseAI() || loading}
              >
                {action.icon}
                <span className="ml-1 truncate">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-base-300">
        {!hasFeature('aiRequests') && (
          <div className="mb-3 p-2 bg-warning/10 border border-warning/20 rounded text-xs text-warning">
            <Zap className="w-3 h-3 inline mr-1" />
            Upgrade to unlock AI features
          </div>
        )}
        
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={canUseAI() ? "Ask me anything about productivity..." : "Upgrade to use AI assistant"}
            className="textarea textarea-bordered flex-1 resize-none h-10 min-h-10"
            disabled={!canUseAI() || loading}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !canUseAI() || loading}
            className="btn btn-primary btn-square"
          >
            {loading ? (
              <div className="loading loading-spinner loading-sm"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIAssistant