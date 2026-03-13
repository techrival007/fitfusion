import { hostelWellnessData, moodLogHistory } from '../../data/mockData'
import { useAdminAuth } from '../../context/AdminAuthContext'
import SectionHeader from '../../components/SectionHeader'
import InsightCard from '../../components/InsightCard'
import { Shield } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceArea, Cell
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E5E7EB] p-2 text-[10px] font-mono">
      <p className="font-bold mb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color || '#111827' }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</p>)}
    </div>
  )
}

const getMoodColor = (score) => {
  if (score >= 4) return '#22c55e'
  if (score >= 3) return '#84cc16'
  if (score >= 2) return '#f59e0b'
  return '#ef4444'
}

export default function MoodStress() {
  const { user } = useAdminAuth()
  const hostelName = user?.hostelId || 'BH-3'
  const series = hostelWellnessData[hostelName].slice(-30)

  const moodTrend = series.map(d => ({
    date: d.date.slice(5),
    mood: d.moodAvg,
    isExam: d.isExam,
  }))

  const weeklyStress = Array.from({ length: 4 }, (_, wi) => {
    const slice = moodLogHistory.slice(wi * 7, (wi + 1) * 7)
    return {
      week: `W${wi + 1}`,
      low: Math.round(slice.filter(d => d.stressLevel <= 2).length / slice.length * 100),
      moderate: Math.round(slice.filter(d => d.stressLevel === 3).length / slice.length * 100),
      high: Math.round(slice.filter(d => d.stressLevel >= 4).length / slice.length * 100),
    }
  })

  const timeOfDayMood = [
    { time: 'Morning', mood: 3.0 },
    { time: 'Afternoon', mood: 3.4 },
    { time: 'Evening', mood: 3.6 },
    { time: 'Night', mood: 2.8 },
  ]

  const lowMoodDays = moodTrend.filter(d => d.mood < 2.5).length

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{hostelName} · Mental Wellness</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Mood & Stress</h1>
      </div>

      {/* Privacy notice */}
      <div className="border border-[#bfdbfe] bg-[#eff6ff] p-4 flex gap-3">
        <Shield size={16} className="text-[#3b82f6] shrink-0 mt-0.5" />
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#3b82f6] mb-1">Privacy Notice</p>
          <p className="text-[11px] text-[#1e40af] leading-relaxed">
            Mood data shown here is aggregated across your entire hostel. No individual student's mood, energy, or stress scores are visible at any point. Individual journal entries are never accessible to any admin role. Minimum group size enforced: 30 students.
          </p>
        </div>
      </div>

      {/* Mood trend */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="30-Day Mood Trend" subtitle="Hostel average mood score · 1 = very low, 5 = great" />
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={moodTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <ReferenceArea y1={4} y2={5} fill="#f0fdf4" fillOpacity={0.5} />
            <ReferenceArea y1={3} y2={4} fill="#F9FAFB" fillOpacity={0.5} />
            <ReferenceArea y1={1} y2={3} fill="#fef2f2" fillOpacity={0.3} />
            <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} />
            <YAxis domain={[1, 5]} tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={2.5} stroke="#ef4444" strokeDasharray="3 2" strokeWidth={1} />
            <Line type="monotone" dataKey="mood" stroke="#111827" strokeWidth={2} dot={false} name="Avg Mood" />
          </LineChart>
        </ResponsiveContainer>
        {lowMoodDays >= 3 && (
          <div className="mt-4 border border-[#fde68a] bg-[#fffbeb] p-3">
            <p className="text-[11px] text-[#92400e]">Hostel mood has been in the low range for {lowMoodDays} days. Consider organizing a social activity or study break event.</p>
          </div>
        )}
      </div>

      {/* Mood heatmap calendar */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="30-Day Mood Heatmap" subtitle="Cell color = hostel average mood" />
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {moodTrend.map((d, i) => (
            <div
              key={i}
              className="aspect-square flex flex-col items-center justify-center border border-[#E5E7EB] text-[8px] font-bold cursor-default"
              style={{ backgroundColor: getMoodColor(d.mood) + '22', borderColor: getMoodColor(d.mood) + '44' }}
              title={`${d.date}: ${d.mood.toFixed(2)}`}
            >
              <span className="text-[#111827]">{d.date}</span>
              <span style={{ color: getMoodColor(d.mood) }}>{d.mood.toFixed(1)}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-[9px] text-[#9CA3AF]">Low</span>
          {['#ef4444', '#f59e0b', '#84cc16', '#22c55e'].map(c => (
            <div key={c} className="w-4 h-2" style={{ backgroundColor: c + '66' }} />
          ))}
          <span className="text-[9px] text-[#9CA3AF]">High</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Weekly stress distribution */}
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Weekly Stress Distribution" subtitle="% of responses by stress level" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyStress} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="week" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="low" stackId="a" fill="#22c55e" name="Low stress %" />
              <Bar dataKey="moderate" stackId="a" fill="#f59e0b" name="Moderate %" />
              <Bar dataKey="high" stackId="a" fill="#ef4444" name="High stress %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Time of day */}
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Time-of-Day Mood Pattern" subtitle="Aggregate mood by time of day" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={timeOfDayMood} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="time" tick={{ fontSize: 9 }} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 9 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="mood" name="Avg Mood">
                {timeOfDayMood.map((entry, i) => (
                  <Cell key={i} fill={getMoodColor(entry.mood)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <InsightCard insight="Students in your hostel tend to feel lowest in the mornings and at night. Evening is the highest mood period. Consider scheduling wellness activities in the early evening for maximum engagement." />
    </div>
  )
}
