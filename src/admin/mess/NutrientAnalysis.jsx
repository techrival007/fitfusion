import { nutrientRDA, macroTrend } from '../../data/mockData'
import NutrientGauge from '../../components/NutrientGauge'
import SectionHeader from '../../components/SectionHeader'
import InsightCard from '../../components/InsightCard'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E5E7EB] p-2 text-[10px] font-mono">
      <p className="font-bold mb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}g</p>)}
    </div>
  )
}

export default function NutrientAnalysis() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Mess · Nutrition</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Nutrient Analysis</h1>
        <p className="text-[11px] text-[#6B7280]">Based on aggregated logged nutrition data from students campus-wide</p>
      </div>

      {/* Nutrient gauges */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Campus Nutrient Intake vs RDA" subtitle="Current week campus average" />
        {Object.entries(nutrientRDA).map(([key, v]) => (
          <NutrientGauge key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} avg={v.avg} rda={v.rda} unit={v.unit} />
        ))}
      </div>

      {/* Weekly macro trend */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="12-Week Macro Trend" subtitle="Campus average grams per week" />
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={macroTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="week" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="protein" stroke="#111827" strokeWidth={2} dot={false} name="Protein (g)" />
            <Line type="monotone" dataKey="fat" stroke="#6B7280" strokeWidth={1.5} dot={false} name="Fat (g)" />
            <Line type="monotone" dataKey="fibre" stroke="#9CA3AF" strokeWidth={1.5} dot={false} name="Fibre (g)" strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
          {[['Protein', '#111827'], ['Fat', '#6B7280'], ['Fibre', '#9CA3AF']].map(([name, color]) => (
            <div key={name} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
              <span className="text-[9px] text-[#6B7280]">{name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Auto-Generated Recommendations" subtitle="Based on current nutrient gaps" />
        <div className="space-y-3">
          {[
            { nutrient: 'Fibre (63% below RDA)', text: 'Campus fibre intake is significantly below recommended levels. High-fibre mess items to consider: rajma, chole, mixed dal, green vegetables, moong dal chilla, sabzi.', severity: 'critical' },
            { nutrient: 'Protein (20% below RDA)', text: 'Protein intake is below target. Consider increasing frequency of: dal, paneer, eggs, curd, or rajma in the weekly menu.', severity: 'warning' },
            { nutrient: 'Carbohydrates (20% below RDA)', text: 'Carbohydrate intake is slightly low. Adding more rice, roti, or khichdi servings during lunch and dinner can help bridge this gap.', severity: 'info' },
          ].map(r => (
            <div key={r.nutrient} className={`border p-4 ${r.severity === 'critical' ? 'border-[#fecaca] bg-[#fef2f2]' : r.severity === 'warning' ? 'border-[#fde68a] bg-[#fffbeb]' : 'border-[#E5E7EB] bg-[#FAFAFA]'}`}>
              <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${r.severity === 'critical' ? 'text-[#ef4444]' : r.severity === 'warning' ? 'text-[#f59e0b]' : 'text-[#9CA3AF]'}`}>{r.nutrient}</p>
              <p className="text-[11px] text-[#374151] leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </div>

      <InsightCard insight="Fibre is the most chronically deficient nutrient on campus at only 37% of RDA. A menu change to include rajma twice weekly and daily mixed vegetables could raise fibre levels by an estimated 8–10g/day." />
    </div>
  )
}
