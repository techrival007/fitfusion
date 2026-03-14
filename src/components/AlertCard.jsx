import { AlertTriangle, Info, XCircle, Check, Bell } from 'lucide-react'
import { useState } from 'react'

const severityConfig = {
  info: { icon: Info, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', label: 'INFO' },
  warning: { icon: AlertTriangle, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'WARNING' },
  critical: { icon: XCircle, color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'CRITICAL' },
}

export default function AlertCard({ alert, onAcknowledge }) {
  const [acknowledged, setAcknowledged] = useState(!!alert.acknowledgedAt)
  const cfg = severityConfig[alert.severity] || severityConfig.info
  const Icon = cfg.icon
  const detail = alert.detail || alert.description
  const triggeredAt = alert.triggeredAt || alert.triggered_at
  const hostel = alert.hostel || alert.hostel_name
  const metricValue = alert.metricValue ?? alert.metric_value
  const threshold = alert.threshold ?? alert.threshold_value

  const handleAck = () => {
    setAcknowledged(true)
    onAcknowledge?.(alert.id)
  }

  return (
    <div
      className={`alert-card border p-4 font-mono transition-all ${acknowledged ? 'is-ack' : ''}`}
      data-severity={alert.severity}
    >
      <div className="flex items-start gap-3">
        <Icon size={16} style={{ color: cfg.color, flexShrink: 0, marginTop: 2 }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="alert-card-badge text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border" style={{ color: cfg.color, borderColor: cfg.border }}>
              {cfg.label}
            </span>
            {hostel && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{hostel}</span>
            )}
            <span className="text-[9px] text-[#9CA3AF] ml-auto">{triggeredAt}</span>
          </div>
          <p className="text-[12px] font-bold text-[#111827] mb-1">{alert.title}</p>
          <p className="text-[11px] text-[#6B7280] leading-relaxed">{detail}</p>
          {metricValue !== undefined && (
            <div className="flex items-center gap-3 mt-2 text-[10px] text-[#9CA3AF]">
              <span>METRIC: <span className="text-[#111827] font-bold">{metricValue}</span></span>
              <span>THRESHOLD: <span className="text-[#111827] font-bold">{threshold}</span></span>
            </div>
          )}
        </div>
        {!acknowledged && (
          <button
            onClick={handleAck}
            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-[#111827] hover:bg-[#111827] hover:text-white transition-all duration-150 shrink-0"
          >
            <Check size={10} />
            ACK
          </button>
        )}
        {acknowledged && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#22c55e] flex items-center gap-1">
            <Check size={10} />
            DONE
          </span>
        )}
      </div>
    </div>
  )
}
