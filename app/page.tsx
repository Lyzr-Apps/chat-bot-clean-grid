'use client'

import { useState, useEffect, useRef } from 'react'
import { FiSend, FiRefreshCw, FiSlack, FiCheckCircle, FiX } from 'react-icons/fi'

// Agent ID from orchestrator - Updated with Slack capabilities
const AGENT_ID = '69441ca54fdf6ed46926f465'

// Response schema interface based on chat_assistant_agent_response.json
interface SlackDetails {
  channel_name: string
  message_content?: string
  timestamp?: string
}

interface AgentResult {
  message: string
  slack_action: null | 'message_ready_to_send' | 'message_sent'
  slack_details: SlackDetails | null
  context: string
}

interface AgentMetadata {
  agent_name: string
  timestamp: string
}

interface AgentResponse {
  status: string
  result: AgentResult
  metadata: AgentMetadata
}

interface APIResponse {
  success: boolean
  response: AgentResponse
  raw_response?: string
  agent_id: string
  user_id: string
  session_id: string
  timestamp: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  slack_action?: null | 'message_ready_to_send' | 'message_sent'
  slack_details?: SlackDetails | null
}

const STARTER_PROMPTS = [
  'Explain quantum computing',
  'What are the latest AI trends?',
  'Help me send a message to Slack',
  'Post this to our team channel'
]

// Typing Indicator Component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-3">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  )
}

// Slack Confirmation Indicator Component
function SlackConfirmation({ channel }: { channel: string }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mt-3 animate-in fade-in slide-in-from-bottom-1">
      <FiCheckCircle size={16} className="text-green-600 flex-shrink-0" />
      <span>Message sent to {channel}</span>
    </div>
  )
}

// Slack Action Box Component
function SlackActionBox({
  message,
  channel,
  onConfirm,
  onCancel,
  loading
}: {
  message: string
  channel: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="flex items-start gap-3 mt-3 animate-in fade-in slide-in-from-left-2">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
          <FiSlack size={18} className="text-blue-500" />
        </div>
      </div>

      <div className="flex-1 bg-gray-50 border border-blue-300 rounded-lg p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center gap-2">
            <FiSlack size={16} className="text-blue-500" />
            Send to Slack
          </h3>
          <p className="text-gray-700 text-sm mb-3">
            Message to <span className="font-semibold text-blue-600">{channel}</span>:
          </p>
          <div className="bg-white border border-gray-200 rounded p-3 mb-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{message}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <span>Confirm Send</span>
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-white text-gray-700 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// Message Bubble Component
function MessageBubble({
  message,
  onSlackActionConfirm,
  onSlackActionCancel,
  slackActionLoading
}: {
  message: Message
  onSlackActionConfirm?: (msgId: string) => void
  onSlackActionCancel?: (msgId: string) => void
  slackActionLoading?: boolean
}) {
  const isUser = message.role === 'user'
  const hasSlackAction = message.slack_action === 'message_ready_to_send'
  const hasSlackConfirmation = message.slack_action === 'message_sent'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-in fade-in slide-in-from-bottom-2`}>
      <div className={`flex gap-3 w-full max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isUser && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
              AI
            </div>
          </div>
        )}

        <div className={`flex-1 ${isUser ? 'flex justify-end' : ''}`}>
          <div className={`${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-800'
          } rounded-lg px-4 py-2.5 break-words inline-block`}>
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>

          <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>

          {hasSlackAction && message.slack_details && onSlackActionConfirm && onSlackActionCancel && (
            <SlackActionBox
              message={message.slack_details.message_content || message.content}
              channel={message.slack_details.channel_name}
              onConfirm={() => onSlackActionConfirm(message.id)}
              onCancel={() => onSlackActionCancel(message.id)}
              loading={slackActionLoading || false}
            />
          )}

          {hasSlackConfirmation && message.slack_details && (
            <SlackConfirmation channel={message.slack_details.channel_name} />
          )}
        </div>
      </div>
    </div>
  )
}

// Welcome State Component
function WelcomeState({ onPromptClick }: { onPromptClick: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
          <span className="text-2xl font-bold text-white">AI</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Knowledge Base Chatbot</h1>
        <p className="text-gray-600 text-lg">Ask me anything about technology, AI, and more</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-md">
        {STARTER_PROMPTS.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(prompt)}
            className="p-4 text-left text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200"
          >
            <span className="text-blue-500 mr-2">→</span>
            {prompt}
          </button>
        ))}
      </div>
    </div>
  )
}

// Main Chat Page Component
export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [slackActionLoading, setSlackActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId] = useState(`session-${Date.now()}`)
  const [pendingSlackAction, setPendingSlackAction] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading, slackActionLoading])

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim()

    if (!textToSend) return

    setError(null)
    setInput('')

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      // Call the agent API with the new agent ID that supports Slack
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: AGENT_ID,
          message: textToSend,
          session_id: sessionId,
          user_id: `user-${Date.now()}`
        })
      })

      const data: APIResponse = await response.json()

      if (data.success) {
        // Extract response from agent - already parsed by API route
        const agentResponse = data.response
        const assistantMessage: Message = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: agentResponse.result.message,
          timestamp: new Date(),
          slack_action: agentResponse.result.slack_action,
          slack_details: agentResponse.result.slack_details
        }

        setMessages(prev => [...prev, assistantMessage])
      } else {
        setError(data.error || 'Failed to get response from agent')
        // Add error message to chat
        const errorMessage: Message = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${data.error || 'Unknown error'}. Please try again.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error'
      setError(errorMsg)

      const errorMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `I encountered a network error: ${errorMsg}. Please try again.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleSlackActionConfirm = async (messageId: string) => {
    setPendingSlackAction(messageId)
    setSlackActionLoading(true)

    try {
      // Find the message with the Slack action
      const messageWithAction = messages.find(msg => msg.id === messageId)
      if (!messageWithAction || !messageWithAction.slack_details) return

      // Send confirmation to agent to proceed with Slack message
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: AGENT_ID,
          message: `Confirm: Send message to ${messageWithAction.slack_details.channel_name}`,
          session_id: sessionId,
          user_id: `user-${Date.now()}`
        })
      })

      const data: APIResponse = await response.json()

      if (data.success) {
        const agentResponse = data.response

        // Update the message with confirmed status
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? {
                  ...msg,
                  slack_action: 'message_sent' as const,
                  slack_details: agentResponse.result.slack_details || msg.slack_details
                }
              : msg
          )
        )

        // Add confirmation message from agent
        const confirmMessage: Message = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: agentResponse.result.message,
          timestamp: new Date(),
          slack_action: agentResponse.result.slack_action,
          slack_details: agentResponse.result.slack_details
        }

        setMessages(prev => [...prev, confirmMessage])
      } else {
        setError('Failed to send Slack message. Please try again.')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error'
      setError(`Error sending to Slack: ${errorMsg}`)
    } finally {
      setSlackActionLoading(false)
      setPendingSlackAction(null)
    }
  }

  const handleSlackActionCancel = (messageId: string) => {
    // Simply remove the Slack action from the message
    setMessages(prev =>
      prev.map(msg =>
        msg.id === messageId
          ? {
              ...msg,
              slack_action: null,
              slack_details: null
            }
          : msg
      )
    )
  }

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    sendMessage()
  }

  const startNewChat = () => {
    setMessages([])
    setInput('')
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">KB</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Knowledge Base</h1>
          </div>

          <button
            onClick={startNewChat}
            disabled={messages.length === 0 && !input}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiRefreshCw size={18} />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {messages.length === 0 ? (
            <WelcomeState onPromptClick={sendMessage} />
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onSlackActionConfirm={handleSlackActionConfirm}
                  onSlackActionCancel={handleSlackActionCancel}
                  slackActionLoading={slackActionLoading && pendingSlackAction === msg.id}
                />
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[70%]">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                        AI
                      </div>
                    </div>
                    <div className="bg-gray-100 rounded-lg px-4 py-3">
                      <TypingIndicator />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <footer className="border-t border-gray-200 bg-white py-4">
        <div className="max-w-4xl mx-auto px-4">
          <form onSubmit={handleSend} className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-800 placeholder-gray-500 rounded-lg border border-gray-300 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors resize-none min-h-14"
              rows={1}
              style={{
                height: 'auto',
                minHeight: '56px',
                maxHeight: '120px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 120) + 'px'
              }}
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 self-end"
            >
              <FiSend size={20} />
            </button>
          </form>
        </div>
      </footer>
    </div>
  )
}
