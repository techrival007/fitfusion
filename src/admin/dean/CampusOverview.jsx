import { campusKPIs, hostelCurrentScores, campusWeeklyTrend, adminAlerts, getWellnessLabel, HOSTELS } from '../../data/mockData'
import KPICard from '../../components/KPICard'
import AlertCard from '../../components/AlertCard'
import InsightCard from '../../components/InsightCard'
import SectionHeader from '../../components/SectionHeader'
import { useState } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine
} from 'recharts'

const HOSTEL_COLORS = {
  'BH-1': '#111827', 'BH-2': '#374151', 'BH-3': '#4B5563', 'BH-4': '#6B7280', 'BH-5': '#9CA3AF',
  'GH-1': '#1D4ED8', 'GH-2': '#2563EB', 'GH-3': '#3B82F6', 'GH-4': '#60A5FA', 'GH-5': '#93C5FD',
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E5E7EB] p-2 text-[10px] font-mono shadow-sm max-w-[200px]">
      <p className="font-bold mb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>)}
    </div>
  )
}

export default function CampusOverview() {
  const [hoveredHostel, setHoveredHostel] = useState(null)
  const activeAlerts = adminAlerts.filter(a => a.isActive).slice(0, 3)

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Dean · Campus Intelligence</p>
          <h1 className="text-[20px] font-bold text-[#111827]">Campus Wellness</h1>
          <p className="text-[11px] text-[#6B7280]">All hostels · All branches · {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="text-right border border-[#E5E7EB] px-4 py-2 bg-white">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Data Updated</p>
          <p className="text-[12px] font-bold text-[#111827]">4 minutes ago</p>
        </div>
      </div>

      {/* 6 KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Students Active Today" value={`${campusKPIs.studentsActive} / ${campusKPIs.studentsTotal}`} subtext={`${((campusKPIs.studentsActive / campusKPIs.studentsTotal) * 100).toFixed(1)}% logged today`} />
        <KPICard label="Campus Wellness Score" value={campusKPIs.campusWellnessScore} subtext={getWellnessLabel(campusKPIs.campusWellnessScore).label} statusColor={getWellnessLabel(campusKPIs.campusWellnessScore).color} trend={campusKPIs.wellnessTrend} trendLabel="+2.1 vs last week" />
        <KPICard label="Needs Attention" value={campusKPIs.needsAttentionCount} subtext="students in low band this week" statusColor="#ef4444" badge="COUNT ONLY" />
        <KPICard label="Avg Daily Activity" value={`${campusKPIs.avgDailyActivity} min`} subtext={`vs ${campusKPIs.activityTarget} min target`} statusColor={campusKPIs.avgDailyActivity < campusKPIs.activityTarget ? '#f59e0b' : '#22c55e'} />
        <KPICard label="Average Sleep" value={`${campusKPIs.avgSleep} hrs`} subtext={`vs ${campusKPIs.sleepTarget} hrs target`} statusColor={campusKPIs.avgSleep < 6.5 ? '#ef4444' : campusKPIs.avgSleep < 7 ? '#f59e0b' : '#22c55e'} />
        <KPICard label="Campus Mood Index" value={`${campusKPIs.campusMoodIndex} / 5`} subtext="Neutral-Good range" />
      </div>

      {/* Hostel heatmap */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Hostel Wellness Heatmap" subtitle="Current week average score · click for details" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Boys Hostels</p>
            <div className="space-y-2">
              {hostelCurrentScores.filter(h => h.type === 'boys').map(h => {
                const label = getWellnessLabel(h.weeklyAvgScore)
                return (
                  <div
                    key={h.name}
                    className="flex items-center gap-3 p-3 border border-[#E5E7EB] cursor-pointer hover:border-[#111827] transition-all group"
                    onMouseEnter={() => setHoveredHostel(h.name)}
                    onMouseLeave={() => setHoveredHostel(null)}
                    style={{ backgroundColor: label.bg + '80' }}
                  >
                    <span className="text-[10px] font-bold text-[#9CA3AF] w-10 shrink-0">{h.name}</span>
                    <div className="flex-1 h-1.5 bg-[#F3F4F6] border border-[#E5E7EB]">
                      <div className="h-full" style={{ width: `${h.weeklyAvgScore}%`, backgroundColor: label.color }} />
                    </div>
                    <span className="text-[12px] font-bold w-10 text-right" style={{ color: label.color }}>{h.weeklyAvgScore}</span>
                    <span className="text-[9px]" style={{ color: h.trend > 0 ? '#22c55e' : '#ef4444' }}>{h.trend > 0 ? '↑' : '↓'}</span>
                    {h.alerts > 0 && <span className="w-4 h-4 bg-[#ef4444] text-white text-[8px] font-bold flex items-center justify-center rounded-full shrink-0">{h.alerts}</span>}
                  </div>
                )
              })}
            </div>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Girls Hostels</p>
            <div className="space-y-2">
              {hostelCurrentScores.filter(h => h.type === 'girls').map(h => {
                const label = getWellnessLabel(h.weeklyAvgScore)
                return (
                  <div
                    key={h.name}
                    className="flex items-center gap-3 p-3 border border-[#E5E7EB] cursor-pointer hover:border-[#111827] transition-all"
                    onMouseEnter={() => setHoveredHostel(h.name)}
                    onMouseLeave={() => setHoveredHostel(null)}
                    style={{ backgroundColor: label.bg + '80' }}
                  >
                    <span className="text-[10px] font-bold text-[#9CA3AF] w-10 shrink-0">{h.name}</span>
                    <div className="flex-1 h-1.5 bg-[#F3F4F6] border border-[#E5E7EB]">
                      <div className="h-full" style={{ width: `${h.weeklyAvgScore}%`, backgroundColor: label.color }} />
                    </div>
                    <span className="text-[12px] font-bold w-10 text-right" style={{ color: label.color }}>{h.weeklyAvgScore}</span>
                    <span className="text-[9px]" style={{ color: h.trend > 0 ? '#22c55e' : '#ef4444' }}>{h.trend > 0 ? '↑' : '↓'}</span>
                    {h.alerts > 0 && <span className="w-4 h-4 bg-[#ef4444] text-white text-[8px] font-bold flex items-center justify-center rounded-full shrink-0">{h.alerts}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 7-week trend */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="7-Week Campus Trend" subtitle="Wellness score per hostel over time" />
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={campusWeeklyTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="week" tick={{ fontSize: 9 }} />
            <YAxis domain={[40, 90]} tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={60} stroke="#E5E7EB" strokeDasharray="4 2" />
            {HOSTELS.map(h => (
              <Line
                key={h.name}
                type="monotone"
                dataKey={h.name}
                stroke={HOSTEL_COLORS[h.name]}
                strokeWidth={hoveredHostel === h.name ? 2.5 : 1}
                dot={false}
                opacity={hoveredHostel && hoveredHostel !== h.name ? 0.2 : 1}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 mt-2">
          {HOSTELS.map(h => (
            <div key={h.name} className="flex items-center gap-1">
              <div className="w-3 h-0.5" style={{ backgroundColor: HOSTEL_COLORS[h.name] }} />
              <span className="text-[9px] text-[#6B7280]">{h.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top alerts */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Top Active Alerts" />
          <span className="text-[10px] font-bold text-[#111827] hover:underline cursor-pointer">View all alerts →</span>
        </div>
        <div className="space-y-3">
          {activeAlerts.map(a => <AlertCard key={a.id} alert={a} />)}
        </div>
      </div>

      <InsightCard insight="Campus wellness peaked in Week 3 (score: 71.2) and hit its lowest point during exam weeks. Sleep is the metric most strongly correlated with overall wellness on this campus. GH-2 has the most active alert and warrants attention." />
    </div>
  )
}
