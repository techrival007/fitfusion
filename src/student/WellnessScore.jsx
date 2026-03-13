import { studentWellnessHistory, getWellnessLabel, anonymousLeaderboard } from '../data/mockData'
import { useStudentAuth } from '../context/StudentAuthContext'
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, BarChart, Bar } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E5E7EB] p-2 text-[10px] font-mono">
      <p className="font-bold mb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color || '#111827' }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>)}
    </div>
  )
}

export default function WellnessScore() {
  const { user } = useStudentAuth()
  const today = studentWellnessHistory[studentWellnessHistory.length - 1]
  const wellnessLabel = getWellnessLabel(today.wellnessScore)
  const last30 = studentWellnessHistory.map(d => ({ date: d.date.slice(5), score: d.wellnessScore, activity: d.activityMin, sleep: d.sleep, mood: d.mood }))

  const myHostel = anonymousLeaderboard.find(l => l.hostelName === user?.hostel)
  const myRank = anonymousLeaderboard.findIndex(l => l.hostelName === user?.hostel) + 1

  return (
    <div className="p-6 space-y-5">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">My Wellness</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Wellness Score</h1>
      </div>

      {/* Score gauge */}
      <div className="bg-white border border-[#E5E7EB] p-6 relative overflow-hidden">
        <div className="absolute right-4 top-4 opacity-[0.05] pointer-events-none">
          <svg width="120" height="120" viewBox="0 0 200 200">
            {[20,40,60,80,100].map(r => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#111827" strokeWidth="0.6" />)}
            <line x1="100" y1="0" x2="100" y2="200" stroke="#111827" strokeWidth="0.4" />
            <line x1="0" y1="100" x2="200" y2="100" stroke="#111827" strokeWidth="0.4" />
          </svg>
        </div>
        <div className="flex items-center gap-8">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">Today's Score</p>
            <p className="text-[56px] font-bold leading-none" style={{ color: wellnessLabel.color }}>{today.wellnessScore}</p>
            <p className="text-[13px] font-bold mt-1" style={{ color: wellnessLabel.color }}>{wellnessLabel.label}</p>
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Score Breakdown</p>
            <div className="space-y-2">
              {[
                { label: 'Activity', score: Math.min(100, (today.activityMin / 45) * 100), weight: '35%' },
                { label: 'Nutrition', score: Math.min(100, (today.calories / 2000) * 100), weight: '30%' },
                { label: 'Mood', score: (today.mood / 5) * 100, weight: '20%' },
                { label: 'Env Stress', score: 100 - Math.min(100, ((180 - 50) / 2.5)), weight: '15%' },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-[#9CA3AF] w-16">{c.label}</span>
                  <div className="flex-1 h-1.5 bg-[#F3F4F6] border border-[#E5E7EB]">
                    <div className="h-full" style={{ width: `${Math.max(0, c.score)}%`, backgroundColor: wellnessLabel.color }} />
                  </div>
                  <span className="text-[9px] text-[#9CA3AF] w-10 text-right">{Math.round(c.score)}</span>
                  <span className="text-[9px] font-bold text-[#9CA3AF] w-8 text-right">×{c.weight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#E5E7EB] text-[10px] text-[#6B7280]">
          <span className="font-bold text-[#111827]">Formula:</span> (Activity × 0.35) + (Nutrition × 0.30) − (Env Stress × 0.15) − (Mood Deviation × 0.20)
        </div>
      </div>

      {/* 30-day trend */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">30-Day Wellness Trend</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={last30} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="date" tick={{ fontSize: 8 }} interval={6} />
            <YAxis domain={[20, 100]} tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={60} stroke="#E5E7EB" strokeDasharray="4 2" />
            <Area type="monotone" dataKey="score" stroke={wellnessLabel.color} fill={wellnessLabel.color} fillOpacity={0.1} strokeWidth={2} dot={false} name="Wellness Score" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Daily metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Activity (min)', key: 'activity', color: '#111827', domain: [0, 80] },
          { label: 'Sleep (hrs)', key: 'sleep', color: '#6B7280', domain: [4, 10] },
          { label: 'Mood (1-5)', key: 'mood', color: '#9CA3AF', domain: [1, 5] },
        ].map(m => (
          <div key={m.key} className="bg-white border border-[#E5E7EB] p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">{m.label}</p>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={last30.slice(-14)} margin={{ top: 2, right: 0, bottom: 0, left: -30 }}>
                <XAxis hide />
                <YAxis domain={m.domain} tick={{ fontSize: 8 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>

      {/* Anonymous leaderboard */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">Anonymous Hostel Leaderboard</p>
        <p className="text-[10px] text-[#9CA3AF] mb-3">No individual data visible — hostel aggregates only</p>
        <div className="space-y-2">
          {anonymousLeaderboard.map((h, i) => (
            <div
              key={h.hostelName}
              className={`flex items-center gap-3 p-2 border transition-all ${h.hostelName === user?.hostel ? 'border-[#111827] bg-[#FAFAFA]' : 'border-[#E5E7EB]'}`}
            >
              <span className={`text-[10px] font-bold w-5 ${i < 3 ? 'text-[#22c55e]' : 'text-[#9CA3AF]'}`}>{i + 1}</span>
              <span className="text-[11px] font-bold text-[#111827] w-12">{h.hostelName}</span>
              <div className="flex-1 h-1.5 bg-[#F3F4F6] border border-[#E5E7EB]">
                <div className="h-full bg-[#111827]" style={{ width: `${(h.avgScore / 100) * 100}%` }} />
              </div>
              <span className="text-[11px] font-bold text-[#111827] w-10 text-right">{h.avgScore}</span>
              {h.hostelName === user?.hostel && <span className="text-[9px] text-[#9CA3AF]">← You</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
