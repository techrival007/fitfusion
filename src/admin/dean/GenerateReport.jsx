import { useState } from 'react'
import SectionHeader from '../../components/SectionHeader'
import { Download, Check, Shield } from 'lucide-react'

const REPORT_TYPES = [
  { id: 'monthly', label: 'Monthly Wellness Summary', desc: 'All hostels, all metrics, one month' },
  { id: 'semester', label: 'Semester Wellness Report', desc: 'Full 90-day analysis, all dimensions' },
  { id: 'hostel', label: 'Hostel-Specific Brief', desc: 'One hostel, full analysis' },
  { id: 'environmental', label: 'Environmental Impact Report', desc: 'AQI and weather correlation analysis' },
  { id: 'nutrition', label: 'Nutrition & Mess Report', desc: 'Campus nutrition gaps, mess quality analysis' },
  { id: 'academic', label: 'Academic Correlation Report', desc: 'Exam-week wellness impact analysis' },
]

const recentReports = [
  { type: 'Semester Wellness Report', date: '2026-03-01', scope: 'All hostels · Jan–Mar 2026', format: 'PDF' },
  { type: 'Environmental Impact Report', date: '2026-02-20', scope: 'Campus-wide · Feb 2026', format: 'CSV' },
  { type: 'Monthly Wellness Summary', date: '2026-02-01', scope: 'All hostels · Jan 2026', format: 'PDF' },
  { type: 'Academic Correlation Report', date: '2026-01-15', scope: 'All branches · Sem 1', format: 'PDF' },
]

export default function GenerateReport() {
  const [reportType, setReportType] = useState('semester')
  const [format, setFormat] = useState('PDF')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => { setGenerating(false); setGenerated(true); setTimeout(() => setGenerated(false), 4000) }, 2200)
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Dean · Reports</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Generate Report</h1>
        <p className="text-[11px] text-[#6B7280]">Produce formal downloadable reports for institutional use</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Report type selector */}
        <div className="col-span-2 bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Report Type" />
          <div className="space-y-2">
            {REPORT_TYPES.map(r => (
              <label key={r.id} className="flex items-start gap-3 cursor-pointer group p-3 border border-[#E5E7EB] hover:border-[#111827] transition-all" onClick={() => setReportType(r.id)}>
                <div className={`w-4 h-4 border mt-0.5 flex items-center justify-center shrink-0 transition-all ${reportType === r.id ? 'bg-[#111827] border-[#111827]' : 'border-[#E5E7EB]'}`}>
                  {reportType === r.id && <Check size={10} className="text-white" />}
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[#111827]">{r.label}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{r.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Config */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E5E7EB] p-5">
            <SectionHeader title="Format" />
            <div className="flex gap-2">
              {['PDF', 'CSV'].map(f => (
                <button key={f} onClick={() => setFormat(f)} className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-widest border transition-all ${format === f ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#111827]'}`}>{f}</button>
              ))}
            </div>

            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mt-4 mb-2">Scope</p>
            <select className="w-full border border-[#E5E7EB] px-3 py-2 text-[11px] text-[#111827] bg-[#FAFAFA] focus:outline-none focus:border-[#111827] font-mono">
              <option>All Hostels</option>
              <option>Boys Hostels Only</option>
              <option>Girls Hostels Only</option>
            </select>

            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mt-4 mb-2">Date Range</p>
            <input type="date" defaultValue="2026-01-01" className="w-full border border-[#E5E7EB] px-3 py-2 text-[11px] text-[#111827] bg-[#FAFAFA] focus:outline-none focus:border-[#111827] font-mono mb-2" />
            <input type="date" defaultValue="2026-03-13" className="w-full border border-[#E5E7EB] px-3 py-2 text-[11px] text-[#111827] bg-[#FAFAFA] focus:outline-none focus:border-[#111827] font-mono" />

            <div className="mt-4 border border-[#E5E7EB] bg-[#FAFAFA] p-3">
              <div className="flex gap-2 mb-1">
                <Shield size={11} className="text-[#9CA3AF] shrink-0 mt-0.5" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Privacy</p>
              </div>
              <p className="text-[9px] text-[#6B7280] leading-relaxed">Reports contain only anonymized, aggregated data. No individual identifiers. Groups &lt;30 are suppressed.</p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-[#111827] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#1f2937] transition-all disabled:opacity-50"
            >
              {generating ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
              ) : generated ? (
                <><Check size={13} /> Download Ready</>
              ) : (
                <><Download size={13} /> Generate</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Recent reports */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Recent Reports" subtitle="Last 20 generated reports" />
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              {['Report Type', 'Generated', 'Scope', 'Format', 'Action'].map(h => (
                <th key={h} className="text-left py-2 pr-4 text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentReports.map((r, i) => (
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
