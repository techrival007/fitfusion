import { useAdminAuth } from '../../context/AdminAuthContext'
import { getActivityReport, environmentalData } from '../../data/mockData'
import { getWardenActivity } from '../../api/warden'
import InsightCard from '../../components/InsightCard'
import SectionHeader from '../../components/SectionHeader'
import { useState, useEffect } from 'react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  BarChart, Bar, ComposedChart, Area, Legend
} from 'recharts'

const ACTIVITY_COLORS = { Running: '#111827', Gym: '#374151', Sports: '#6B7280', Yoga: '#9CA3AF', Cycling: '#D1D5DB', Walking: '#E5E7EB' }

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E5E7EB] p-2 text-[10px] font-mono shadow-sm">
      <p className="font-bold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color || '#111827' }}>{p.name || p.dataKey}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</p>
      ))}
    </div>
  )
}

export default function ActivityReport() {
  const { user } = useAdminAuth()
  const hostelName = user?.hostel_id || user?.hostelId || 'BH-3'
  const [range, setRange] = useState('28')
  const [data, setData] = useState(() => getActivityReport(hostelName, 28))

  useEffect(() => {
    const rangeMap = { '7': '7d', '14': '14d', '28': '30d' }
    getWardenActivity({ range: rangeMap[range] || '30d' }).then(api => {
      const daily = (api.daily_trend || []).map(d => ({
        date: d.date,
        avgMinutes: d.avg_minutes,
        participation: d.participation_pct,
      }))
      if (daily.length > 0) {
        setData(prev => ({
          ...prev,
          dailyTrend: daily,
          weeklyAQI: (api.indoor_outdoor || prev.weeklyAQI || []).map((item, index) => ({
            week: item.week ? `W${index + 1}` : `W${index + 1}`,
            indoor: item.indoor_min ?? item.indoor,
            outdoor: item.outdoor_min ?? item.outdoor,
            aqi: item.avg_aqi ?? item.aqi,
          })),
        }))
      }
    }).catch(() => {})
  }, [range])

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{hostelName} · Activity</p>
          <h1 className="text-[20px] font-bold text-[#111827]">Activity Report</h1>
        </div>
        <div className="flex gap-1">
          {[['7', '7D'], ['14', '14D'], ['28', '28D'], ['90', '90D']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setRange(v)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${range === v ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#111827]'}`}
            >{l}</button>
          ))}
        </div>
      </div>

      {/* Daily trend */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Daily Active Minutes" subtitle="Hostel average · dashed line = 45 min WHO recommendation" />
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data.dailyTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} interval={Math.floor(data.dailyTrend.length / 6)} />
            <YAxis yAxisId={0} tick={{ fontSize: 9 }} domain={[0, 80]} />
            <YAxis yAxisId={1} orientation="right" tick={{ fontSize: 9 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine yAxisId={0} y={45} stroke="#E5E7EB" strokeDasharray="4 2" label={{ value: '45min', position: 'right', fontSize: 9, fill: '#9CA3AF' }} />
            <Area yAxisId={0} type="monotone" dataKey="avgMinutes" fill="#F3F4F6" stroke="#111827" strokeWidth={2} dot={false} fillOpacity={0.6} />
            <Line yAxisId={1} type="monotone" dataKey="participation" stroke="#9CA3AF" strokeWidth={1.5} dot={false} strokeDasharray="3 2" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Activity type breakdown */}
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Activity Type Breakdown" subtitle="Weekly — stacked by type" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.activityTypeBreakdown} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="week" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip content={<CustomTooltip />} />
              {Object.keys(ACTIVITY_COLORS).map(key => (
                <Bar key={key} dataKey={key} stackId="a" fill={ACTIVITY_COLORS[key]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Indoor vs Outdoor */}
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Indoor vs Outdoor Activity" subtitle="Weekly split with AQI overlay" />
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={data.weeklyAQI} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="week" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} yAxisId={0} />
              <YAxis tick={{ fontSize: 9 }} yAxisId={1} orientation="right" domain={[0, 300]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="indoor" fill="#111827" yAxisId={0} name="Indoor min" />
              <Bar dataKey="outdoor" fill="#D1D5DB" yAxisId={0} name="Outdoor min" />
              <Line type="monotone" dataKey="aqi" stroke="#ef4444" strokeWidth={1.5} yAxisId={1} dot={false} name="AQI" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Participation trend */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Daily Participation Rate" subtitle="% of hostel who logged activity each day · target 50%" />
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data.dailyTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} interval={Math.floor(data.dailyTrend.length / 6)} />
            <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip />} formatter={(v) => `${v}%`} />
            <ReferenceLine y={50} stroke="#E5E7EB" strokeDasharray="4 2" label={{ value: '50%', position: 'right', fontSize: 9, fill: '#9CA3AF' }} />
            <Line type="monotone" dataKey="participation" stroke="#111827" strokeWidth={2} dot={false} name="Participation %" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <InsightCard insight="Outdoor activity fell 40% during the AQI spike period. Activity in your hostel is 11% above campus average this month — driven by strong gym participation mid-week." />
    </div>
  )
}
