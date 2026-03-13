import { useState } from 'react'
import { hostelWellnessData, nutrientRDA, macroTrend } from '../../data/mockData'
import { useAdminAuth } from '../../context/AdminAuthContext'
import NutrientGauge from '../../components/NutrientGauge'
import InsightCard from '../../components/InsightCard'
import SectionHeader from '../../components/SectionHeader'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E5E7EB] p-2 text-[10px] font-mono">
      <p className="font-bold mb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color || '#111827' }}>{p.name}: {typeof p.value === 'number' ? Math.round(p.value) : p.value}</p>)}
    </div>
  )
}

export default function NutritionReport() {
  const { user } = useAdminAuth()
  const hostelName = user?.hostelId || 'BH-3'
  const series = hostelWellnessData[hostelName].slice(-28)
  const [range, setRange] = useState('28')

  const mealSkipRates = [
    { meal: 'Breakfast', skip: 44, color: '#ef4444' },
    { meal: 'Lunch', skip: 22, color: '#f59e0b' },
    { meal: 'Snacks', skip: 38, color: '#ef4444' },
    { meal: 'Dinner', skip: 18, color: '#22c55e' },
  ]

  const mealRatings = [
    { meal: 'Breakfast', rating: 3.6, trend: '+0.2' },
    { meal: 'Lunch', rating: 3.4, trend: '-0.1' },
    { meal: 'Snacks', rating: 3.8, trend: '+0.3' },
    { meal: 'Dinner', rating: 3.1, trend: '-0.4' },
  ]

  const calorieTrend = series.map(d => ({ date: d.date.slice(5), calories: d.calorieAvg }))

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{hostelName} · Nutrition</p>
          <h1 className="text-[20px] font-bold text-[#111827]">Nutrition Report</h1>
        </div>
        <div className="flex gap-1">
          {[['7', '7D'], ['14', '14D'], ['28', '28D']].map(([v, l]) => (
            <button key={v} onClick={() => setRange(v)} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${range === v ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#111827]'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Calorie trend */}
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Daily Calorie Intake" subtitle="Hostel average · shaded = healthy range 1800–2500 kcal" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={calorieTrend} margin={{ top: 4, right: 8, bottom: 0, left: -15 }}>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} />
              <YAxis tick={{ fontSize: 9 }} domain={[1200, 2800]} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={1800} stroke="#22c55e" strokeDasharray="3 2" />
              <ReferenceLine y={2500} stroke="#22c55e" strokeDasharray="3 2" />
              <Line type="monotone" dataKey="calories" stroke="#111827" strokeWidth={2} dot={false} name="Avg Calories" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Meal skip rates */}
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Meal Skip Rates" subtitle="% of students who did not log each meal" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mealSkipRates} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="meal" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} domain={[0, 60]} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} formatter={v => `${v}%`} />
              <ReferenceLine y={20} stroke="#22c55e" strokeDasharray="3 2" label={{ value: '20%', position: 'right', fontSize: 9, fill: '#9CA3AF' }} />
              <ReferenceLine y={40} stroke="#ef4444" strokeDasharray="3 2" label={{ value: '40%', position: 'right', fontSize: 9, fill: '#9CA3AF' }} />
              <Bar dataKey="skip" fill="#111827" name="Skip rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Macro trend */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Weekly Macro Breakdown" subtitle="Average grams · Protein / Carbs / Fat" />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={macroTrend.slice(-8)} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="week" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="protein" fill="#111827" name="Protein (g)" />
            <Bar dataKey="fat" fill="#6B7280" name="Fat (g)" />
            <Bar dataKey="fibre" fill="#9CA3AF" name="Fibre (g)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Nutrient deficiency */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Nutrient vs RDA" subtitle="Campus average vs recommended daily allowance" />
        <div>
          {Object.entries(nutrientRDA).map(([key, v]) => (
            <NutrientGauge key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} avg={v.avg} rda={v.rda} unit={v.unit} />
          ))}
        </div>
        <div className="mt-4 border border-[#E5E7EB] bg-[#FAFAFA] p-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Recommendations</p>
          <p className="text-[11px] text-[#111827]">Fibre intake is 63% below RDA. Add rajma, chole, dal, and green vegetables to improve. Protein is 20% below target — consider increasing frequency of dal, paneer, or curd in mess menus.</p>
        </div>
      </div>

      {/* Meal ratings */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Mess Quality Ratings" subtitle="Average stars by meal type · your hostel students" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {mealRatings.map(m => (
            <div key={m.meal} className="border border-[#E5E7EB] p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">{m.meal}</p>
              <p className="text-[22px] font-bold text-[#111827]">{m.rating}</p>
              <p className="text-[9px] text-[#9CA3AF]">/ 5 STARS</p>
              <p className={`text-[10px] font-bold mt-1 ${m.trend.startsWith('+') ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>{m.trend} vs last month</p>
            </div>
          ))}
        </div>
      </div>

      <InsightCard insight="Breakfast has the highest skip rate (44%). Thursday dinner has the lowest participation this week and a 2.1-star average. Consider reviewing the Thursday menu with the mess manager." />
    </div>
  )
}
