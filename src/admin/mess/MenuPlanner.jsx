import { useState } from 'react'
import { FOOD_ITEMS, weeklyMenuPlanner } from '../../data/mockData'
import SectionHeader from '../../components/SectionHeader'
import { Plus, X, Check, AlertTriangle } from 'lucide-react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner']

const foodById = (id) => FOOD_ITEMS.find(f => f.id === id)

function mealNutrition(foodIds) {
  return foodIds.reduce((acc, id) => {
    const f = foodById(id)
    if (!f) return acc
    return { cal: acc.cal + f.cal, protein: acc.protein + f.protein, carbs: acc.carbs + f.carbs, fat: acc.fat + f.fat, fibre: acc.fibre + f.fibre }
  }, { cal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 })
}

function dayNutrition(menuDay) {
  return MEALS.reduce((acc, m) => {
    const n = mealNutrition(menuDay[m] || [])
    return { cal: acc.cal + n.cal, protein: acc.protein + n.protein, carbs: acc.carbs + n.carbs, fat: acc.fat + n.fat, fibre: acc.fibre + n.fibre }
  }, { cal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 })
}

export default function MenuPlanner() {
  const [menu, setMenu] = useState(weeklyMenuPlanner)
  const [editing, setEditing] = useState(null) // { dayIdx, meal }
  const [search, setSearch] = useState('')
  const [published, setPublished] = useState(false)

  const addFood = (dayIdx, meal, foodId) => {
    setMenu(prev => ({
      ...prev,
      [dayIdx]: { ...prev[dayIdx], [meal]: [...(prev[dayIdx]?.[meal] || []), foodId] },
    }))
  }

  const removeFood = (dayIdx, meal, idx) => {
    setMenu(prev => ({
      ...prev,
      [dayIdx]: { ...prev[dayIdx], [meal]: prev[dayIdx][meal].filter((_, i) => i !== idx) },
    }))
  }

  const filteredFoods = FOOD_ITEMS.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))

  const getDayCalStatus = (cal) => {
    if (cal >= 1800 && cal <= 2400) return { color: '#22c55e', label: 'Good' }
    if (cal >= 1600 && cal <= 2600) return { color: '#f59e0b', label: 'Marginal' }
    return { color: '#ef4444', label: 'Outside range' }
  }

  const handlePublish = () => {
    setPublished(true)
    setTimeout(() => setPublished(false), 3000)
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Mess · Menu</p>
          <h1 className="text-[20px] font-bold text-[#111827]">Menu Planner</h1>
          <p className="text-[11px] text-[#6B7280]">Plan the upcoming week's mess menu with live nutritional calculations</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-[#E5E7EB] text-[11px] font-bold uppercase tracking-widest text-[#6B7280] hover:border-[#111827] transition-all">Save Draft</button>
          <button onClick={handlePublish} className="flex items-center gap-2 px-4 py-2 bg-[#111827] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#1f2937] transition-all">
            {published ? <><Check size={12} /> Published</> : 'Publish Week'}
          </button>
        </div>
      </div>

      {/* Weekly grid */}
      <div className="bg-white border border-[#E5E7EB] overflow-x-auto">
        <div className="grid" style={{ gridTemplateColumns: '80px repeat(7, 1fr)', minWidth: 900 }}>
          {/* Header */}
          <div className="p-3 border-b border-r border-[#E5E7EB] bg-[#FAFAFA]" />
          {DAYS.map(d => (
            <div key={d} className="p-3 border-b border-r border-[#E5E7EB] bg-[#FAFAFA] last:border-r-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{d}</p>
            </div>
          ))}

          {/* Meals */}
          {MEALS.map(meal => (
            <>
              <div key={`label-${meal}`} className="p-3 border-b border-r border-[#E5E7EB] bg-[#FAFAFA] flex items-start justify-center">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] writing-vertical">{meal}</span>
              </div>
              {DAYS.map((d, dayIdx) => {
                const items = menu[dayIdx]?.[meal] || []
                const nutrition = mealNutrition(items)
                const isEditing = editing?.dayIdx === dayIdx && editing?.meal === meal
                return (
                  <div
                    key={`${dayIdx}-${meal}`}
                    className="p-2 border-b border-r border-[#E5E7EB] last:border-r-0 min-h-[80px] group cursor-pointer hover:bg-[#FAFAFA] transition-all"
                    onClick={() => setEditing(isEditing ? null : { dayIdx, meal })}
                  >
                    <div className="space-y-0.5 mb-1">
                      {items.map((id, i) => {
                        const f = foodById(id)
                        return f ? (
                          <div key={i} className="flex items-center justify-between text-[9px]">
                            <span className="text-[#111827] truncate">{f.name}</span>
                            <button
                              onClick={e => { e.stopPropagation(); removeFood(dayIdx, meal, i) }}
                              className="text-[#9CA3AF] hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-all ml-1 shrink-0"
                            >
                              <X size={8} />
                            </button>
                          </div>
                        ) : null
                      })}
                    </div>
                    {items.length > 0 && (
                      <div className="text-[8px] text-[#9CA3AF] border-t border-[#E5E7EB] pt-1 mt-1">
                        {Math.round(nutrition.cal)} kcal · {Math.round(nutrition.protein)}g P
                      </div>
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); setEditing({ dayIdx, meal }) }}
                      className="opacity-0 group-hover:opacity-100 text-[8px] text-[#9CA3AF] hover:text-[#111827] flex items-center gap-0.5 mt-1"
                    >
                      <Plus size={8} /> Add item
                    </button>
                  </div>
                )
              })}
            </>
          ))}

          {/* Daily totals */}
          <div className="p-3 border-r border-[#E5E7EB] bg-[#FAFAFA]">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Total</p>
          </div>
          {DAYS.map((d, dayIdx) => {
            const dayNut = dayNutrition(menu[dayIdx] || {})
            const status = getDayCalStatus(dayNut.cal)
            return (
              <div key={dayIdx} className="p-2 border-r border-[#E5E7EB] last:border-r-0 bg-[#FAFAFA]">
                <p className="text-[10px] font-bold" style={{ color: status.color }}>{Math.round(dayNut.cal)} kcal</p>
                <p className="text-[8px] text-[#9CA3AF]">{status.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Item picker panel */}
      {editing && (
        <div className="bg-white border border-[#E5E7EB] p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title={`Edit ${DAYS[editing.dayIdx]} ${editing.meal}`} />
            <button onClick={() => setEditing(null)} className="p-1 hover:bg-[#F3F4F6] transition-all">
              <X size={14} className="text-[#6B7280]" />
            </button>
          </div>

          {/* Allergen check for current edit */}
          {menu[editing.dayIdx]?.[editing.meal]?.some(id => ['f10', 'f11'].includes(id)) && (
            <div className="flex items-center gap-2 border border-[#fde68a] bg-[#fffbeb] p-3 mb-4">
              <AlertTriangle size={13} className="text-[#f59e0b] shrink-0" />
              <p className="text-[11px] text-[#92400e]">{DAYS[editing.dayIdx]} {editing.meal} contains non-veg items. 68 students have vegetarian dietary preference flagged.</p>
            </div>
          )}

          <input
            type="text"
            placeholder="Search food items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-[#E5E7EB] px-3 py-2 text-[11px] focus:outline-none focus:border-[#111827] font-mono mb-3"
          />
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {filteredFoods.map(f => (
              <button
                key={f.id}
                onClick={() => addFood(editing.dayIdx, editing.meal, f.id)}
                className="flex items-start gap-2 p-2 border border-[#E5E7EB] hover:border-[#111827] transition-all text-left"
              >
                <div>
                  <p className="text-[10px] font-bold text-[#111827]">{f.name}</p>
                  <p className="text-[8px] text-[#9CA3AF]">{f.cal} kcal · {f.protein}g P</p>
                  {!f.isVeg && <span className="text-[8px] font-bold text-[#ef4444]">NON-VEG</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
