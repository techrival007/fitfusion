import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Sparkles, ChevronDown } from 'lucide-react'

const STUDENT_SCRIPTS = [
  {
    keywords: ['sleep', 'tired', 'rest', 'insomnia', 'sleeping'],
    response: "Your 7-day sleep average is 6.5 hrs — slightly below the 7-hour target. Try a consistent 10 PM–6 AM schedule. Avoid screens 45 min before bed. Your best sleep nights this week correlated with days you logged activity before 6 PM.",
  },
  {
    keywords: ['nutrition', 'food', 'eat', 'meal', 'calories', 'diet'],
    response: "Based on your recent logs, you're hitting your calorie target (avg 2,050 kcal) but protein is slightly low at 62g vs the 70g RDA. Today's mess lunch has dal which can boost this. Breakfast skipping on Tuesdays is a pattern — worth addressing.",
  },
  {
    keywords: ['activity', 'exercise', 'workout', 'gym', 'run', 'walk'],
    response: "You're averaging 67 min of activity daily — above the 45-min WHO recommendation. Your gym sessions peak mid-week. Consider adding a Sunday walk since activity drops ~60% on weekends. Your streak is looking strong!",
  },
  {
    keywords: ['mood', 'stress', 'anxious', 'sad', 'depressed', 'feeling', 'mental'],
    response: "I notice your mood has been in the 3.5–4.0 range (neutral-good). Stress indicators tend to spike before assessments. If you're feeling overwhelmed, the SOS Hub has direct access to the counselling centre — open 9AM–5PM on weekdays. You're not alone.",
  },
  {
    keywords: ['score', 'wellness', 'points', 'rank'],
    response: "Your current wellness score is 81.4 — Thriving tier! It's calculated from 5 components: sleep (30%), activity (25%), nutrition (20%), mood (15%), and consistency (10%). Improving your sleep consistency would have the biggest impact right now.",
  },
  {
    keywords: ['streak', 'badge', 'achievement', 'reward'],
    response: "You're on a 14-day logging streak — impressive! Logging for 21 consecutive days unlocks the 'Consistent Achiever' badge. Your next achievement is 'Early Bird' — log breakfast for 7 straight days (you're 3 days in).",
  },
  {
    keywords: ['sos', 'help', 'emergency', 'crisis', 'counsell'],
    response: "The SOS Hub has resources for all kinds of support. For immediate distress, iCall is available 24/7 at 9152987821. Campus counselling (Wellness Cell) is open Mon–Fri 9AM–5PM. You can reach the warden anytime for hostel emergencies. Please don't hesitate to reach out.",
  },
  {
    keywords: ['journal', 'write', 'diary'],
    response: "Your journal entries are end-to-end encrypted — no admin can read them, including your warden. They're just for you. Writing 3 lines a day about your state of mind has been shown to reduce stress by 15–20% over 4 weeks. Give it a try.",
  },
  {
    keywords: ['water', 'hydration', 'drink'],
    response: "Hydration is often the most under-logged metric! Aim for 2.5–3L/day, especially on high-activity days. You can note water intake in the Nutrition log under 'beverages'. Dehydration by just 2% can reduce cognitive performance by up to 10%.",
  },
  {
    keywords: ['mess', 'canteen', 'menu', 'lunch', 'breakfast', 'dinner'],
    response: "Today's mess menu shows a well-balanced lunch — rice, dal, sabzi, and curd. The evening snacks (poha) are a good pre-dinner option. If you find the mess meals insufficient, use the Nutrition log to track additional intake. You can also flag a menu concern via feedback.",
  },
]

const ADMIN_SCRIPTS = [
  {
    keywords: ['alert', 'attention', 'risk', 'warning', 'critical'],
    response: "Alerts are auto-generated when aggregated metrics cross thresholds. 'Sleep Deficit' fires when hostel avg drops below 6.5 hrs for 3+ consecutive days. 'Mood Decline' triggers at avg < 2.5 for 4 days. All alerts respect k-anonymity — minimum 30 students must be in the cohort before an alert surfaces.",
  },
  {
    keywords: ['wellness score', 'score', 'calculation', 'formula'],
    response: "The campus wellness score is a weighted composite: Sleep (30%) + Activity (25%) + Nutrition (20%) + Mood (15%) + Consistency (10%). Scores < 40 = 'Needs Attention', 40–60 = 'Fair', 60–80 = 'Good', > 80 = 'Thriving'. The campus average this week is 58.4 — Fair tier.",
  },
  {
    keywords: ['participation', 'logging', 'engagement', 'students not'],
    response: "Current week participation is 61.2% campus-wide. BH-3 leads at 76%. Low participation hostels (BH-5 at 31%) may benefit from awareness campaigns or incentivized logging. Students who log for 7+ days consistently score 12 pts higher on average wellness.",
  },
  {
    keywords: ['privacy', 'data', 'anonymiz', 'individual', 'gdpr'],
    response: "All admin views show aggregated, anonymized data only. No individual student data is ever displayed. Minimum group size for any metric is 30 students (k-anonymity). Mood journals are encrypted client-side — inaccessible to any admin. Data is retained for 90 days only.",
  },
  {
    keywords: ['nutrition', 'mess', 'meal', 'food', 'nutrient'],
    response: "This week's campus nutrition data shows avg protein intake at 68g (vs 70g RDA) and iron at 78% RDA — the two key gaps. Thursday dinner has the lowest participation (38% skip). The Mess Manager dashboard has direct menu planning tools and nutrition gap analysis by meal type.",
  },
  {
    keywords: ['sleep', 'rest', 'hours'],
    response: "Campus average sleep is 6.5 hrs — below the 7-hour WHO recommendation. Sleep is the metric most strongly correlated with overall wellness score on this campus (r = 0.72). Exam weeks show a 1.2-hr average sleep reduction. Consider scheduling late-night quiet hours in hostels.",
  },
  {
    keywords: ['export', 'report', 'download', 'pdf'],
    response: "Reports can be generated from the Export (Warden) or Generate Report (Dean) section. You can export: 28-day wellness summary, nutrition gap analysis, activity participation rates, and anonymized trend data. PDFs include auto-generated insights. Data is aggregated — no individual student data is exported.",
  },
  {
    keywords: ['hostel', 'comparison', 'rank', 'between'],
    response: "The Dean's Hostel Comparison dashboard shows all 10 hostels side by side. GH-2 has the highest average wellness score (67.3) this week. BH-5 is lowest (48.1) — a 19-point gap that warrants investigation. Girls' hostels average 4.2 pts higher than boys' hostels this month.",
  },
  {
    keywords: ['academic', 'exam', 'semester', 'grade', 'study'],
    response: "Academic calendar integration shows a 7–12 point wellness dip during mid-semester exams across all hostels. CSE branch students show the highest exam sensitivity (−14 pts). Post-exam recovery takes 8–10 days on average. Pre-emptive wellness nudges 2 weeks before exams show 23% better retention.",
  },
  {
    keywords: ['environmental', 'aqi', 'air', 'quality', 'pollution'],
    response: "Current campus AQI is 36 — Good. Air quality is healthy for outdoor activities. Historical data shows outdoor activity drops 40% when AQI exceeds 100. GH-1 and BH-3 have the best natural ventilation. AQI spikes above 150 automatically trigger indoor activity recommendations in student nudges.",
  },
]

const STUDENT_SUGGESTIONS = [
  'How is my sleep?',
  'Nutrition tips',
  'My wellness score',
  'SOS resources',
  'My streak',
]

const ADMIN_SUGGESTIONS = [
  'Explain wellness score',
  'Current alerts',
  'Participation data',
  'Privacy & data',
  'Export reports',
]

const GREETING = {
  student: "Hi! I'm your UniVitals wellness assistant. I can help you understand your health data, give tips, or point you to support resources. What would you like to know?",
  admin: "Hello. I'm the UniVitals analytics assistant. I can help you interpret dashboard data, understand metrics, and navigate the platform. How can I help?",
}

const DEFAULT_RESPONSE = {
  student: "I'm here to help with your wellness journey. You can ask me about your sleep, nutrition, activity, mood score, or where to find support. Try one of the suggestions below.",
  admin: "I can help you with wellness metrics, alerts, data privacy, hostel comparisons, and more. Ask me anything about the UniVitals platform or the data you're seeing.",
}

function findResponse(input, scripts) {
  const lower = input.toLowerCase()
  for (const script of scripts) {
    if (script.keywords.some(k => lower.includes(k))) {
      return script.response
    }
  }
  return null
}

export default function AIChatbot({ mode = 'student' }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, from: 'bot', text: GREETING[mode], ts: new Date() },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const scripts = mode === 'student' ? STUDENT_SCRIPTS : ADMIN_SCRIPTS
  const suggestions = mode === 'student' ? STUDENT_SUGGESTIONS : ADMIN_SUGGESTIONS

  useEffect(() => {
    if (open && !minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, open, minimized])

  useEffect(() => {
    if (open && !minimized) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open, minimized])

  const sendMessage = (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed) return
    const userMsg = { id: Date.now(), from: 'user', text: trimmed, ts: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    const delay = 800 + Math.random() * 700
    setTimeout(() => {
      const reply = findResponse(trimmed, scripts) || DEFAULT_RESPONSE[mode]
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', text: reply, ts: new Date() }])
      setTyping(false)
    }, delay)
  }

  const formatTime = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

  return (
    <>
      {/* Floating toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-12 h-12 bg-[#111827] text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-150 border border-[#374151]"
          title="Open AI Assistant"
        >
          <MessageSquare size={20} />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div
          className={`fixed bottom-5 right-5 z-50 w-[340px] sm:w-[380px] bg-white border border-[#E5E7EB] shadow-xl flex flex-col transition-all duration-200 ${minimized ? 'h-[52px]' : 'h-[500px] sm:h-[540px]'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] bg-[#111827] shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-white" />
              <span className="text-[11px] font-bold text-white uppercase tracking-widest">UniVitals AI</span>
              <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 border border-white/30 text-white/70">BETA</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(m => !m)}
                className="w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <ChevronDown size={14} className={`transition-transform duration-200 ${minimized ? 'rotate-180' : ''}`} />
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
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFAFA]">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${msg.from === 'user' ? '' : 'flex gap-2'}`}>
                      {msg.from === 'bot' && (
                        <div className="w-5 h-5 bg-[#111827] rounded-sm flex items-center justify-center shrink-0 mt-0.5">
                          <Sparkles size={9} className="text-white" />
                        </div>
                      )}
                      <div>
                        <div
                          className={`px-3 py-2 text-[11px] leading-relaxed font-mono ${
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

                {/* Typing indicator */}
                {typing && (
                  <div className="flex justify-start">
                    <div className="flex gap-2">
                      <div className="w-5 h-5 bg-[#111827] rounded-sm flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={9} className="text-white" />
                      </div>
                      <div className="bg-white border border-[#E5E7EB] px-3 py-2 flex items-center gap-1">
                        {[0, 1, 2].map(i => (
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

              {/* Suggestions */}
              <div className="px-3 py-2 border-t border-[#E5E7EB] bg-white shrink-0">
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {suggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="shrink-0 px-2 py-1 text-[9px] font-bold uppercase tracking-widest border border-[#E5E7EB] text-[#6B7280] hover:border-[#111827] hover:text-[#111827] transition-all whitespace-nowrap"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="px-3 pb-3 pt-2 border-t border-[#E5E7EB] bg-white shrink-0 flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask anything..."
                  className="flex-1 px-3 py-2 text-[11px] border border-[#E5E7EB] bg-[#FAFAFA] outline-none focus:border-[#111827] font-mono text-[#111827] placeholder-[#9CA3AF] transition-colors"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || typing}
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
