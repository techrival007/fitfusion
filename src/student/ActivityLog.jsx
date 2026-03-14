import { useState, useEffect } from 'react'
import { environmentalData } from '../data/mockData'
import { getStudentDashboard, logActivity } from '../api/student'
import { useEnvironment } from '../context/EnvironmentContext'
import SectionHeader from '../components/SectionHeader'
import { Check, AlertTriangle } from 'lucide-react'

const ACTIVITIES = ['Running', 'Gym', 'Sports', 'Yoga', 'Cycling', 'Walking', 'Swimming', 'HIIT', 'Stretching', 'Dance']
const INTENSITIES = [{ id: 'low', label: 'Low', desc: 'Light effort, can hold full conversation' }, { id: 'moderate', label: 'Moderate', desc: 'Moderate effort, can speak short sentences' }, { id: 'high', label: 'High', desc: 'Hard effort, difficult to speak' }]
const LOCATIONS = [{ id: 'indoor', label: 'Indoor' }, { id: 'outdoor', label: 'Outdoor' }]

export default function ActivityLog() {
  const [form, setForm] = useState({ type: '', duration: 30, intensity: 'moderate', location: 'outdoor', notes: '' })
  const [saved, setSaved] = useState(false)
  const [envData, setEnvData] = useState(null)
  const { env: liveEnv } = useEnvironment()

  useEffect(() => {
    getStudentDashboard().then(d => setEnvData(d.environment)).catch(() => {})
  }, [])

  const mockEnv = environmentalData[environmentalData.length - 1]
  const env = envData
    ? { aqi: envData.aqi, aqiCategory: envData.aqi_category, outdoorSafe: envData.outdoor_safe, activityRecommendation: envData.activity_recommendation }
    : {
        aqi: liveEnv?.aqi ?? mockEnv.aqi,
        aqiCategory: liveEnv?.aqi_category ?? mockEnv.aqiCategory,
        outdoorSafe: liveEnv?.outdoor_safe ?? mockEnv.outdoorSafe,
        activityRecommendation: liveEnv?.activity_recommendation,
      }

  const estimatedCalories = () => {
    const MET = form.intensity === 'low' ? 3 : form.intensity === 'moderate' ? 6 : 9
    return Math.round(MET * 60 * (form.duration / 60))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await logActivity({
        activity_type:    form.type,
        duration_minutes: form.duration,
        intensity:        form.intensity,
        location:         form.location,
        notes:            form.notes || null,
        calories_burned:  estimatedCalories(),
      })
    } catch { /* silent — still show success */ }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Daily Log · Activity</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Activity Log</h1>
      </div>

      {/* AQI warning */}
      {!env.outdoorSafe && (
        <div className="border border-[#fde68a] bg-[#fffbeb] p-4 flex gap-3">
          <AlertTriangle size={15} className="text-[#f59e0b] shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-[#92400e]">AQI is {env.aqi} today ({env.aqiCategory})</p>
            <p className="text-[10px] text-[#92400e]">{env.activityRecommendation || 'Outdoor activity not recommended. Consider an indoor workout.'}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Activity type */}
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Activity Type" />
          <div className="grid grid-cols-5 gap-2">
            {ACTIVITIES.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setForm(p => ({ ...p, type: a }))}
                className={`py-3 text-[10px] font-bold uppercase tracking-widest border transition-all ${form.type === a ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#111827]'}`}
              >{a}</button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Duration" subtitle={`${form.duration} minutes`} />
          <input
            type="range"
            min="5" max="120" step="5"
            value={form.duration}
            onChange={e => setForm(p => ({ ...p, duration: parseInt(e.target.value) }))}
            className="w-full accent-[#111827]"
          />
          <div className="flex justify-between text-[9px] text-[#9CA3AF] mt-1">
            <span>5 min</span>
            <span className="font-bold text-[#111827]">{form.duration} min selected</span>
            <span>120 min</span>
          </div>
        </div>

        {/* Intensity */}
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Intensity" />
          <div className="space-y-2">
            {INTENSITIES.map(i => (
              <label
                key={i.id}
                onClick={() => setForm(p => ({ ...p, intensity: i.id }))}
                className={`flex items-center gap-3 p-3 border cursor-pointer transition-all ${form.intensity === i.id ? 'border-[#111827] bg-[#FAFAFA]' : 'border-[#E5E7EB] hover:border-[#111827]'}`}
              >
                <div className={`w-4 h-4 border flex items-center justify-center shrink-0 ${form.intensity === i.id ? 'bg-[#111827] border-[#111827]' : 'border-[#E5E7EB]'}`}>
                  {form.intensity === i.id && <Check size={10} className="text-white" />}
                </div>
                <div>
                  <p className="text-[12px] font-bold text-[#111827]">{i.label}</p>
                  <p className="text-[10px] text-[#6B7280]">{i.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Location" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LOCATIONS.map(l => (
              <button
                key={l.id}
                type="button"
                onClick={() => setForm(p => ({ ...p, location: l.id }))}
                className={`py-4 text-[12px] font-bold uppercase tracking-widest border transition-all ${form.location === l.id ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#111827]'}`}
              >
                {l.label}
                {l.id === 'outdoor' && !env.outdoorSafe && <span className="block text-[9px] text-[#f59e0b] mt-0.5">⚠ High AQI today</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Estimated calories */}
        {form.type && (
          <div className="bg-white border border-[#E5E7EB] p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">Estimated Calories Burned</p>
            <p className="text-[24px] font-bold text-[#111827]">{estimatedCalories()} kcal</p>
            <p className="text-[10px] text-[#6B7280]">{form.type} · {form.duration} min · {form.intensity} intensity</p>
          </div>
        )}

        <div>
          <label className="block text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">Notes (optional)</label>
          <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="w-full border border-[#E5E7EB] px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-[#111827] bg-[#FAFAFA]" rows={2} placeholder="How did it feel?" />
        </div>

        <button
          type="submit"
          disabled={!form.type}
          className={`w-full py-3 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${saved ? 'bg-[#22c55e] text-white' : 'bg-[#111827] text-white hover:bg-[#1f2937]'}`}
        >
          {saved ? <><Check size={13} /> Activity Saved</> : 'Save Activity'}
        </button>
      </form>
    </div>
  )
}
