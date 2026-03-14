import { useEffect, useMemo, useState } from 'react'
import { createMenuSlot, getMessFoodItems, getMessMenu, publishMenu, updateMenuSlot } from '../../api/mess'
import SectionHeader from '../../components/SectionHeader'
import { Plus, X, Check, AlertTriangle } from 'lucide-react'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner']

const currentWeekNumber = () => {
  const now = new Date()
  const utc = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  const dayNumber = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  return Math.ceil((((utc - yearStart) / 86400000) + 1) / 7)
}

const emptyMenu = () => Object.fromEntries(DAY_KEYS.map((day) => [day, Object.fromEntries(MEALS.map((meal) => [meal, null]))]))

const normalizeMenuGrid = (grid) => {
  const nextMenu = emptyMenu()
  for (const day of DAY_KEYS) {
    const sourceMeals = grid?.[day] || {}
    for (const meal of MEALS) {
      nextMenu[day][meal] = sourceMeals[meal] || null
    }
  }
  return nextMenu
}

function normalizeFoodItem(item) {
  return {
    id: item.id || item.food_id,
    food_id: item.food_id || item.id,
    name: item.name,
    category: item.category || 'custom',
    cal: Number(item.cal ?? item.calories_per_100g ?? 0),
    protein: Number(item.protein ?? item.protein_per_100g ?? 0),
    carbs: Number(item.carbs ?? item.carbs_per_100g ?? 0),
    fat: Number(item.fat ?? item.fat_per_100g ?? 0),
    fibre: Number(item.fibre ?? item.fibre_per_100g ?? 0),
    isVeg: item.isVeg ?? item.is_veg ?? true,
    allergens: item.allergens || [],
  }
}

function toSlotItems(slot) {
  return Array.isArray(slot?.food_items)
    ? slot.food_items.map((item) => ({
        food_id: item.food_id || item.id,
        name: item.name,
        quantity_g: Number(item.quantity_g ?? 100),
        calories_per_100g: Number(item.calories_per_100g ?? item.cal ?? 0),
        protein_per_100g: Number(item.protein_per_100g ?? item.protein ?? 0),
        carbs_per_100g: Number(item.carbs_per_100g ?? item.carbs ?? 0),
        fat_per_100g: Number(item.fat_per_100g ?? item.fat ?? 0),
        fibre_per_100g: Number(item.fibre_per_100g ?? item.fibre ?? 0),
      }))
    : []
}

function mealNutrition(items) {
  return items.reduce((acc, item) => {
    const qtyFactor = Number(item.quantity_g ?? 100) / 100
    return {
      cal: acc.cal + Number(item.calories_per_100g ?? 0) * qtyFactor,
      protein: acc.protein + Number(item.protein_per_100g ?? 0) * qtyFactor,
      carbs: acc.carbs + Number(item.carbs_per_100g ?? 0) * qtyFactor,
      fat: acc.fat + Number(item.fat_per_100g ?? 0) * qtyFactor,
      fibre: acc.fibre + Number(item.fibre_per_100g ?? 0) * qtyFactor,
    }
  }, { cal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 })
}

function dayNutrition(menuDay) {
  return MEALS.reduce((acc, meal) => {
    const slot = menuDay?.[meal]
    const nutrition = mealNutrition(toSlotItems(slot))
    return {
      cal: acc.cal + nutrition.cal,
      protein: acc.protein + nutrition.protein,
      carbs: acc.carbs + nutrition.carbs,
      fat: acc.fat + nutrition.fat,
      fibre: acc.fibre + nutrition.fibre,
    }
  }, { cal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 })
}

export default function MenuPlanner() {
  const [weekNumber, setWeekNumber] = useState(currentWeekNumber())
  const [menu, setMenu] = useState(emptyMenu)
  const [foodItems, setFoodItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [published, setPublished] = useState(false)
  const [justPublished, setJustPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadWeek() {
      setLoading(true)
      setError('')
      try {
        const [menuResponse, foodResponse] = await Promise.all([getMessMenu(weekNumber), getMessFoodItems()])
        if (cancelled) return
        setMenu(normalizeMenuGrid(menuResponse?.grid))
        setPublished(Boolean(menuResponse?.is_published))
        setJustPublished(false)
        setFoodItems(Array.isArray(foodResponse?.items) ? foodResponse.items.map(normalizeFoodItem) : [])
      } catch {
        if (!cancelled) {
          setMenu(emptyMenu())
          setError('Unable to load menu planner data right now.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadWeek()
    return () => {
      cancelled = true
    }
  }, [weekNumber])

  const filteredFoods = useMemo(() => {
    const query = search.trim().toLowerCase()
    return foodItems.filter((item) => item.name.toLowerCase().includes(query))
  }, [foodItems, search])

  const addFood = async (dayIdx, meal, food) => {
    const dayKey = DAY_KEYS[dayIdx]
    const existingSlot = menu?.[dayKey]?.[meal]
    const nextItems = [...toSlotItems(existingSlot), {
      food_id: food.food_id,
      name: food.name,
      quantity_g: 100,
      calories_per_100g: food.cal,
      protein_per_100g: food.protein,
      carbs_per_100g: food.carbs,
      fat_per_100g: food.fat,
      fibre_per_100g: food.fibre,
    }]
    await persistSlot(dayIdx, meal, existingSlot?.id, nextItems)
  }

  const removeFood = async (dayIdx, meal, itemIndex) => {
    const dayKey = DAY_KEYS[dayIdx]
    const existingSlot = menu?.[dayKey]?.[meal]
    const nextItems = toSlotItems(existingSlot).filter((_, index) => index !== itemIndex)
    await persistSlot(dayIdx, meal, existingSlot?.id, nextItems)
  }

  const persistSlot = async (dayIdx, meal, slotId, food_items) => {
    setSaving(true)
    setError('')
    try {
      const body = { week_number: weekNumber, day_of_week: dayIdx, meal_type: meal, food_items }
      const response = slotId ? await updateMenuSlot(slotId, body) : await createMenuSlot(body)
      const slot = response?.menu_entry
      if (!slot) return
      setMenu((prev) => ({
        ...prev,
        [DAY_KEYS[dayIdx]]: {
          ...prev[DAY_KEYS[dayIdx]],
          [meal]: {
            ...slot,
            food_items,
          },
        },
      }))
    } catch {
      setError('Could not save that menu change.')
    } finally {
      setSaving(false)
    }
  }

  const getDayCalStatus = (cal) => {
    if (cal >= 1800 && cal <= 2400) return { color: '#22c55e', label: 'Good' }
    if (cal >= 1600 && cal <= 2600) return { color: '#f59e0b', label: 'Marginal' }
    return { color: '#ef4444', label: 'Outside range' }
  }

  const handlePublish = async () => {
    setSaving(true)
    setError('')
    try {
      await publishMenu(weekNumber)
      setPublished(true)
      setJustPublished(true)
      setTimeout(() => setJustPublished(false), 3000)
      setMenu((prev) => Object.fromEntries(
        Object.entries(prev).map(([day, meals]) => [
          day,
          Object.fromEntries(Object.entries(meals).map(([meal, slot]) => [meal, slot ? { ...slot, is_published: true } : slot])),
        ]),
      ))
    } catch {
      setError('Could not publish this week yet.')
    } finally {
      setSaving(false)
    }
  }

  const currentEditItems = editing ? toSlotItems(menu?.[DAY_KEYS[editing.dayIdx]]?.[editing.meal]) : []
  const currentHasNonVeg = currentEditItems.some((item) => {
    const match = foodItems.find((food) => food.food_id === item.food_id)
    return match ? !match.isVeg : false
  })

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Mess · Menu</p>
          <h1 className="text-[20px] font-bold text-[#111827]">Menu Planner</h1>
          <p className="text-[11px] text-[#6B7280]">Manage the live weekly mess menu from backend data</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 border border-[#E5E7EB] px-3 py-2 bg-white">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Week</span>
            <input
              type="number"
              min="1"
              max="53"
              value={weekNumber}
              onChange={(event) => setWeekNumber(Number(event.target.value) || currentWeekNumber())}
              className="w-16 text-[11px] font-mono text-[#111827] focus:outline-none"
            />
          </div>
          <button
            onClick={handlePublish}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#111827] text-white text-[11px] font-bold uppercase tracking-widest hover:bg-[#1f2937] transition-all disabled:opacity-50"
          >
            {saving ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving</> : (published || justPublished) ? <><Check size={12} /> Published</> : 'Publish Week'}
          </button>
        </div>
      </div>

      {error && <div className="border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[11px] text-[#991b1b]">{error}</div>}

      <div className="bg-white border border-[#E5E7EB] overflow-x-auto">
        <div className="grid" style={{ gridTemplateColumns: '80px repeat(7, 1fr)', minWidth: 900 }}>
          <div className="p-3 border-b border-r border-[#E5E7EB] bg-[#FAFAFA]" />
          {DAYS.map((day) => (
            <div key={day} className="p-3 border-b border-r border-[#E5E7EB] bg-[#FAFAFA] last:border-r-0">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{day}</p>
            </div>
          ))}

          {MEALS.map((meal) => (
            <div key={meal} className="contents">
              <div className="p-3 border-b border-r border-[#E5E7EB] bg-[#FAFAFA] flex items-start justify-center">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] writing-vertical">{meal}</span>
              </div>
              {DAYS.map((_, dayIdx) => {
                const slot = menu?.[DAY_KEYS[dayIdx]]?.[meal]
                const items = toSlotItems(slot)
                const nutrition = mealNutrition(items)
                const isEditing = editing?.dayIdx === dayIdx && editing?.meal === meal
                return (
                  <div
                    key={`${dayIdx}-${meal}`}
                    className="p-2 border-b border-r border-[#E5E7EB] last:border-r-0 min-h-[80px] group cursor-pointer hover:bg-[#FAFAFA] transition-all"
                    onClick={() => setEditing(isEditing ? null : { dayIdx, meal })}
                  >
                    <div className="space-y-0.5 mb-1">
                      {items.map((item, index) => (
                        <div key={`${item.food_id || item.name}-${index}`} className="flex items-center justify-between text-[9px] gap-2">
                          <span className="text-[#111827] truncate">{item.name}</span>
                          <button
                            onClick={(event) => { event.stopPropagation(); removeFood(dayIdx, meal, index) }}
                            className="text-[#9CA3AF] hover:text-[#ef4444] opacity-0 group-hover:opacity-100 transition-all ml-1 shrink-0"
                            disabled={saving}
                          >
                            <X size={8} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {items.length > 0 && (
                      <div className="text-[8px] text-[#9CA3AF] border-t border-[#E5E7EB] pt-1 mt-1">
                        {Math.round(nutrition.cal)} kcal · {Math.round(nutrition.protein)}g P
                      </div>
                    )}
                    <button
                      onClick={(event) => { event.stopPropagation(); setEditing({ dayIdx, meal }) }}
                      className="opacity-0 group-hover:opacity-100 text-[8px] text-[#9CA3AF] hover:text-[#111827] flex items-center gap-0.5 mt-1"
                    >
                      <Plus size={8} /> Add item
                    </button>
                  </div>
                )
              })}
            </div>
          ))}

          <div className="p-3 border-r border-[#E5E7EB] bg-[#FAFAFA]">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Total</p>
          </div>
          {DAYS.map((_, dayIdx) => {
            const dayNut = dayNutrition(menu?.[DAY_KEYS[dayIdx]] || {})
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

      {loading && <div className="bg-white border border-[#E5E7EB] p-4 text-[11px] text-[#6B7280]">Loading weekly menu data...</div>}

      {editing && !loading && (
        <div className="bg-white border border-[#E5E7EB] p-5">
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title={`Edit ${DAYS[editing.dayIdx]} ${editing.meal}`} />
            <button onClick={() => setEditing(null)} className="p-1 hover:bg-[#F3F4F6] transition-all">
              <X size={14} className="text-[#6B7280]" />
            </button>
          </div>

          {currentHasNonVeg && (
            <div className="flex items-center gap-2 border border-[#fde68a] bg-[#fffbeb] p-3 mb-4">
              <AlertTriangle size={13} className="text-[#f59e0b] shrink-0" />
              <p className="text-[11px] text-[#92400e]">{DAYS[editing.dayIdx]} {editing.meal} includes non-veg items. Review dietary preference conflicts before publishing.</p>
            </div>
          )}

          <input
            type="text"
            placeholder="Search food items..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full border border-[#E5E7EB] px-3 py-2 text-[11px] focus:outline-none focus:border-[#111827] font-mono mb-3"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {filteredFoods.map((food) => (
              <button
                key={food.food_id}
                onClick={() => addFood(editing.dayIdx, editing.meal, food)}
                disabled={saving}
                className="flex items-start gap-2 p-2 border border-[#E5E7EB] hover:border-[#111827] transition-all text-left disabled:opacity-50"
              >
                <div>
                  <p className="text-[10px] font-bold text-[#111827]">{food.name}</p>
                  <p className="text-[8px] text-[#9CA3AF]">{food.cal} kcal · {food.protein}g P · {food.category}</p>
                  {!food.isVeg && <span className="text-[8px] font-bold text-[#ef4444]">NON-VEG</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
