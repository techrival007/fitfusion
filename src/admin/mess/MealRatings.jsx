import { mealRatingsData, feedbackTags } from '../../data/mockData'
import { getMessRatings } from '../../api/mess'
import SectionHeader from '../../components/SectionHeader'
import { useState, useEffect } from 'react'

function StarDisplay({ rating }) {
  return (
    <span className="font-bold text-[11px]" style={{ color: rating >= 4 ? '#22c55e' : rating >= 2.5 ? '#111827' : '#ef4444' }}>
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))} {rating.toFixed(1)}
    </span>
  )
}

export default function MealRatings() {
  const [filter, setFilter] = useState('all')
  const [sortKey, setSortKey] = useState('date')
  const [apiTable, setApiTable] = useState(null)

  useEffect(() => {
    getMessRatings({ range: '30d' }).then(data => { if (data.table?.length) setApiTable(data.table) }).catch(() => {})
  }, [])

  const apiTags = Array.isArray(apiTable) && apiTable.length
    ? [...new Map(apiTable.filter((row) => row.top_tag).map((row) => [row.top_tag, row])).values()].map((row) => ({
        tag: row.top_tag,
        count: apiTable.filter((item) => item.top_tag === row.top_tag).reduce((sum, item) => sum + (item.n_ratings || 0), 0),
        type: row.top_tag === 'tasty' ? 'positive' : 'negative',
      }))
    : feedbackTags

  const flatRatings = apiTable
    ? apiTable.map(r => ({
        date: r.date, day: r.day_name, meal: r.meal_type,
        rating: r.avg_rating, count: r.n_ratings, tag: r.top_tag,
      }))
    : mealRatingsData.flatMap(d =>
    ['breakfast', 'lunch', 'snacks', 'dinner'].map(m => ({
      date: d.date,
      day: d.day,
      meal: m.charAt(0).toUpperCase() + m.slice(1),
      rating: parseFloat(d[m].rating.toFixed(2)),
      count: d[m].count,
      tag: d[m].tag,
    }))
    )

  const filtered = filter === 'all' ? flatRatings : flatRatings.filter(r => r.meal.toLowerCase() === filter)
  const sorted = [...filtered].sort((a, b) => {
    if (sortKey === 'rating') return a.rating - b.rating
    if (sortKey === 'date') return b.date.localeCompare(a.date)
    return 0
  })

  const worst10 = [...flatRatings].sort((a, b) => a.rating - b.rating).slice(0, 10)
  const best10 = [...flatRatings].sort((a, b) => b.rating - a.rating).slice(0, 10)

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Mess · Ratings</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Meal Ratings</h1>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Filter:</span>
        {['all', 'breakfast', 'lunch', 'snacks', 'dinner'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all capitalize ${filter === f ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#111827]'}`}>{f}</button>
        ))}
        <div className="ml-auto flex gap-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Sort:</span>
          {[['date', 'Date'], ['rating', 'Rating']].map(([v, l]) => (
            <button key={v} onClick={() => setSortKey(v)} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-all ${sortKey === v ? 'bg-[#111827] text-white border-[#111827]' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#111827]'}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Main table */}
      <div className="bg-white border border-[#E5E7EB]">
        <SectionHeader title={`All Ratings (${filtered.length} records)`} className="p-5 pb-0" />
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA]">
                {['Date', 'Day', 'Meal', 'Rating', '# Ratings', 'Top Tag'].map(h => (
                  <th key={h} className="text-left py-2 px-5 text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, 40).map((r, i) => (
                <tr
                  key={i}
                  className="border-b border-[#E5E7EB] last:border-0"
                  style={{ backgroundColor: r.rating >= 4 ? '#f0fdf4' : r.rating < 2.5 ? '#fef2f2' : undefined }}
                >
                  <td className="py-2.5 px-5 text-[#6B7280]">{r.date}</td>
                  <td className="py-2.5 px-5 text-[#6B7280]">{r.day}</td>
                  <td className="py-2.5 px-5 font-bold text-[#111827]">{r.meal}</td>
                  <td className="py-2.5 px-5"><StarDisplay rating={r.rating} /></td>
                  <td className="py-2.5 px-5 text-[#6B7280]">{r.count.toLocaleString()}</td>
                  <td className="py-2.5 px-5">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border border-[#E5E7EB] text-[#6B7280] bg-[#F3F4F6]">{r.tag}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Worst 10 */}
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Worst-Rated This Month" subtitle="Top 10 lowest-rated meals" />
          <div className="space-y-2">
            {worst10.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#E5E7EB] last:border-0">
                <div>
                  <p className="text-[11px] font-bold text-[#111827]">{r.day}, {r.date} — {r.meal}</p>
                  <p className="text-[9px] text-[#9CA3AF]">{r.tag}</p>
                </div>
                <StarDisplay rating={r.rating} />
              </div>
            ))}
          </div>
        </div>

        {/* Best 10 */}
        <div className="bg-white border border-[#E5E7EB] p-5">
          <SectionHeader title="Best-Rated This Month" subtitle="Top 10 highest-rated meals" />
          <div className="space-y-2">
            {best10.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#E5E7EB] last:border-0">
                <div>
                  <p className="text-[11px] font-bold text-[#111827]">{r.day}, {r.date} — {r.meal}</p>
                  <p className="text-[9px] text-[#9CA3AF]">{r.tag}</p>
                </div>
                <StarDisplay rating={r.rating} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback tag cloud */}
      <div className="bg-white border border-[#E5E7EB] p-5">
        <SectionHeader title="Feedback Tag Distribution" subtitle="Frequency of each tag this month" />
        <div className="flex flex-wrap gap-2">
          {[...apiTags].sort((a, b) => b.count - a.count).map(t => {
            const maxCount = Math.max(...apiTags.map(x => x.count), 1)
            const size = 9 + Math.round((t.count / maxCount) * 6)
            return (
              <div key={t.tag} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E7EB]"
                style={{ backgroundColor: t.type === 'positive' ? '#f0fdf4' : t.type === 'negative' ? '#fef2f2' : '#F9FAFB' }}>
                <span style={{ fontSize: size, color: t.type === 'positive' ? '#22c55e' : t.type === 'negative' ? '#ef4444' : '#6B7280', fontWeight: 'bold' }}>{t.tag}</span>
                <span className="text-[9px] text-[#9CA3AF]">{t.count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
