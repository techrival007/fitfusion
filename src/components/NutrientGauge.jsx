export default function NutrientGauge({ label, avg, rda, unit }) {
  const pct = Math.round((avg / rda) * 100)
  const color = pct >= 90 && pct <= 110 ? '#22c55e' : (pct >= 70 && pct <= 130) ? '#f59e0b' : '#ef4444'
  const status = pct >= 90 && pct <= 110 ? '✓' : (pct >= 70 && pct <= 130) ? '⚠' : '✗'
  const barPct = Math.min(pct, 130)

  return (
    <div className="py-3 border-b border-[#E5E7EB] last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-[#111827]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#6B7280]">{avg} / {rda} {unit}</span>
          <span className="text-[12px] font-bold" style={{ color }}>{status}</span>
          <span className="text-[10px] font-bold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-[#F3F4F6] border border-[#E5E7EB] relative">
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${(barPct / 130) * 100}%`, backgroundColor: color }}
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-[#111827] opacity-30"
          style={{ left: `${(100 / 130) * 100}%` }}
        />
      </div>
      <p className="text-[9px] text-[#9CA3AF] mt-1">
        Campus average is <span className="font-bold" style={{ color }}>{Math.abs(100 - pct)}% {pct < 100 ? 'below' : 'above'}</span> recommended daily intake
      </p>
    </div>
  )
}
