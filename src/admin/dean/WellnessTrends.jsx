import { academicCorrelationData, branchWellnessTrend, hostelCurrentScores } from '../../data/mockData'
import { getWellnessTrends } from '../../api/dean'
import SectionHeader from '../../components/SectionHeader'
import InsightCard from '../../components/InsightCard'
import { useState, useEffect } from 'react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E5E7EB] p-2 text-[10px] font-mono">
      <p className="font-bold mb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color || '#111827' }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>)}
    </div>
  )
}

export default function WellnessTrends() {
  const [apiData, setApiData] = useState(null)
  useEffect(() => { getWellnessTrends({ range: '90d' }).then(setApiData).catch(() => {}) }, [])

  const semesterByWeek = apiData?.semester_trajectory
    ? Array.from({ length: Math.ceil(apiData.semester_trajectory.length / 7) }, (_, wi) => {
        const slice = apiData.semester_trajectory.slice(wi * 7, (wi + 1) * 7)
        const avg = slice.reduce((s, d) => s + d.avg_score, 0) / (slice.length || 1)
        return { week: `W${wi + 1}`, score: Math.round(avg * 10) / 10 }
      })
    : Array.from({ length: 13 }, (_, wi) => {
        const slice = academicCorrelationData.slice(wi * 7, (wi + 1) * 7)
        const avg = slice.reduce((s, d) => s + d.wellnessScore, 0) / (slice.length || 1)
        return { week: `W${wi + 1}`, score: Math.round(avg * 10) / 10 }
      })

  const branchRanking = (apiData?.branch_ranking || branchWellnessTrend)
    .map(b => ({ branch: b.branch, score: b.avg_score ?? b.avgScore }))
    .sort((a, b) => b.score - a.score)

  const yearComparison = apiData?.year_comparison || {}
  const yearData = Object.keys(yearComparison).length
    ? ['year1', 'year2', 'year3', 'year4'].map((yearKey, index) => ({
        year: `${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : index === 2 ? 'rd' : 'th'}`,
        wellness: yearComparison[yearKey]?.wellness ?? 0,
        activity: yearComparison[yearKey]?.activity ?? 0,
        sleep: yearComparison[yearKey]?.sleep ?? 0,
        nutrition: yearComparison[yearKey]?.nutrition ?? 0,
      }))
    : [
        { year: '1st', wellness: 61.2, activity: 38, sleep: 6.2, nutrition: 75, mood: 3.0 },
        { year: '2nd', wellness: 65.8, activity: 42, sleep: 6.6, nutrition: 78, mood: 3.3 },
        { year: '3rd', wellness: 68.4, activity: 45, sleep: 6.8, nutrition: 80, mood: 3.5 },
        { year: '4th', wellness: 64.1, activity: 40, sleep: 6.4, nutrition: 76, mood: 3.1 },
      ]

  const boysAvg = apiData?.gender_comparison?.boys?.wellness ?? hostelCurrentScores.filter(h => h.type === 'boys').reduce((s, h) => s + h.weeklyAvgScore, 0) / 5
  const girlsAvg = apiData?.gender_comparison?.girls?.wellness ?? hostelCurrentScores.filter(h => h.type === 'girls').reduce((s, h) => s + h.weeklyAvgScore, 0) / 5
  const genderCards = [
    {
      label: 'Boys Hostels (BH-1 – BH-5)',
      avg: boysAvg,
      activity: apiData?.gender_comparison?.boys?.activity ?? 38,
      sleep: apiData?.gender_comparison?.boys?.sleep ?? 6.4,
      type: 'boys',
    },
    {
      label: 'Girls Hostels (GH-1 – GH-5)',
      avg: girlsAvg,
      activity: apiData?.gender_comparison?.girls?.activity ?? 42,
      sleep: apiData?.gender_comparison?.girls?.sleep ?? 6.8,
      type: 'girls',
    },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Dean · Trends</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Wellness Trends</h1>
        <p className="text-[11px] text-[#6B7280]">Long-term strategic view — semester-on-semester patterns</p>
      </div>

      {/* Semester trajectory */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Semester Wellness Trajectory" subtitle="Campus average score week-by-week" />
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={semesterByWeek} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" />
            <XAxis dataKey="week" tick={{ fontSize: 9 }} />
            <YAxis domain={[40, 90]} tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={60} stroke="#E5E7EB" strokeDasharray="4 2" />
            <ReferenceLine x="W5" stroke="#fecaca" strokeDasharray="3 2" label={{ value: 'Exam 1', fontSize: 8, fill: '#ef4444' }} />
            <ReferenceLine x="W11" stroke="#fecaca" strokeDasharray="3 2" label={{ value: 'Exam 2', fontSize: 8, fill: '#ef4444' }} />
            <Line type="monotone" dataKey="score" stroke="#111827" strokeWidth={2.5} dot={{ fill: '#111827', r: 3 }} name="Campus Avg" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Branch ranking */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Branch-Wise Wellness Ranking" subtitle="Semester average — sorted descending" />
        <div className="space-y-2">
          {branchRanking.map((b, i) => (
            <div key={b.branch} className="flex items-center gap-3">
              <span className="text-[9px] font-bold text-[#9CA3AF] w-4 shrink-0">0{i + 1}</span>
              <span className="text-[11px] font-bold text-[#111827] w-20 shrink-0">{b.branch}</span>
              <div className="flex-1 h-2 bg-[#F3F4F6] border border-[#E5E7EB]">
                <div
                  className="h-full"
                  style={{ width: `${(b.score / 100) * 100}%`, backgroundColor: i < 3 ? '#22c55e' : i < 5 ? '#111827' : '#f59e0b' }}
                />
              </div>
              <span className="text-[11px] font-bold w-10 text-right" style={{ color: i < 3 ? '#22c55e' : i < 5 ? '#111827' : '#f59e0b' }}>{b.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Academic year comparison */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Academic Year Comparison" subtitle="Key wellness metrics by year group" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={yearData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="year" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="wellness" fill="#111827" name="Wellness Score" />
            <Bar dataKey="activity" fill="#6B7280" name="Avg Activity (min)" />
            <Bar dataKey="nutrition" fill="#9CA3AF" name="Nutrition %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gender comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {genderCards.map(g => (
          <div key={g.type} className="bg-white border border-[#E5E7EB] p-5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">{g.label}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[{ label: 'Wellness', value: g.avg.toFixed(1) }, { label: 'Activity', value: `${g.activity} min` }, { label: 'Sleep', value: `${g.sleep} hrs` }].map(m => (
                <div key={m.label}>
                  <p className="text-[9px] text-[#9CA3AF]">{m.label}</p>
                  <p className="text-[16px] font-bold text-[#111827]">{m.value}</p>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-[#9CA3AF] mt-3">Differences reflect aggregate patterns, not individual behavior</p>
          </div>
        ))}
      </div>

      {/* Longitudinal insight */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Longitudinal Insight</p>
        <p className="text-[13px] font-bold text-[#111827] leading-relaxed">
          This semester, campus wellness peaked in week 3 (score: {semesterByWeek[2]?.score}) and hit its lowest point in week 10 (exam week, score: {semesterByWeek[9]?.score}). Sleep is the metric most strongly correlated with overall wellness in this campus (correlation: 0.73). 1st-year students consistently score 7+ points below 3rd-year students.
        </p>
      </div>

      <InsightCard insight="Mathematics and Chemical branches show surprisingly strong wellness scores despite high academic loads. This may correlate with smaller batch sizes enabling better peer support networks within their hostel groups." />
    </div>
  )
}
