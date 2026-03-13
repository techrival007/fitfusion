import { Lightbulb } from 'lucide-react'

export default function InsightCard({ insight, className = '' }) {
  return (
    <div className={`border border-[#E5E7EB] bg-[#FAFAFA] p-4 flex gap-3 ${className}`}>
      <Lightbulb size={14} className="text-[#111827] shrink-0 mt-0.5" />
      <div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] block mb-1">AUTO INSIGHT</span>
        <p className="text-[11px] text-[#111827] leading-relaxed font-medium">{insight}</p>
      </div>
    </div>
  )
}
