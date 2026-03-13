import { academicCorrelationData, branchWellnessTrend } from '../../data/mockData'
import SectionHeader from '../../components/SectionHeader'
import InsightCard from '../../components/InsightCard'
import { useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, ComposedChart, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceArea
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

const EXAM_PERIODS = [{ start: 30, end: 37, label: 'Exam Week 1' }, { start: 70, end: 77, label: 'Exam Week 2' }]

export default function AcademicCorrelation() {
  const [selectedBranches, setSelectedBranches] = useState(['CSE', 'ECE', 'ME'])
  const BRANCH_COLORS = { CSE: '#111827', ECE: '#374151', ME: '#6B7280', CE: '#9CA3AF', EE: '#4B5563', Textile: '#D1D5DB', Chemical: '#E5E7EB', Mathematics: '#F3F4F6' }

  const chartData = academicCorrelationData.map(d => ({
    day: `D${d.day}`,
    wellness: d.wellnessScore,
    mood: d.moodScore,
    stress: d.stressLevel,
    sleep: d.sleepHours,
    isExam: d.isExam,
  }))

  const findingCards = [
    { title: 'Exam Impact', detail: 'Campus wellness score drops an average of 17.4 points during exam weeks. This is consistent across all 10 hostels.' },
    { title: 'Recovery Rate', detail: 'Wellness scores recover to pre-exam baseline within 5 days after exams end — fastest recovery metric is activity levels.' },
    { title: 'Sleep Impact', detail: 'Average sleep hours decline from 6.8 to 5.7 during exam weeks — the sharpest single metric decline on campus.' },
  ]

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Dean · Academic Correlation</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Academic Correlation</h1>
        <p className="text-[11px] text-[#6B7280]">How the academic calendar drives wellness patterns — 90-day semester view</p>
      </div>

      {/* Main area chart */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Campus Wellness vs Academic Calendar" subtitle="Shaded bands = exam weeks" />
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            {EXAM_PERIODS.map(ep => (
              <ReferenceArea key={ep.start} x1={`D${ep.start}`} x2={`D${ep.end}`} fill="#fef2f2" label={{ value: ep.label, position: 'insideTop', fontSize: 9, fill: '#ef4444' }} />
            ))}
            <XAxis dataKey="day" tick={{ fontSize: 8 }} interval={7} />
            <YAxis domain={[30, 90]} tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={60} stroke="#E5E7EB" strokeDasharray="4 2" />
            <Area type="monotone" dataKey="wellness" stroke="#111827" fill="#F3F4F6" strokeWidth={2} fillOpacity={0.5} name="Wellness Score" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Finding cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {findingCards.map(c => (
          <div key={c.title} className="bg-white border border-[#E5E7EB] p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Key Finding</p>
            <p className="text-[12px] font-bold text-[#111827] mb-2">{c.title}</p>
            <p className="text-[10px] text-[#6B7280] leading-relaxed">{c.detail}</p>
          </div>
        ))}
      </div>

      {/* Branch breakdown */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Branch-Wise Wellness Trend" subtitle="Select branches to compare" />
          <div className="flex flex-wrap gap-1 max-w-xs justify-end">
            {branchWellnessTrend.map(b => (
              <button
                key={b.branch}
                onClick={() => setSelectedBranches(prev => prev.includes(b.branch) ? prev.filter(x => x !== b.branch) : [...prev, b.branch])}
                className={`px-2 py-0.5 text-[9px] font-bold border transition-all ${selectedBranches.includes(b.branch) ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6B7280] border-[#E5E7EB]'}`}
              >{b.branch}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="week" type="category" allowDuplicatedCategory={false} tick={{ fontSize: 9 }} data={branchWellnessTrend[0]?.data} />
            <YAxis domain={[40, 90]} tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            {branchWellnessTrend.filter(b => selectedBranches.includes(b.branch)).map(b => (
              <Line key={b.branch} data={b.data} type="monotone" dataKey="score" stroke={BRANCH_COLORS[b.branch]} strokeWidth={1.5} dot={false} name={b.branch} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Mood + Stress correlation */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Mood + Stress vs Exam Periods" subtitle="Inverse correlation visible during exam weeks" />
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 30, bottom: 0, left: -20 }}>
            {EXAM_PERIODS.map(ep => (
              <ReferenceArea key={ep.start} x1={`D${ep.start}`} x2={`D${ep.end}`} fill="#fef2f2" />
            ))}
            <XAxis dataKey="day" tick={{ fontSize: 8 }} interval={7} />
            <YAxis yAxisId={0} domain={[1, 5]} tick={{ fontSize: 9 }} />
            <YAxis yAxisId={1} orientation="right" domain={[1, 5]} tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            <Line yAxisId={0} type="monotone" dataKey="mood" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Mood Score" />
            <Line yAxisId={1} type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Stress Level" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Recommendations */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Evidence-Based Recommendations" />
        <div className="space-y-3">
          {[
            'Consider scheduling wellness workshops or de-stress events in the week before exams.',
            'Early-evening fitness events have historically maintained activity levels during exam weeks.',
            'Mess menus during exam weeks should prioritize high-protein, easy-to-eat options (low skip rate).',
            'Peer wellness ambassador programs in each hostel reduce mood crisis duration from 6 days to 2.',
          ].map((r, i) => (
            <div key={i} className="flex gap-3 p-3 border border-[#E5E7EB] bg-[#FAFAFA]">
              <span className="text-[9px] font-bold text-[#9CA3AF] shrink-0 mt-0.5">0{i + 1}</span>
              <p className="text-[11px] text-[#111827]">{r}</p>
            </div>
          ))}
        </div>
      </div>

      <InsightCard insight="Stress peaks 3 days before exam start and remains elevated for 2 days post-exam. CSE and ECE branches show the steepest wellness declines — 22 and 19 points respectively during exam week 1." />
    </div>
  )
}
