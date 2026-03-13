import { useState } from 'react'
import { Check } from 'lucide-react'

const MOODS = [
  { score: 5, emoji: '😄', label: 'Great', color: '#22c55e' },
  { score: 4, emoji: '🙂', label: 'Good', color: '#84cc16' },
  { score: 3, emoji: '😐', label: 'Neutral', color: '#f59e0b' },
  { score: 2, emoji: '😔', label: 'Low', color: '#f97316' },
  { score: 1, emoji: '😞', label: 'Very Low', color: '#ef4444' },
]

const TIMES = ['Morning', 'Afternoon', 'Evening', 'Night']

export default function MoodLog() {
  const [mood, setMood] = useState(null)
  const [timeOfDay, setTimeOfDay] = useState('Evening')
  const [energy, setEnergy] = useState(3)
  const [stress, setStress] = useState(2)
  const [sleepTime, setSleepTime] = useState('23:00')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [quality, setQuality] = useState(4)
  const [showBreathing, setShowBreathing] = useState(false)
  const [saved, setSaved] = useState(false)

  const sleepHours = (() => {
    const [sh, sm] = sleepTime.split(':').map(Number)
    const [wh, wm] = wakeTime.split(':').map(Number)
    let hours = wh + wm / 60 - (sh + sm / 60)
    if (hours < 0) hours += 24
    return Math.round(hours * 10) / 10
  })()

  const handleSave = () => {
    if (mood && mood.score <= 2) setShowBreathing(true)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Daily Log · Mood & Sleep</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Mood & Sleep Log</h1>
      </div>

      {/* Breathing exercise suggestion */}
      {showBreathing && (
        <div className="border border-[#bfdbfe] bg-[#eff6ff] p-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#3b82f6] mb-1">Personalized Suggestion</p>
          <p className="text-[12px] font-bold text-[#1e40af] mb-1">Your mood is in the low range today.</p>
          <p className="text-[11px] text-[#1e40af] mb-3">Take 2 minutes for a breathing exercise — it can meaningfully shift your energy.</p>
          <div className="bg-white border border-[#bfdbfe] p-4 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#3b82f6] mb-2">4-7-8 Breathing</p>
            <p className="text-[11px] text-[#374151]">Inhale for 4s → Hold for 7s → Exhale for 8s</p>
            <p className="text-[11px] text-[#374151]">Repeat 3–4 times</p>
            <div className="mt-3 w-16 h-16 border-2 border-[#3b82f6] rounded-full mx-auto flex items-center justify-center">
              <span className="text-[24px]">🌬️</span>
            </div>
          </div>
          <button onClick={() => setShowBreathing(false)} className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#3b82f6] hover:underline">Dismiss</button>
        </div>
      )}

      {/* Mood selector */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">How are you feeling?</p>
        <div className="grid grid-cols-5 gap-2">
          {MOODS.map(m => (
            <button
              key={m.score}
              onClick={() => setMood(m)}
              className={`flex flex-col items-center gap-1.5 py-4 border transition-all ${mood?.score === m.score ? 'border-[#111827]' : 'border-[#E5E7EB] hover:border-[#111827]'}`}
              style={{ backgroundColor: mood?.score === m.score ? m.color + '18' : undefined }}
            >
              <span className="text-[28px]">{m.emoji}</span>
              <span className="text-[10px] font-bold" style={{ color: mood?.score === m.score ? m.color : '#9CA3AF' }}>{m.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#E5E7EB]">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Time of Day</p>
            <div className="flex gap-1 flex-wrap">
              {TIMES.map(t => (
                <button key={t} onClick={() => setTimeOfDay(t)} className={`px-2 py-1 text-[10px] font-bold border transition-all ${timeOfDay === t ? 'bg-[#111827] text-white border-[#111827]' : 'border-[#E5E7EB] text-[#6B7280]'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Energy</p>
                <span className="text-[10px] font-bold text-[#111827]">{energy}/5</span>
              </div>
              <input type="range" min="1" max="5" value={energy} onChange={e => setEnergy(parseInt(e.target.value))} className="w-full accent-[#111827]" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Stress</p>
                <span className="text-[10px] font-bold text-[#111827]">{stress}/5</span>
              </div>
              <input type="range" min="1" max="5" value={stress} onChange={e => setStress(parseInt(e.target.value))} className="w-full accent-[#111827]" />
            </div>
          </div>
        </div>
      </div>

      {/* Sleep log */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-4">Last Night's Sleep</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">Bedtime</label>
            <input type="time" value={sleepTime} onChange={e => setSleepTime(e.target.value)} className="w-full border border-[#E5E7EB] px-3 py-2 text-[12px] focus:outline-none focus:border-[#111827] font-mono bg-[#FAFAFA]" />
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">Wake Time</label>
            <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)} className="w-full border border-[#E5E7EB] px-3 py-2 text-[12px] focus:outline-none focus:border-[#111827] font-mono bg-[#FAFAFA]" />
          </div>
        </div>

        <div className={`text-center p-4 border ${sleepHours >= 7 ? 'border-[#bbf7d0] bg-[#f0fdf4]' : sleepHours >= 6 ? 'border-[#fde68a] bg-[#fffbeb]' : 'border-[#fecaca] bg-[#fef2f2]'}`}>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">Sleep Duration</p>
          <p className={`text-[28px] font-bold ${sleepHours >= 7 ? 'text-[#22c55e]' : sleepHours >= 6 ? 'text-[#f59e0b]' : 'text-[#ef4444]'}`}>{sleepHours} hrs</p>
          <p className="text-[10px] text-[#6B7280]">{sleepHours >= 7 ? 'Well rested!' : sleepHours >= 6 ? 'Slightly below target' : 'Below recommended 7 hrs'}</p>
        </div>

        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Sleep Quality</p>
            <span className="text-[10px] font-bold text-[#111827]">{quality}/5</span>
          </div>
          <input type="range" min="1" max="5" value={quality} onChange={e => setQuality(parseInt(e.target.value))} className="w-full accent-[#111827]" />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!mood}
        className={`w-full py-3 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${saved ? 'bg-[#22c55e] text-white' : 'bg-[#111827] text-white hover:bg-[#1f2937]'}`}
      >
        {saved ? <><Check size={13} /> Saved</> : 'Save Mood & Sleep Log'}
      </button>
    </div>
  )
}
