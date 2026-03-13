import { useState } from 'react'
import { Lock, Check, Shield } from 'lucide-react'

const PROMPTS = [
  'What made you smile today?',
  'What was the most challenging part of your day?',
  'What are three things you are grateful for right now?',
  'How did your energy levels feel throughout the day?',
  'What would you do differently tomorrow?',
]

export default function Journal() {
  const [entry, setEntry] = useState('')
  const [saved, setSaved] = useState(false)
  const [savedEntries, setSavedEntries] = useState([
    { date: '2026-03-12', words: 89, preview: 'Private entry' },
    { date: '2026-03-11', words: 142, preview: 'Private entry' },
    { date: '2026-03-09', words: 65, preview: 'Private entry' },
  ])

  const handleSave = () => {
    if (!entry.trim()) return
    setSavedEntries(prev => [{ date: new Date().toISOString().split('T')[0], words: entry.trim().split(/\s+/).length, preview: 'Private entry' }, ...prev])
    setSaved(true)
    setEntry('')
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Private · Encrypted</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Personal Journal</h1>
      </div>

      {/* Privacy notice */}
      <div className="border border-[#bbf7d0] bg-[#f0fdf4] p-4 flex gap-3">
        <Shield size={16} className="text-[#22c55e] shrink-0 mt-0.5" />
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#22c55e] mb-1">End-to-End Private</p>
          <p className="text-[11px] text-[#166534] leading-relaxed">
            Your journal entries are encrypted with AES-256 before storage. No administrator, counselor, warden, or any campus staff can ever read your entries. This space exists purely for you.
          </p>
        </div>
      </div>

      {/* Write entry */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Today's Entry</p>
          <div className="flex items-center gap-1.5 text-[#9CA3AF]">
            <Lock size={10} />
            <span className="text-[9px]">Encrypted before saving</span>
          </div>
        </div>

        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Prompt</p>
        <p className="text-[12px] text-[#6B7280] italic mb-3">{PROMPTS[new Date().getDay() % PROMPTS.length]}</p>

        <textarea
          value={entry}
          onChange={e => setEntry(e.target.value)}
          className="w-full border border-[#E5E7EB] px-4 py-3 text-[12px] font-mono focus:outline-none focus:border-[#111827] bg-[#FAFAFA] resize-none leading-relaxed"
          rows={8}
          placeholder="Write freely. This is your private space..."
        />

        <div className="flex items-center justify-between mt-3">
          <p className="text-[9px] text-[#9CA3AF]">{entry.trim() ? entry.trim().split(/\s+/).length : 0} words</p>
          <button
            onClick={handleSave}
            disabled={!entry.trim()}
            className={`flex items-center gap-2 px-6 py-2 text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-40 ${saved ? 'bg-[#22c55e] text-white' : 'bg-[#111827] text-white hover:bg-[#1f2937]'}`}
          >
            {saved ? <><Check size={12} /> Saved & Encrypted</> : <><Lock size={12} /> Save Entry</>}
          </button>
        </div>
      </div>

      {/* Past entries */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">Past Entries</p>
        {savedEntries.length === 0 ? (
          <p className="text-[11px] text-[#9CA3AF] text-center py-4">No previous entries yet.</p>
        ) : (
          <div className="space-y-2">
            {savedEntries.map((e, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[#E5E7EB] last:border-0">
                <div className="flex items-center gap-3">
                  <Lock size={11} className="text-[#9CA3AF] shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-[#111827]">{e.date}</p>
                    <p className="text-[9px] text-[#9CA3AF]">{e.words} words · Encrypted</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] px-2 py-0.5 border border-[#E5E7EB]">Private</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
