'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  Plane,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Plus,
  MessageSquare,
  Trash2,
  Check,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ToolCall {
  id: string
  tool: string
  input: Record<string, unknown>
  result?: string
}

interface DisplayItem {
  type: 'user' | 'assistant' | 'tool_call' | 'tool_result'
  content?: string
  toolCall?: ToolCall
}

interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  displayItems: DisplayItem[]
  createdAt: number
}

const STORAGE_KEY = 'bouslov-vacation-chats'

const SUGGESTED_PROMPTS = [
  'Find a 7-day trip to 2 new Caribbean countries in May under $1500',
  'Cheapest flights from ORD to anywhere new in June',
  'Search southern Caribbean cruises leaving mid-May',
  'Find a 2-week trip to SE Asia in July, budget $2000 flights',
]

function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveConversations(convos: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convos))
  } catch {
    // localStorage full or unavailable
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function extractPrice(text: string): string | null {
  const match = text.match(/\$[\d,]+/)
  return match ? match[0] : null
}

export default function ToolsPage() {
  const [input, setInput] = useState('')
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load conversations from localStorage on mount
  useEffect(() => {
    const loaded = loadConversations()
    setConversations(loaded)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayItems])

  // Auto-save conversation after display items change (debounced)
  const saveCurrentConvo = useCallback(() => {
    if (!activeConvoId) return
    setConversations(prev => {
      const updated = prev.map(c =>
        c.id === activeConvoId
          ? { ...c, messages, displayItems }
          : c
      )
      saveConversations(updated)
      return updated
    })
  }, [activeConvoId, messages, displayItems])

  useEffect(() => {
    if (activeConvoId && displayItems.length > 0) {
      saveCurrentConvo()
    }
  }, [displayItems, activeConvoId, saveCurrentConvo])

  const toggleTool = (id: string) => {
    setExpandedTools(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const startNewChat = () => {
    setDisplayItems([])
    setMessages([])
    setActiveConvoId(null)
    setExpandedTools(new Set())
    inputRef.current?.focus()
  }

  const loadConversation = (convo: Conversation) => {
    setDisplayItems(convo.displayItems)
    setMessages(convo.messages)
    setActiveConvoId(convo.id)
    setExpandedTools(new Set())
  }

  const deleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id)
      saveConversations(updated)
      return updated
    })
    if (activeConvoId === id) {
      startNewChat()
    }
  }

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || isLoading) return

    setInput('')
    setIsLoading(true)

    // Create conversation if new
    let convoId = activeConvoId
    if (!convoId) {
      convoId = generateId()
      const newConvo: Conversation = {
        id: convoId,
        title: messageText.slice(0, 60),
        messages: [],
        displayItems: [],
        createdAt: Date.now(),
      }
      setActiveConvoId(convoId)
      setConversations(prev => {
        const updated = [newConvo, ...prev]
        saveConversations(updated)
        return updated
      })
    }

    // Add user message to display
    setDisplayItems(prev => [...prev, { type: 'user', content: messageText }])

    // Build conversation history for API
    const newMessages = [...messages, { role: 'user' as const, content: messageText }]
    setMessages(newMessages)

    try {
      const response = await fetch('/api/tools/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''
      let assistantText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let currentEvent = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7)
          } else if (line.startsWith('data: ') && currentEvent) {
            try {
              const data = JSON.parse(line.slice(6))

              if (currentEvent === 'text') {
                assistantText += data.content
                setDisplayItems(prev => {
                  const last = prev[prev.length - 1]
                  if (last?.type === 'assistant') {
                    return [...prev.slice(0, -1), { type: 'assistant', content: assistantText }]
                  }
                  return [...prev, { type: 'assistant', content: assistantText }]
                })
              } else if (currentEvent === 'tool_call') {
                setDisplayItems(prev => [
                  ...prev,
                  {
                    type: 'tool_call',
                    toolCall: { id: data.id, tool: data.tool, input: data.input },
                  },
                ])
              } else if (currentEvent === 'tool_result') {
                setDisplayItems(prev => {
                  return prev.map(item => {
                    if (item.type === 'tool_call' && item.toolCall?.id === data.id) {
                      return {
                        ...item,
                        type: 'tool_result' as const,
                        toolCall: { ...item.toolCall!, result: data.result },
                      }
                    }
                    return item
                  })
                })
                assistantText = ''
              } else if (currentEvent === 'error') {
                setDisplayItems(prev => [
                  ...prev,
                  { type: 'assistant', content: `Error: ${data.message}` },
                ])
              }
            } catch {
              // Skip malformed JSON
            }
            currentEvent = ''
          }
        }
      }

      // Add assistant's full response to conversation history
      if (assistantText) {
        setMessages(prev => [...prev, { role: 'assistant', content: assistantText }])
      }
    } catch (error) {
      setDisplayItems(prev => [
        ...prev,
        {
          type: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to connect'}`,
        },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-[calc(100vh-64px)] flex bg-background">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-[280px]' : 'w-0'
        } transition-all duration-200 overflow-hidden border-r border-border bg-card flex flex-col shrink-0`}
      >
        <div className="p-3 border-b border-border">
          <button
            onClick={startNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-accent transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {conversations.map(convo => (
            <button
              key={convo.id}
              onClick={() => loadConversation(convo)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors group ${
                activeConvoId === convo.id
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate flex-1">{convo.title}</span>
              <Trash2
                className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 shrink-0 transition-opacity"
                onClick={(e) => deleteConversation(convo.id, e)}
              />
            </button>
          ))}
          {conversations.length === 0 && (
            <p className="px-4 py-6 text-xs text-muted-foreground text-center">
              No conversations yet
            </p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toggle sidebar button */}
        <div className="px-3 py-2 flex items-center gap-2 border-b border-border">
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeft className="w-4 h-4" />
            )}
          </button>
          <span className="text-xs text-muted-foreground font-medium">
            {activeConvoId
              ? conversations.find(c => c.id === activeConvoId)?.title || 'Chat'
              : 'Vacation Planner'}
          </span>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {displayItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="flex items-center gap-3 mb-2">
                  <Plane className="w-6 h-6 text-muted-foreground" />
                  <h1 className="text-xl font-semibold text-foreground">Vacation Planner</h1>
                </div>
                <p className="text-sm text-muted-foreground mb-8">
                  Search flights, find new countries, plan trips
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(prompt)}
                      className="text-left text-xs px-3 py-2.5 rounded-lg border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {displayItems.map((item, i) => {
                  if (item.type === 'user') {
                    return (
                      <div key={i} className="flex justify-end">
                        <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-md bg-primary text-primary-foreground text-sm">
                          {item.content}
                        </div>
                      </div>
                    )
                  }

                  if (item.type === 'assistant') {
                    return (
                      <div key={i} className="flex justify-start">
                        <div className="max-w-[85%] text-sm text-foreground leading-relaxed vacation-markdown">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-3 rounded-lg border border-border">
                                  <table className="w-full text-sm">{children}</table>
                                </div>
                              ),
                              thead: ({ children }) => (
                                <thead className="bg-card border-b border-border">
                                  {children}
                                </thead>
                              ),
                              th: ({ children }) => (
                                <th className="px-3 py-2 text-left text-xs font-semibold text-foreground whitespace-nowrap">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="px-3 py-2 text-xs text-muted-foreground border-t border-border whitespace-nowrap font-mono">
                                  {children}
                                </td>
                              ),
                              a: ({ href, children }) => (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1"
                                >
                                  {children}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ),
                              code: ({ className, children }) => {
                                const isInline = !className
                                if (isInline) {
                                  return (
                                    <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">
                                      {children}
                                    </code>
                                  )
                                }
                                return (
                                  <code className={`block bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto my-2 ${className || ''}`}>
                                    {children}
                                  </code>
                                )
                              },
                              pre: ({ children }) => (
                                <pre className="bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto my-2">
                                  {children}
                                </pre>
                              ),
                              h1: ({ children }) => (
                                <h1 className="text-lg font-bold text-foreground mt-4 mb-2">{children}</h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-base font-semibold text-foreground mt-3 mb-1.5">{children}</h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-sm font-semibold text-foreground mt-2 mb-1">{children}</h3>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-foreground">{children}</strong>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside my-1 space-y-0.5">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside my-1 space-y-0.5">{children}</ol>
                              ),
                              p: ({ children }) => (
                                <p className="my-1.5">{children}</p>
                              ),
                              hr: () => (
                                <hr className="border-border my-3" />
                              ),
                            }}
                          >
                            {item.content || ''}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )
                  }

                  if (item.type === 'tool_call' || item.type === 'tool_result') {
                    const tc = item.toolCall!
                    const isExpanded = expandedTools.has(tc.id)
                    const isDone = item.type === 'tool_result'
                    const price = isDone && tc.result ? extractPrice(tc.result) : null

                    return (
                      <div key={i} className="flex justify-start">
                        <div className="flex flex-col">
                          <button
                            onClick={() => toggleTool(tc.id)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs transition-all ${
                              isDone
                                ? 'border-border bg-card text-muted-foreground hover:bg-accent'
                                : 'border-blue-500/30 bg-blue-500/5 text-blue-400 animate-pulse'
                            }`}
                          >
                            {isDone ? (
                              <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Check className="w-2.5 h-2.5 text-emerald-400" />
                              </div>
                            ) : (
                              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            )}
                            <div className="flex items-center gap-1.5">
                              <Plane className="w-3 h-3 opacity-60" />
                              <span className="font-mono">
                                {formatToolName(tc.tool)}
                              </span>
                              <span className="text-muted-foreground font-mono">
                                {formatToolInput(tc.input)}
                              </span>
                            </div>
                            {price && (
                              <span className="font-mono font-semibold text-emerald-400 ml-1">
                                {price}
                              </span>
                            )}
                            {isDone && (
                              isExpanded
                                ? <ChevronDown className="w-3 h-3 ml-1" />
                                : <ChevronRight className="w-3 h-3 ml-1" />
                            )}
                            {!isDone && (
                              <span className="text-[10px] ml-1">Searching...</span>
                            )}
                          </button>
                          {isExpanded && tc.result && (
                            <div className="mt-1 p-3 rounded-lg bg-muted/30 border border-border text-[11px] font-mono text-muted-foreground max-h-48 overflow-y-auto whitespace-pre-wrap">
                              {tc.result}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }

                  return null
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-border bg-background">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-end gap-2 bg-card border border-border rounded-xl px-4 py-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Find me a trip..."
                rows={1}
                className="flex-1 bg-transparent outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground max-h-32"
                style={{ minHeight: '24px' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                className="p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 hover:opacity-90 transition-opacity"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              Searches real-time Google Flights prices. Prices may change -- verify via links before booking.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatToolName(name: string): string {
  return name.replace(/_/g, ' ').replace('get ', '')
}

function formatToolInput(input: Record<string, unknown>): string {
  const parts = []
  if (input.origin) parts.push(`${input.origin}`)
  if (input.destination) parts.push(`${input.destination}`)
  if (input.departure_date) parts.push(`${input.departure_date}`)
  if (input.query) parts.push(`"${input.query}"`)
  return parts.join(' → ') || '...'
}
