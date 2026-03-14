import { adminAlerts } from '../../data/mockData'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { getWardenAlerts, acknowledgeAlert } from '../../api/warden'
import AlertCard from '../../components/AlertCard'
import SectionHeader from '../../components/SectionHeader'
import { useState, useEffect } from 'react'

function normAlert(a) {
  return {
    id:          a.id,
    hostel:      a.hostel_name || a.hostel,
    severity:    a.severity,
    title:       a.title,
    description: a.description,
    triggeredAt: a.triggered_at || a.triggeredAt,
    isActive:    a.is_active ?? a.isActive,
    metricValue: a.metric_value ?? a.metricValue,
    threshold:   a.threshold_value ?? a.threshold,
  }
}

export default function WellnessAlerts() {
  const { user } = useAdminAuth()
  const hostelName = user?.hostel_id || user?.hostelId || 'BH-3'
  const [filter, setFilter] = useState('all')

  const mockHostelAlerts = adminAlerts.filter(a => a.hostel === hostelName || a.hostel === null)
  const [activeAlerts, setActiveAlerts] = useState(mockHostelAlerts.filter(a => a.isActive))
  const [pastAlerts, setPastAlerts]     = useState(mockHostelAlerts.filter(a => !a.isActive))

  useEffect(() => {
    getWardenAlerts().then((resp) => {
      setActiveAlerts((resp.active || []).map(normAlert))
      setPastAlerts((resp.history || []).map(normAlert))
    }).catch(() => {})
  }, [])

  const handleAcknowledge = async (alertId) => {
    try { await acknowledgeAlert(alertId) } catch {}
    setActiveAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  const filtered = filter === 'all' ? activeAlerts : activeAlerts.filter(a => a.severity === filter)


  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{hostelName} · Alerts</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Wellness Alerts</h1>
        <p className="text-[11px] text-[#6B7280]">All alerts are aggregate-level only. Zero individual identification.</p>
      </div>

      {/* Active alerts */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title={`Active Alerts (${activeAlerts.length})`} />
          <div className="flex gap-1">
            {['all', 'critical', 'warning', 'info'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border transition-all ${filter === f ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#111827]'}`}
              >{f}</button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-8 border border-[#E5E7EB]">
            <p className="text-[11px] text-[#9CA3AF]">No active alerts matching this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(alert => (
              <AlertCard key={alert.id} alert={alert} onAcknowledge={handleAcknowledge} />
            ))}
          </div>
        )}
      </div>

      {/* Alert thresholds reference */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Alert Trigger Conditions" subtitle="Reference — when each alert is generated" />
        <div className="space-y-0">
          {[
            { type: 'SLEEP DEFICIT', condition: 'Avg sleep < 6.5 hrs for 5+ consecutive days', sev: 'warning' },
            { type: 'ACTIVITY DROUGHT', condition: '< 35% of hostel logged activity for 5+ days', sev: 'warning' },
            { type: 'NUTRITION GAP', condition: 'Avg calories < 1,600 kcal for 3+ consecutive days', sev: 'info' },
            { type: 'MOOD CRISIS', condition: 'Avg mood score < 2.5 for 3+ consecutive days', sev: 'critical' },
            { type: 'HIGH STRESS WEEK', condition: '> 50% of check-ins in high stress band for 3+ days', sev: 'warning' },
            { type: 'ENVIRONMENTAL', condition: 'AQI > 150 on current day', sev: 'info' },
          ].map(item => (
            <div key={item.type} className="flex items-center gap-4 py-3 border-b border-[#E5E7EB] last:border-0">
              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border w-32 shrink-0 text-center ${
                item.sev === 'critical' ? 'text-[#ef4444] border-[#fecaca] bg-[#fef2f2]' :
                item.sev === 'warning' ? 'text-[#f59e0b] border-[#fde68a] bg-[#fffbeb]' :
                'text-[#3b82f6] border-[#bfdbfe] bg-[#eff6ff]'
              }`}>{item.type}</span>
              <p className="text-[11px] text-[#6B7280]">{item.condition}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Past alerts history */}
      {pastAlerts.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Alert History" subtitle="Acknowledged and resolved alerts" />
          <div className="space-y-3">
            {pastAlerts.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
