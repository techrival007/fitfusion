import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getCurrentEnvironment } from '../api/environment'
import { environmentalData } from '../data/mockData'

const EnvironmentContext = createContext(null)

export const CPCB_AQI_SCALE = [
  { max: 50, color: '#55a84f', label: 'Good', bg: '#EAF3DE' },
  { max: 100, color: '#a3c853', label: 'Satisfactory', bg: '#F1EFE8' },
  { max: 200, color: '#f59e0b', label: 'Moderate', bg: '#FAEEDA' },
  { max: 300, color: '#f29c33', label: 'Poor', bg: '#FAECE7' },
  { max: 400, color: '#e93f33', label: 'Very Poor', bg: '#FCEBEB' },
  { max: Infinity, color: '#af2d24', label: 'Severe', bg: '#FCEBEB' },
]

export function getAQIInfo(aqi) {
  return CPCB_AQI_SCALE.find((s) => aqi <= s.max) || CPCB_AQI_SCALE[CPCB_AQI_SCALE.length - 1]
}

function buildFallbackEnv() {
  const mock = environmentalData[environmentalData.length - 1]
  const info = getAQIInfo(mock?.aqi ?? 90)
  return {
    source: 'mock',
    aqi: mock?.aqi ?? 90,
    aqi_category: mock?.aqiCategory ?? info.label,
    aqi_color: mock?.aqiColor ?? info.color,
    aqi_bg: info.bg,
    temperature_c: mock?.temperature ?? 28,
    humidity_pct: mock?.humidity ?? 55,
    uv_index: mock?.uvIndex ?? 5,
    weather_text: 'Partly cloudy',
    outdoor_safe: mock?.outdoorSafe ?? true,
    sleep_risk: 24,
    env_stress_score: Math.max(0, Math.round(((mock?.aqi ?? 90) - 50) / 2.5)),
    activity_recommendation: mock?.outdoorSafe ? 'Outdoor activity is generally safe.' : 'Prefer indoor exercise today.',
  }
}

export function EnvironmentProvider({ children }) {
  const [env, setEnv] = useState(buildFallbackEnv)
  const [hourly, setHourly] = useState([])
  const [daily, setDaily] = useState([])
  const [alerts, setAlerts] = useState([])
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const data = await getCurrentEnvironment()
      const current = data?.current || buildFallbackEnv()
      const info = getAQIInfo(current?.aqi ?? 90)
      setEnv({
        ...buildFallbackEnv(),
        ...current,
        aqi_category: current?.aqi_category ?? current?.aqiCategory ?? info.label,
        aqi_color: current?.aqi_color ?? current?.aqiColor ?? info.color,
        aqi_bg: current?.aqi_bg ?? info.bg,
      })
      setHourly(data?.hourly || [])
      setDaily(data?.daily || [])
      setAlerts(data?.alerts || [])
      setLocation(data?.location || null)
      setError(null)
    } catch (err) {
      setEnv(buildFallbackEnv())
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refresh])

  const value = useMemo(() => ({ env, hourly, daily, alerts, location, loading, error, refresh }), [env, hourly, daily, alerts, location, loading, error, refresh])

  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext)
  if (!context) throw new Error('useEnvironment must be used within EnvironmentProvider')
  return context
}
