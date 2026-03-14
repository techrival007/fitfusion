import { Lightbulb } from 'lucide-react'

export default function InsightCard({ insight, className = '' }) {
  return (
    <div className={`border border-[var(--border-main)] bg-[var(--surface-soft)] p-4 flex gap-3 ${className}`}>
      <Lightbulb size={14} className="text-[var(--text-main)] shrink-0 mt-0.5" />
      <div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] block mb-1">AUTO INSIGHT</span>
        <p className="text-[11px] text-[var(--text-main)] leading-relaxed font-medium">{insight}</p>
      </div>
    </div>
  )
}
