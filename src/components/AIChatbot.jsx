import { useEffect, useRef, useState } from 'react'
import { MessageSquare, X, Send, Sparkles, ChevronDown } from 'lucide-react'
import { getChatContext, sendChatMessage } from '../api/chat'

const FALLBACK_CONTEXT = {
  student: {
    title: 'Student AI',
    greeting: 'Hi - I can help explain your student wellness context once the backend chat service is available.',
    suggestions: ['Summarize my wellness context', 'How does AQI affect me today?'],
  },
  admin: {
    title: 'UniVitals AI',
    greeting: 'Hello - I can help explain dashboard data once the backend chat service is available.',
    suggestions: ['Summarize current risks', 'Explain the data available'],
  },
}

export default function AIChatbot({ mode = 'student' }) {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(false)
  const [context, setContext] = useState(FALLBACK_CONTEXT[mode] || FALLBACK_CONTEXT.admin)
  const [messages, setMessages] = useState([])
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    let active = true
    setBootstrapping(true)
    getChatContext(mode)
      .then((data) => {
        if (!active) return
        const nextContext = {
          title: data?.title || FALLBACK_CONTEXT[mode]?.title || 'UniVitals AI',
          greeting: data?.greeting || FALLBACK_CONTEXT[mode]?.greeting,
          suggestions: data?.suggestions || FALLBACK_CONTEXT[mode]?.suggestions || [],
        }
        setContext(nextContext)
        setMessages([{ id: 1, from: 'bot', text: nextContext.greeting, ts: new Date() }])
      })
      .catch(() => {
        if (!active) return
        const fallback = FALLBACK_CONTEXT[mode] || FALLBACK_CONTEXT.admin
        setContext(fallback)
        setMessages([{ id: 1, from: 'bot', text: fallback.greeting, ts: new Date() }])
      })
      .finally(() => {
        if (active) setBootstrapping(false)
      })
    return () => {
      active = false
    }
  }, [mode])

  useEffect(() => {
    if (open && !minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, open, minimized])

  useEffect(() => {
    if (open && !minimized) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open, minimized])

  const formatTime = (d) =>
    d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })

  const submit = async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || typing) return

    const userMessage = { id: Date.now(), from: 'user', text: trimmed, ts: new Date() }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setTyping(true)

    try {
      const data = await sendChatMessage({
        mode,
        message: trimmed,
        history: nextMessages.map((msg) => ({ from: msg.from, text: msg.text })),
      })
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: 'bot', text: data.reply, ts: new Date() },
      ])
    } catch (err) {
      const detail = err?.response?.data?.detail
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          from: 'bot',
          text:
            typeof detail === 'string'
              ? detail
              : 'I could not reach the Gemini-backed chat service right now. Please verify the backend and API key.',
          ts: new Date(),
        },
      ])
    } finally {
      setTyping(false)
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-12 h-12 bg-[#111827] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-150 border border-[#374151]"
          title="Open AI Assistant"
        >
          <MessageSquare size={20} />
        </button>
      )}

      {open && (
        <div
          className={`fixed bottom-5 right-5 z-50 w-[340px] sm:w-[380px] bg-white border border-[#E5E7EB] shadow-xl flex flex-col transition-all duration-200 ${minimized ? 'h-[52px]' : 'h-[500px] sm:h-[540px]'}`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] bg-[#111827] shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-white" />
              <span className="text-[11px] font-bold text-white uppercase tracking-widest">
                {context.title || 'UniVitals AI'}
              </span>
              <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 border border-white/30 text-white/70">
                GEMINI
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized((m) => !m)}
                className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${minimized ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFAFA]">
                {bootstrapping && messages.length === 0 && (
                  <div className="flex justify-start">
                    <div className="flex gap-2">
                      <div className="w-5 h-5 bg-[#111827] rounded-sm flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={9} className="text-white" />
                      </div>
                      <div className="bg-white border border-[#E5E7EB] px-3 py-2 text-[11px] font-mono text-[#111827] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#111827] animate-pulse" />
                        Loading analysis context...
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${msg.from === 'user' ? '' : 'flex gap-2'}`}>
                      {msg.from === 'bot' && (
                        <div className="w-5 h-5 bg-[#111827] rounded-sm flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles size={9} className="text-white" />
                        </div>
                      )}
                      <div>
                        <div
                          className={`px-3 py-2 text-[11px] leading-relaxed font-mono whitespace-pre-wrap ${
                            msg.from === 'user'
                              ? 'bg-[#111827] text-white'
                              : 'bg-white border border-[#E5E7EB] text-[#111827]'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <p className="text-[8px] text-[#9CA3AF] mt-0.5 px-0.5">{formatTime(msg.ts)}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {typing && (
                  <div className="flex justify-start">
                    <div className="flex gap-2">
                      <div className="w-5 h-5 bg-[#111827] rounded-sm flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={9} className="text-white" />
                      </div>
                      <div className="bg-white border border-[#E5E7EB] px-3 py-2 flex items-center gap-1">
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 bg-[#9CA3AF] rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 150}ms` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="px-3 py-2 border-t border-[#E5E7EB] bg-white shrink-0">
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {(context.suggestions || []).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => submit(suggestion)}
                      className="shrink-0 px-2 py-1 text-[9px] font-bold uppercase tracking-widest border border-[#E5E7EB] text-[#6B7280] hover:border-[#111827] hover:text-[#111827] transition-all whitespace-nowrap"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-3 pb-3 pt-2 border-t border-[#E5E7EB] bg-white shrink-0 flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                  placeholder={bootstrapping ? 'Loading analysis...' : 'Ask about the database analysis...'}
                  className="flex-1 px-3 py-2 text-[11px] border border-[#E5E7EB] bg-[#FAFAFA] outline-none focus:border-[#111827] font-mono text-[#111827] placeholder-[#9CA3AF] transition-colors"
                />
                <button
                  onClick={() => submit()}
                  disabled={!input.trim() || typing || bootstrapping}
                  className="w-9 h-9 bg-[#111827] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#374151] transition-colors"
                >
                  <Send size={13} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
