import { useState } from 'react'
import SectionHeader from '../../components/SectionHeader'
import { Download, FileText, Check } from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'

const REPORT_TYPES = [
  { id: 'weekly', label: 'Weekly Wellness Summary' },
  { id: 'monthly', label: 'Monthly Wellness Summary' },
  { id: 'activity', label: 'Activity Report' },
  { id: 'nutrition', label: 'Nutrition Report' },
]

const recentExports = [
  { type: 'Monthly Wellness Summary', date: '2026-03-10', format: 'PDF', scope: 'BH-3 · Feb 2026' },
  { type: 'Activity Report', date: '2026-03-03', format: 'CSV', scope: 'BH-3 · Jan–Feb 2026' },
  { type: 'Weekly Wellness Summary', date: '2026-02-28', format: 'PDF', scope: 'BH-3 · W8 2026' },
]

export default function WardenExport() {
  const { user } = useAdminAuth()
  const hostelName = user?.hostelId || 'BH-3'
  const [reportType, setReportType] = useState('weekly')
  const [format, setFormat] = useState('PDF')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGenerated(true)
      setTimeout(() => setGenerated(false), 3000)
    }, 1800)
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{hostelName} · Export</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Export Reports</h1>
      </div>

      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Generate Report" />
        <div className="space-y-5">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Report Type</label>
            <div className="space-y-2">
              {REPORT_TYPES.map(r => (
                <label key={r.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 border flex items-center justify-center transition-all ${reportType === r.id ? 'bg-[#111827] border-[#111827]' : 'border-[#E5E7EB] group-hover:border-[#111827]'}`}>
                    {reportType === r.id && <Check size={10} className="text-white" />}
                  </div>
                  <input type="radio" className="sr-only" value={r.id} checked={reportType === r.id} onChange={e => setReportType(e.target.value)} />
                  <span className="text-[12px] text-[#111827]">{r.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Format</label>
            <div className="flex gap-2">
              {['PDF', 'CSV'].map(f => (
                <button key={f} onClick={() => setFormat(f)} className={`px-4 py-2 text-[11px] font-bold uppercase tracking-widest border transition-all ${format === f ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#111827]'}`}>{f}</button>
              ))}
            </div>
          </div>

          <div className="border border-[#E5E7EB] bg-[#FAFAFA] p-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">Privacy Notice</p>
            <p className="text-[10px] text-[#6B7280]">Generated reports contain only anonymized, aggregated data. No individual student names, roll numbers, or identifying information. Groups below 30 students are suppressed.</p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 bg-[#111827] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#1f2937] transition-all disabled:opacity-50"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : generated ? (
              <><Check size={13} /> Report Ready — Download</>
            ) : (
              <><Download size={13} /> Generate Report</>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Recent Exports" />
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              {['Report Type', 'Generated', 'Scope', 'Format', 'Action'].map(h => (
                <th key={h} className="text-left py-2 pr-4 text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentExports.map((r, i) => (
              <tr key={i} className="border-b border-[#E5E7EB] last:border-0">
                <td className="py-2.5 pr-4 font-medium text-[#111827]">{r.type}</td>
                <td className="py-2.5 pr-4 text-[#6B7280]">{r.date}</td>
                <td className="py-2.5 pr-4 text-[#6B7280]">{r.scope}</td>
                <td className="py-2.5 pr-4">
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border border-[#E5E7EB] text-[#6B7280]">{r.format}</span>
                </td>
                <td className="py-2.5">
                  <button className="flex items-center gap-1 text-[10px] font-bold text-[#111827] hover:underline">
                    <Download size={11} /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
