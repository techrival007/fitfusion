import { useState, useEffect } from 'react'
import { useStudentAuth } from '../context/StudentAuthContext'
import { getStudentDashboard, getTodayMenu } from '../api/student'
import { useEnvironment } from '../context/EnvironmentContext'
import { nudges, getWellnessLabel, environmentalData, todayMessMenu } from '../data/mockData'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Wind, Thermometer, Bell } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts'

const MOOD_EMOJIS = { 5: '😄', 4: '🙂', 3: '😐', 2: '😔', 1: '😞' }

export default function StudentHome() {
  const { user } = useStudentAuth()
  const navigate = useNavigate()
  const { env: liveEnv } = useEnvironment()
  const [data, setData] = useState(null)
  const [menu, setMenu] = useState(null)

  useEffect(() => {
    getStudentDashboard().then(setData).catch(() => {})
    getTodayMenu().then(setMenu).catch(() => {})
  }, [])

  const mockEnv   = environmentalData[environmentalData.length - 1]
  const env       = data?.environment ?? {
    aqi: liveEnv?.aqi ?? mockEnv.aqi,
    aqi_category: liveEnv?.aqi_category ?? mockEnv.aqiCategory,
    aqi_color: liveEnv?.aqi_color ?? mockEnv.aqiColor,
    temperature_c: liveEnv?.temperature_c ?? mockEnv.temperature,
    humidity_pct: liveEnv?.humidity_pct ?? mockEnv.humidity,
    uv_index: liveEnv?.uv_index ?? mockEnv.uvIndex,
    outdoor_safe: liveEnv?.outdoor_safe ?? mockEnv.outdoorSafe,
    activity_recommendation: liveEnv?.activity_recommendation,
    sleep_risk: liveEnv?.sleep_risk,
  }
  const today     = data?.today
  const weekHistory = data?.week_history ?? []
  const safeWeekHistory = Array.isArray(weekHistory) ? weekHistory : []

  const mockWellness = { wellnessScore: 72, activityMin: 36, calories: 1800, sleep: 7.2, mood: 3.8 }
  const wellness  = today
    ? { wellnessScore: today.wellness_score, activityMin: today.activity_minutes, calories: today.calories, sleep: today.sleep_hours, mood: today.mood }
    : mockWellness

  const wellnessLabel = getWellnessLabel(wellness.wellnessScore)
  const streakDays    = data?.streak_days ?? user?.streakDays ?? 1

  const activeNudge = data?.nudge ?? nudges[Math.floor(wellness.wellnessScore / 20) % nudges.length]

  const chartData = safeWeekHistory.length
    ? safeWeekHistory.map(d => ({ date: d.date.slice(5), wellnessScore: d.wellnessScore ?? d.wellness_score ?? 0 }))
    : [{ wellnessScore: wellness.wellnessScore }]

  const hasMenu = menu && Object.keys(menu).length > 0
  const resolvedMenu = hasMenu
    ? Object.entries(menu).map(([meal, items]) => ({
        meal: meal.charAt(0).toUpperCase() + meal.slice(1),
        items: Array.isArray(items) ? items.map(i => i.name ?? i) : [],
        totalCal: Array.isArray(items) ? items.reduce((s, i) => s + (i.calories_per_100g ?? i.cal ?? 0), 0) : 0,
      }))
    : Object.entries(todayMessMenu).map(([meal, items]) => ({
        meal: meal.charAt(0).toUpperCase() + meal.slice(1),
        items: items.map(i => i.name),
        totalCal: items.reduce((s, i) => s + (i.cal || 0), 0),
      }))

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Good Morning</p>
          <h1 className="text-[20px] font-bold text-[#111827]">{user?.name?.split(' ')[0]}</h1>
          <p className="text-[11px] text-[#6B7280]">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB] bg-white">
          <span className="text-[14px]">🔥</span>
          <span className="text-[11px] font-bold text-[#111827]">{streakDays} day streak</span>
        </div>
      </div>

      <div className="bg-white border border-[#E5E7EB] p-5 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-48 opacity-[0.05] pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 200 200">
            {[20,40,60,80,100].map(r => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#111827" strokeWidth="0.5" />)}
            <line x1="100" y1="0" x2="100" y2="200" stroke="#111827" strokeWidth="0.3" />
            <line x1="0" y1="100" x2="200" y2="100" stroke="#111827" strokeWidth="0.3" />
          </svg>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">Today's Wellness Score</p>
            <p className="text-[48px] font-bold leading-none" style={{ color: wellnessLabel.color }}>{wellness.wellnessScore}</p>
            <p className="text-[12px] font-bold mt-1" style={{ color: wellnessLabel.color }}>{wellnessLabel.label}</p>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <Area type="monotone" dataKey="wellnessScore" stroke={wellnessLabel.color} fill={wellnessLabel.color} fillOpacity={0.1} strokeWidth={2} dot={false} />
                <XAxis hide />
                <YAxis hide domain={[30, 100]} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-[9px] text-[#9CA3AF] text-right mt-1">7-day trend</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#E5E7EB]">
          {[
            { label: 'Activity', value: `${wellness.activityMin} min`, ok: wellness.activityMin >= 30 },
            { label: 'Calories', value: `${wellness.calories} kcal`, ok: wellness.calories >= 1600 && wellness.calories <= 2500 },
            { label: 'Sleep', value: `${wellness.sleep.toFixed(1)} hrs`, ok: wellness.sleep >= 7 },
            { label: 'Mood', value: `${MOOD_EMOJIS[Math.round(wellness.mood)]} ${wellness.mood.toFixed(1)}`, ok: wellness.mood >= 3 },
          ].map(m => (
            <div key={m.label} className="text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{m.label}</p>
              <p className="text-[14px] font-bold" style={{ color: m.ok ? '#22c55e' : '#f59e0b' }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Quick Log</p>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: 'Nutrition', path: '/student/log/nutrition', emoji: '🥗' },
            { label: 'Activity',  path: '/student/log/activity',  emoji: '🏃' },
            { label: 'Mood',      path: '/student/log/mood',      emoji: '😊' },
            { label: 'Sleep',     path: '/student/log/mood',      emoji: '🌙' },
          ].map(q => (
            <button
              key={q.label}
              onClick={() => navigate(q.path)}
              className="bg-white border border-[#E5E7EB] py-4 flex flex-col items-center gap-1.5 hover:border-[#111827] transition-all group"
            >
              <span className="text-[20px]">{q.emoji}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] group-hover:text-[#111827]">{q.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E5E7EB] p-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">Environment Today</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Wind size={11} className="text-[#9CA3AF]" />
                <span className="text-[10px] text-[#6B7280]">AQI</span>
              </div>
              <span className="text-[11px] font-bold" style={{ color: env.aqi_color || (env.outdoor_safe ? '#22c55e' : '#ef4444') }}>
                {env.aqi} — {env.aqi_category}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Thermometer size={11} className="text-[#9CA3AF]" />
                <span className="text-[10px] text-[#6B7280]">Temp</span>
              </div>
              <span className="text-[11px] font-bold text-[#111827]">{env.temperature_c}°C</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#6B7280]">Humidity</span>
              <span className="text-[11px] font-bold text-[#111827]">{Math.round(env.humidity_pct ?? mockEnv.humidity)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#6B7280]">Sleep Risk</span>
              <span className="text-[11px] font-bold text-[#111827]">{Math.round(env.sleep_risk ?? 0)}/100</span>
            </div>
            {!env.outdoor_safe
              ? <div className="border border-[#fde68a] bg-[#fffbeb] p-2 mt-2"><p className="text-[9px] text-[#92400e]">{env.activity_recommendation || 'High AQI today — consider indoor exercise.'}</p></div>
              : <div className="border border-[#bbf7d0] bg-[#f0fdf4] p-2 mt-2"><p className="text-[9px] text-[#166534]">{env.activity_recommendation || 'Safe for outdoor activity today.'}</p></div>
            }
          </div>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={12} className="text-[#111827]" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Wellness Nudge</p>
          </div>
          <p className="text-[11px] text-[#111827] leading-relaxed">{activeNudge?.message ?? 'Stay consistent — small daily habits compound into major wellness gains.'}</p>
          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border border-[#E5E7EB] text-[#9CA3AF] mt-3 inline-block capitalize">{activeNudge?.nudge_type ?? activeNudge?.type ?? 'general'}</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] p-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">Today's Mess Menu</p>
          <div className="space-y-2">
            {resolvedMenu.map(m => (
              <div key={m.meal}>
                <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-widest">{m.meal}</p>
                <p className="text-[10px] text-[#111827]">{m.items.slice(0, 2).join(', ')}{m.items.length > 2 ? ` +${m.items.length - 2}` : ''}</p>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/student/log/nutrition')} className="mt-3 text-[10px] font-bold text-[#111827] flex items-center gap-1 hover:underline">
            Log my meals <ArrowRight size={10} />
          </button>
        </div>
      </div>
    </div>
  )
}
