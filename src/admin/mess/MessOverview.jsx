import { messKPIs, mealRatingsData, feedbackTags } from '../../data/mockData'
import { getMessOverview } from '../../api/mess'
import KPICard from '../../components/KPICard'
import InsightCard from '../../components/InsightCard'
import SectionHeader from '../../components/SectionHeader'
import { useState, useEffect } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine
} from 'recharts'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-[#E5E7EB] p-2 text-[10px] font-mono">
      <p className="font-bold mb-1">{label}</p>
      {payload.map(p => <p key={p.dataKey} style={{ color: p.color || '#111827' }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</p>)}
    </div>
  )
}

const MEAL_COLORS = { breakfast: '#111827', lunch: '#6B7280', snacks: '#9CA3AF', dinner: '#D1D5DB' }

export default function MessOverview() {
  const [apiData, setApiData] = useState(null)
  useEffect(() => { getMessOverview().then(setApiData).catch(() => {}) }, [])

  const kpis = apiData?.kpis
  const feedbackSummary = apiData?.feedback_tags?.length
    ? apiData.feedback_tags.map((tag) => ({
        tag: tag.tag,
        count: tag.count,
        type: tag.tag === 'tasty' ? 'positive' : 'negative',
      }))
    : feedbackTags
  const DAYS_MAP = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' }

  const weekData = apiData?.participation_chart?.length
    ? apiData.participation_chart.map(d => ({
        day: DAY_NAMES[new Date(d.day + 'T00:00:00').getDay()],
        Breakfast: d.breakfast,
        Lunch: d.lunch,
        Snacks: d.snacks,
        Dinner: d.dinner,
      }))
    : mealRatingsData.slice(-7).map(d => ({
        day: d.day,
        Breakfast: d.breakfast.count,
        Lunch: d.lunch.count,
        Snacks: d.snacks.count,
        Dinner: d.dinner.count,
      }))

  const ratingTrend = apiData?.rating_trend?.length
    ? apiData.rating_trend.map(d => ({
        date: d.date.slice(5),
        Breakfast: d.breakfast,
        Lunch: d.lunch,
        Snacks: d.snacks,
        Dinner: d.dinner,
      }))
    : mealRatingsData.map(d => ({
        date: d.date.slice(5),
        Breakfast: parseFloat(d.breakfast.rating.toFixed(2)),
        Lunch: parseFloat(d.lunch.rating.toFixed(2)),
        Snacks: parseFloat(d.snacks.rating.toFixed(2)),
        Dinner: parseFloat(d.dinner.rating.toFixed(2)),
      }))

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Campus Mess · Analytics</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Mess Overview</h1>
        <p className="text-[11px] text-[#6B7280]">Showing campus-wide aggregated data · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          label="Today's Avg Rating"
          value={`${(kpis?.avg_meal_rating_today?.value ?? messKPIs.todayAvgRating).toFixed(1)} / 5`}
          subtext={`Based on ${(kpis?.avg_meal_rating_today?.n_ratings ?? messKPIs.ratingsCount).toLocaleString()} ratings today`}
          trend={0.2}
          trendLabel="+0.2 vs yesterday"
        />
        <KPICard
          label="Total Meals Logged"
          value={(kpis?.total_meals_logged_today?.value ?? messKPIs.totalMealsToday).toLocaleString()}
          subtext="Across all meal types today"
        />
        <KPICard
          label="Highest Skip Rate"
          value={`${(kpis?.highest_skip_rate_today?.meal ?? messKPIs.highestSkipMeal)} — ${(kpis?.highest_skip_rate_today?.pct ?? messKPIs.highestSkipRate)}%`}
          subtext="of students skipped this meal today"
          statusColor={kpis ? kpis.highest_skip_rate_today?.color : (messKPIs.highestSkipRate > 40 ? '#ef4444' : '#f59e0b')}
        />
        <KPICard
          label="Worst-Rated This Week"
          value={kpis ? `${DAYS_MAP[kpis.worst_rated_meal_week?.day] ?? ''} ${kpis.worst_rated_meal_week?.meal ?? 'N/A'}` : messKPIs.worstRatedMealWeek}
          subtext={`${(kpis?.worst_rated_meal_week?.rating ?? messKPIs.worstRatedStars)} stars avg`}
          statusColor="#ef4444"
        />
      </div>

      {/* Meal participation this week */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Meal Participation — This Week" subtitle="Students who logged each meal per day" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={weekData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="day" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            {Object.entries(MEAL_COLORS).map(([meal, color]) => (
              <Bar key={meal} dataKey={meal.charAt(0).toUpperCase() + meal.slice(1)} fill={color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rating trend */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Rating Trend by Meal Type" subtitle="30-day average rating · dashed line = 3.0 threshold" />
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={ratingTrend.slice(-21)} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={3} />
            <YAxis domain={[1, 5]} tick={{ fontSize: 9 }} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={3} stroke="#E5E7EB" strokeDasharray="4 2" label={{ value: '3.0', position: 'right', fontSize: 9, fill: '#9CA3AF' }} />
            {Object.entries(MEAL_COLORS).map(([meal, color]) => (
              <Line key={meal} type="monotone" dataKey={meal.charAt(0).toUpperCase() + meal.slice(1)} stroke={color} strokeWidth={1.5} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
          {Object.entries(MEAL_COLORS).map(([meal, color]) => (
            <div key={meal} className="flex items-center gap-1.5">
              <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
              <span className="text-[9px] text-[#6B7280] capitalize">{meal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback tag summary */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Feedback Tag Summary" subtitle="Most common tags this month" />
        <div className="flex flex-wrap gap-2">
          {[...feedbackSummary].sort((a, b) => b.count - a.count).map(t => (
            <div
              key={t.tag}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#E5E7EB]"
              style={{ backgroundColor: t.type === 'positive' ? '#f0fdf4' : t.type === 'negative' ? '#fef2f2' : '#F9FAFB' }}
            >
              <span className="text-[11px] font-bold" style={{ color: t.type === 'positive' ? '#22c55e' : t.type === 'negative' ? '#ef4444' : '#6B7280' }}>{t.tag}</span>
              <span className="text-[9px] text-[#9CA3AF]">{t.count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <InsightCard insight="Thursday dinner has the lowest participation rate this week (38% skip) and the worst rating (2.1 stars). Consider reviewing the Thursday menu. Breakfast ratings have improved 0.4 stars since the last menu cycle." />
    </div>
  )
}
