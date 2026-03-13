import { environmentalData, academicCorrelationData } from '../../data/mockData'
import SectionHeader from '../../components/SectionHeader'
import InsightCard from '../../components/InsightCard'
import {
  ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, Tooltip, ReferenceLine, BarChart, Bar, Cell
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

const getAQIBg = (aqi) => {
  if (aqi <= 50) return '#f0fdf4'
  if (aqi <= 100) return '#f7fee7'
  if (aqi <= 200) return '#fefce8'
  if (aqi <= 300) return '#fff7ed'
  return '#fef2f2'
}

export default function EnvironmentalImpact() {
  const latest = environmentalData[environmentalData.length - 1]

  const aqiTrend = environmentalData.map(d => ({
    date: d.date.slice(5),
    aqi: d.aqi,
  }))

  const scatterData = academicCorrelationData.map(d => ({
    aqi: environmentalData[d.day].aqi,
    outdoor: Math.max(0, d.activityMin - 10),
    isSpike: environmentalData[d.day].isAQISpike,
  }))

  const activityByAQI = [
    { range: 'AQI < 100', indoor: 18, outdoor: 28, label: 'Normal' },
    { range: 'AQI 100–200', indoor: 24, outdoor: 18, label: 'Elevated' },
    { range: 'AQI > 200', indoor: 26, outdoor: 8, label: 'High' },
  ]

  const envStressTrend = environmentalData.map(d => ({
    date: d.date.slice(5),
    envStress: Math.round(Math.max(0, (d.aqi - 50) / 2.5)),
  }))

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Dean · Environment</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Environmental Impact</h1>
      </div>

      {/* Live status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'AQI', value: latest.aqi, sub: latest.aqiCategory, color: latest.aqiColor },
          { label: 'Temperature', value: `${latest.temperature.toFixed(1)}°C`, sub: 'Feels like', color: '#111827' },
          { label: 'Humidity', value: `${latest.humidity.toFixed(0)}%`, sub: 'Relative humidity', color: '#3B82F6' },
          { label: 'UV Index', value: latest.uvIndex.toFixed(1), sub: latest.uvIndex > 8 ? 'Very High risk' : latest.uvIndex > 6 ? 'High risk' : 'Moderate risk', color: latest.uvIndex > 8 ? '#ef4444' : '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#E5E7EB] p-4" style={{ backgroundColor: getAQIBg(s.label === 'AQI' ? latest.aqi : 50) }}>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">{s.label}</p>
            <p className="text-[22px] font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-[#6B7280]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* AQI trend */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="90-Day AQI Trend" subtitle="CPCB color categories · shaded by band" />
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={aqiTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="date" tick={{ fontSize: 8 }} interval={9} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={50} stroke="#55a84f" strokeDasharray="3 2" label={{ value: 'Good', position: 'right', fontSize: 8, fill: '#55a84f' }} />
            <ReferenceLine y={100} stroke="#a3c853" strokeDasharray="3 2" label={{ value: 'Satisfactory', position: 'right', fontSize: 8, fill: '#a3c853' }} />
            <ReferenceLine y={200} stroke="#f29c33" strokeDasharray="3 2" label={{ value: 'Poor', position: 'right', fontSize: 8, fill: '#f29c33' }} />
            <Line type="monotone" dataKey="aqi" stroke="#111827" strokeWidth={1.5} dot={false} name="AQI" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-3 mt-2 flex-wrap">
          {[['Good (0–50)', '#55a84f'], ['Satisfactory (51–100)', '#a3c853'], ['Moderate (101–200)', '#fff833'], ['Poor (201–300)', '#f29c33'], ['Very Poor (301+)', '#e93f33']].map(([l, c]) => (
            <div key={l} className="flex items-center gap-1">
              <div className="w-2 h-2" style={{ backgroundColor: c }} />
              <span className="text-[8px] text-[#6B7280]">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scatter plot */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="AQI vs Outdoor Activity Correlation" subtitle="Higher AQI → lower outdoor activity minutes" />
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="aqi" name="AQI" tick={{ fontSize: 9 }} label={{ value: 'AQI', position: 'insideBottom', offset: -5, fontSize: 9 }} />
            <YAxis dataKey="outdoor" name="Outdoor min" tick={{ fontSize: 9 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
            <ReferenceLine x={150} stroke="#E5E7EB" strokeDasharray="4 2" />
            <Scatter data={scatterData} name="Days">
              {scatterData.map((entry, i) => (
                <Cell key={i} fill={entry.isSpike ? '#ef4444' : '#111827'} opacity={0.4} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-[#6B7280] mt-2">For every 50-point increase in AQI above 100, outdoor activity drops by approximately 32%. Red dots = AQI spike period.</p>
      </div>

      {/* Activity shift */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Activity Type Shift During Poor Air Quality" subtitle="Indoor vs outdoor split by AQI level" />
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={activityByAQI} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="range" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="indoor" fill="#111827" name="Indoor (min)" />
            <Bar dataKey="outdoor" fill="#D1D5DB" name="Outdoor (min)" />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-[#6B7280] mt-2">Students substitute indoor for outdoor activity when AQI is high, but total activity still drops — net 15% reduction even with substitution.</p>
      </div>

      {/* Recommendations */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Environmental Recommendations" />
        <div className="space-y-2">
          {[
            `AQI has exceeded 150 on ${environmentalData.filter(d => d.aqi > 150).length} days this semester. Consider permanent indoor fitness infrastructure.`,
            'UV index regularly peaks above 8 between 11am–3pm. Advise students to avoid midday outdoor activity during summer months.',
            `During the AQI spike period (days 45–55), campus wellness scores dropped an average of 9.2 points.`,
          ].map((r, i) => (
            <div key={i} className="flex gap-3 p-3 border border-[#E5E7EB] bg-[#FAFAFA]">
              <span className="text-[9px] font-bold text-[#9CA3AF] shrink-0">0{i + 1}</span>
              <p className="text-[11px] text-[#111827]">{r}</p>
            </div>
          ))}
        </div>
      </div>

      <InsightCard insight={`Campus AQI exceeded safe levels (150+) on ${environmentalData.filter(d => d.aqi > 150).length} days in this dataset period. The winter smog period caused a sustained 9-point drop in campus wellness scores over 11 consecutive days.`} />
    </div>
  )
}
