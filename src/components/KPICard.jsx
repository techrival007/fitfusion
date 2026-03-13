import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function KPICard({ label, value, subtext, trend, trendLabel, color, statusColor, badge }) {
  const trendVal = typeof trend === 'number' ? trend : null
  const trendUp = trendVal > 0.1
  const trendDown = trendVal < -0.1
  const trendColor = trendUp ? '#22c55e' : trendDown ? '#ef4444' : '#9CA3AF'

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-none p-5 relative overflow-hidden group hover:border-[#111827] transition-all duration-150">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="kpi-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#111827" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#kpi-grid)" />
        </svg>
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{label}</span>
          {badge && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border border-[#E5E7EB] text-[#6B7280] bg-[#F3F4F6]">{badge}</span>
          )}
        </div>
        <div className="flex items-end gap-2 mb-2">
          <span className="text-2xl font-bold leading-none" style={{ color: statusColor || '#111827' }}>{value}</span>
          {trendVal !== null && (
            <div className="flex items-center gap-0.5 mb-0.5" style={{ color: trendColor }}>
              {trendUp ? <TrendingUp size={12} /> : trendDown ? <TrendingDown size={12} /> : <Minus size={12} />}
              <span className="text-[10px] font-bold">{trendLabel || (Math.abs(trendVal)).toFixed(1)}</span>
            </div>
          )}
        </div>
        {subtext && <p className="text-[11px] text-[#6B7280] font-medium leading-tight">{subtext}</p>}
      </div>
    </div>
  )
}
