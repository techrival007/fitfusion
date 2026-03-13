import { hostelCurrentScores, hostelWellnessData, HOSTELS } from '../../data/mockData'
import SectionHeader from '../../components/SectionHeader'
import InsightCard from '../../components/InsightCard'
import { useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell
} from 'recharts'

const METRICS = ['Wellness Score', 'Activity', 'Nutrition', 'Sleep', 'Mood', 'Stress Level']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E5E7EB] p-2 text-[10px] font-mono">
      <p className="font-bold mb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color || '#111827' }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>)}
    </div>
  )
}

export default function HostelComparison() {
  const [metric, setMetric] = useState('Wellness Score')
  const [selectedHostels, setSelectedHostels] = useState(['BH-1', 'GH-1', 'BH-3'])

  const barData = [...hostelCurrentScores]
    .sort((a, b) => b.weeklyAvgScore - a.weeklyAvgScore)
    .map((h, i) => ({
      name: h.name,
      value: h.weeklyAvgScore,
      colorGroup: i < 3 ? '#22c55e' : i < 7 ? '#9CA3AF' : '#f59e0b',
    }))

  const campusAvg = barData.reduce((s, d) => s + d.value, 0) / barData.length

  const radarData = METRICS.slice(0, 5).map(m => {
    const entry = { metric: m.split(' ')[0] }
    selectedHostels.forEach(name => {
      const series = hostelWellnessData[name]?.slice(-7) || []
      if (m === 'Wellness Score') entry[name] = series.reduce((s, d) => s + d.wellnessScore, 0) / (series.length || 1)
      else if (m === 'Activity') entry[name] = series.reduce((s, d) => s + (d.activityMin / 45) * 100, 0) / (series.length || 1)
      else if (m === 'Nutrition') entry[name] = 80
      else if (m === 'Sleep') entry[name] = series.reduce((s, d) => s + (d.sleepHours / 9) * 100, 0) / (series.length || 1)
      else entry[name] = 65
    })
    return entry
  })

  const RADAR_COLORS = ['#111827', '#6B7280', '#9CA3AF']

  const yearData = [
    { year: '1st Year', wellness: 61, activity: 38, sleep: 6.2, nutrition: 75 },
    { year: '2nd Year', wellness: 65, activity: 42, sleep: 6.6, nutrition: 78 },
    { year: '3rd Year', wellness: 68, activity: 45, sleep: 6.8, nutrition: 80 },
    { year: '4th Year', wellness: 64, activity: 40, sleep: 6.4, nutrition: 76 },
  ]

  const boysAvg = hostelCurrentScores.filter(h => h.type === 'boys').reduce((s, h) => s + h.weeklyAvgScore, 0) / 5
  const girlsAvg = hostelCurrentScores.filter(h => h.type === 'girls').reduce((s, h) => s + h.weeklyAvgScore, 0) / 5

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Dean · Comparison</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Hostel Comparison</h1>
      </div>

      {/* Metric selector */}
      <div className="flex gap-2 flex-wrap">
        {METRICS.map(m => (
          <button key={m} onClick={() => setMetric(m)} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${metric === m ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#111827]'}`}>{m}</button>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title={`${metric} — All Hostels`} subtitle="Sorted descending · green top 3, amber bottom 3" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis domain={[40, 90]} tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={campusAvg} stroke="#9CA3AF" strokeDasharray="4 2" label={{ value: 'Campus Avg', position: 'right', fontSize: 9, fill: '#9CA3AF' }} />
            <Bar dataKey="value" name={metric}>
              {barData.map((entry, i) => <Cell key={i} fill={entry.colorGroup} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Radar chart */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <div className="flex items-start justify-between mb-4">
          <SectionHeader title="Multi-Dimensional Radar" subtitle="Select up to 3 hostels to compare" />
          <div className="flex flex-wrap gap-2 max-w-xs">
            {HOSTELS.map(h => (
              <button
                key={h.name}
                onClick={() => setSelectedHostels(prev =>
                  prev.includes(h.name) ? prev.filter(x => x !== h.name) : prev.length < 3 ? [...prev, h.name] : prev
                )}
                className={`px-2 py-1 text-[9px] font-bold border transition-all ${selectedHostels.includes(h.name) ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6B7280] border-[#E5E7EB]'}`}
              >{h.name}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9 }} />
            {selectedHostels.map((name, i) => (
              <Radar key={name} dataKey={name} stroke={RADAR_COLORS[i]} fill={RADAR_COLORS[i]} fillOpacity={0.15} strokeWidth={1.5} name={name} />
            ))}
          </RadarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 justify-center mt-2">
          {selectedHostels.map((name, i) => (
            <div key={name} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5" style={{ backgroundColor: RADAR_COLORS[i] }} />
              <span className="text-[9px] text-[#6B7280]">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Academic year breakdown */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Academic Year Breakdown" subtitle="Wellness metrics by year group" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={yearData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="year" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="wellness" fill="#111827" name="Wellness Score" />
            <Bar dataKey="activity" fill="#6B7280" name="Activity (min)" />
            <Bar dataKey="nutrition" fill="#9CA3AF" name="Nutrition %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Boys vs Girls summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[{ label: 'Boys Hostels (BH-1 to BH-5)', avg: boysAvg, type: 'boys' }, { label: 'Girls Hostels (GH-1 to GH-5)', avg: girlsAvg, type: 'girls' }].map(g => (
          <div key={g.type} className="bg-white border border-[#E5E7EB] p-5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">{g.label}</p>
            <p className="text-[24px] font-bold text-[#111827]">{g.avg.toFixed(1)}</p>
            <p className="text-[10px] text-[#6B7280]">Average wellness score this week</p>
            <p className="text-[9px] text-[#9CA3AF] mt-3">Differences reflect aggregate patterns, not individual behavior</p>
          </div>
        ))}
      </div>

      <InsightCard insight="1st year students show consistently lower wellness scores than 4th year students, driven primarily by lower sleep hours (6.2 vs 6.8 avg). CSE and ECE hostels show the steepest exam-week wellness drops campus-wide." />
    </div>
  )
}
