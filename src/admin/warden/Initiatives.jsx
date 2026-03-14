import { useState, useEffect } from 'react'
import { initiativesMock } from '../../data/mockData'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { getWardenInitiatives, createInitiative as apiCreateInitiative } from '../../api/warden'
import SectionHeader from '../../components/SectionHeader'
import { Plus, Activity, Moon, Utensils, Check, Brain } from 'lucide-react'

const GOAL_ICONS = { activity: Activity, sleep: Moon, nutrition: Utensils, mood: Brain }
const GOAL_COLORS = { activity: '#111827', sleep: '#6B7280', nutrition: '#9CA3AF', mood: '#8b5cf6' }

function normInitiative(i) {
  return {
    id:               i.id,
    hostel:           i.hostel_name || i.hostel,
    title:            i.title,
    description:      i.description,
    goalType:         i.goal_type || i.goalType,
    target:           i.target_value || i.target,
    startDate:        i.start_date || i.startDate,
    endDate:          i.end_date || i.endDate,
    participationRate: i.participationRate ?? null,
    goalMetPct:       i.goalMetPct ?? null,
  }
}

export default function Initiatives() {
  const { user } = useAdminAuth()
  const hostelName = user?.hostel_id || user?.hostelId || 'BH-3'
  const [showForm, setShowForm] = useState(false)
  const [initiatives, setInitiatives] = useState(initiativesMock)
  const [form, setForm] = useState({ title: '', description: '', goalType: 'activity', target: '', startDate: '', endDate: '' })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    getWardenInitiatives().then(resp => {
      const all = [...(resp.active || []).map(normInitiative), ...(resp.past || []).map(normInitiative)]
      if (all.length > 0) setInitiatives(all)
    }).catch(() => {})
  }, [])

  const active = initiatives.filter(i => !i.goalMetPct || new Date(i.endDate) > new Date())
  const past = initiatives.filter(i => i.goalMetPct !== null && new Date(i.endDate) <= new Date())

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      title: form.title, description: form.description,
      goal_type: form.goalType, target_value: parseFloat(form.target),
      start_date: form.startDate, end_date: form.endDate,
    }
    try {
      const created = await apiCreateInitiative(payload)
      setInitiatives(prev => [normInitiative(created), ...prev])
    } catch {
      const newInit = {
        id: `i${Date.now()}`, hostel: hostelName, ...form,
        target: parseFloat(form.target), participationRate: null, goalMetPct: null,
      }
      setInitiatives(prev => [newInit, ...prev])
    }
    setSubmitted(true)
    setTimeout(() => { setShowForm(false); setSubmitted(false); setForm({ title: '', description: '', goalType: 'activity', target: '', startDate: '', endDate: '' }) }, 1500)
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{hostelName} · Initiatives</p>
          <h1 className="text-[20px] font-bold text-[#111827]">Wellness Initiatives</h1>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-[#111827] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#1f2937] transition-all"
        >
          <Plus size={13} />
          New Initiative
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Create Initiative" subtitle="This will appear as a banner in all students' apps in your hostel" />
          {submitted ? (
            <div className="flex items-center gap-2 text-[#22c55e] py-4">
              <Check size={16} />
              <span className="text-[12px] font-bold">Initiative created and published to hostel students.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">Title</label>
                  <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-[12px] text-[#111827] focus:outline-none focus:border-[#111827] transition-all font-mono" placeholder="e.g. 7-Day Sleep Challenge" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">Goal Type</label>
                  <div className="flex gap-2">
                    {['activity', 'nutrition', 'sleep'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, goalType: g }))}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all ${form.goalType === g ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6B7280] border-[#E5E7EB]'}`}
                      >{g}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">Description</label>
                <textarea required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-[12px] text-[#111827] focus:outline-none focus:border-[#111827] transition-all font-mono" rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">
                    Target {form.goalType === 'activity' ? '(min/day)' : form.goalType === 'nutrition' ? '(meals/day)' : '(hrs/day)'}
                  </label>
                  <input required type="number" value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value }))} className="w-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-[12px] text-[#111827] focus:outline-none focus:border-[#111827] font-mono" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">Start Date</label>
                  <input required type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="w-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-[12px] text-[#111827] focus:outline-none focus:border-[#111827] font-mono" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">End Date</label>
                  <input required type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="w-full border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-[12px] text-[#111827] focus:outline-none focus:border-[#111827] font-mono" />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-6 py-2 bg-[#111827] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#1f2937] transition-all">Publish Initiative</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border border-[#E5E7EB] text-[11px] font-bold uppercase tracking-widest text-[#6B7280] hover:border-[#111827] transition-all">Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Active initiatives */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Active Initiatives" />
        {active.length === 0 ? (
          <p className="text-[11px] text-[#9CA3AF] py-4 text-center">No active initiatives. Create one to engage your hostel.</p>
        ) : (
          <div className="space-y-3">
            {active.map(init => {
              const Icon = GOAL_ICONS[init.goalType] || Activity
              return (
                <div key={init.id} className="border border-[#E5E7EB] p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 border border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-center shrink-0">
                      <Icon size={14} className="text-[#111827]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[12px] font-bold text-[#111827]">{init.title}</p>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] border border-[#E5E7EB] px-2 py-0.5">{init.goalType}</span>
                      </div>
                      <p className="text-[10px] text-[#6B7280] mb-2">{init.startDate} → {init.endDate} · Target: {init.target} {init.goalType === 'activity' ? 'min/day' : init.goalType === 'nutrition' ? 'meals/day' : 'hrs/day'}</p>
                      {init.participationRate && (
                        <div>
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="text-[#9CA3AF]">Participation</span>
                            <span className="font-bold text-[#111827]">{init.participationRate}%</span>
                          </div>
                          <div className="h-1.5 bg-[#F3F4F6] border border-[#E5E7EB]">
                            <div className="h-full bg-[#111827]" style={{ width: `${init.participationRate}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Past initiatives */}
      {past.length > 0 && (
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Past Initiatives" subtitle="Completed programs with outcome data" />
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#E5E7EB]">
                {['Title', 'Type', 'Dates', 'Participation', 'Goal Met'].map(h => (
                  <th key={h} className="text-left py-2 pr-4 text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {past.map(init => (
                <tr key={init.id} className="border-b border-[#E5E7EB] last:border-0">
                  <td className="py-2.5 pr-4 font-bold text-[#111827]">{init.title}</td>
                  <td className="py-2.5 pr-4 text-[#6B7280] uppercase text-[10px]">{init.goalType}</td>
                  <td className="py-2.5 pr-4 text-[#6B7280]">{init.startDate} – {init.endDate}</td>
                  <td className="py-2.5 pr-4 font-bold text-[#111827]">{init.participationRate}%</td>
                  <td className="py-2.5 font-bold" style={{ color: init.goalMetPct >= 50 ? '#22c55e' : '#f59e0b' }}>{init.goalMetPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
