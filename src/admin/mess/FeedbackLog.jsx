import { mealRatingsData, feedbackTags } from '../../data/mockData'
import SectionHeader from '../../components/SectionHeader'
import InsightCard from '../../components/InsightCard'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, ReferenceLine } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E5E7EB] p-2 text-[10px] font-mono">
      <p className="font-bold mb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color || '#111827' }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</p>)}
    </div>
  )
}

export default function FeedbackLog() {
  const positiveTags = feedbackTags.filter(t => t.type === 'positive')
  const negativeTags = feedbackTags.filter(t => t.type === 'negative')
  const posTotal = positiveTags.reduce((s, t) => s + t.count, 0)
  const negTotal = negativeTags.reduce((s, t) => s + t.count, 0)

  const weeklyRatio = Array.from({ length: 12 }, (_, i) => ({
    week: `W${i + 1}`,
    positive: Math.round((posTotal / (posTotal + negTotal)) * 100 + (Math.random() - 0.5) * 8),
    negative: Math.round((negTotal / (posTotal + negTotal)) * 100 + (Math.random() - 0.5) * 8),
  }))

  const negativeSorted = [...negativeTags].sort((a, b) => b.count - a.count)

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Mess · Feedback</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Feedback Log</h1>
      </div>

      {/* Summary table */}
      <div className="bg-white border border-[#E5E7EB]">
        <div className="p-5 pb-3">
          <SectionHeader title="Aggregated Feedback Summary" subtitle="Last 30 days · No individual student attribution" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA]">
                {['Date', 'Meal', 'Avg Rating', '# Ratings', 'Positive Tags', 'Negative Tags'].map(h => (
                  <th key={h} className="text-left py-2 px-5 text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mealRatingsData.slice(-14).reverse().flatMap(d =>
                ['breakfast', 'lunch', 'snacks', 'dinner'].map(m => ({
                  date: d.date,
                  meal: m.charAt(0).toUpperCase() + m.slice(1),
                  rating: d[m].rating,
                  count: d[m].count,
                  pos: d[m].rating >= 3.5 ? 'Tasty, Good' : d[m].rating >= 3 ? 'Okay' : '',
                  neg: d[m].rating < 3 ? 'Bland, Cold' : d[m].rating < 3.5 ? 'No variety' : '',
                }))
              ).slice(0, 24).map((r, i) => (
                <tr key={i} className="border-b border-[#E5E7EB] last:border-0">
                  <td className="py-2.5 px-5 text-[#6B7280]">{r.date}</td>
                  <td className="py-2.5 px-5 font-bold text-[#111827]">{r.meal}</td>
                  <td className="py-2.5 px-5 font-bold" style={{ color: r.rating >= 4 ? '#22c55e' : r.rating >= 2.5 ? '#111827' : '#ef4444' }}>
                    {r.rating.toFixed(1)} ★
                  </td>
                  <td className="py-2.5 px-5 text-[#6B7280]">{r.count.toLocaleString()}</td>
                  <td className="py-2.5 px-5 text-[#22c55e] text-[10px]">{r.pos}</td>
                  <td className="py-2.5 px-5 text-[#ef4444] text-[10px]">{r.neg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Positive vs Negative trend */}
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Feedback Sentiment Trend" subtitle="Positive vs negative tag ratio — 12 weeks" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyRatio} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="week" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} formatter={v => `${v}%`} />
              <Line type="monotone" dataKey="positive" stroke="#22c55e" strokeWidth={2} dot={false} name="Positive %" />
              <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} dot={false} name="Negative %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Common complaints */}
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Common Complaints" subtitle="Frequency of negative feedback tags" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={negativeSorted} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 40 }}>
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis dataKey="tag" type="category" tick={{ fontSize: 9 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" fill="#ef4444" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <InsightCard insight="'Bland' is the most common complaint (680 occurrences), followed by 'Cold' (520). Dinner consistently gets lower satisfaction scores than lunch. Consider reviewing seasoning and serving temperature procedures for dinner service." />
    </div>
  )
}
