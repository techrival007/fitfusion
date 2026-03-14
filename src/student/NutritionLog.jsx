import { useState, useEffect } from 'react'
import { todayMessMenu } from '../data/mockData'
import { getTodayMenu, logNutrition } from '../api/student'
import SectionHeader from '../components/SectionHeader'
import { Check } from 'lucide-react'

const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner']
const MEAL_LABELS = { breakfast: 'Breakfast', lunch: 'Lunch', snacks: 'Snacks', dinner: 'Dinner' }
const MEAL_TIMES  = { breakfast: '7:00 – 9:00 AM', lunch: '12:00 – 2:00 PM', snacks: '4:30 – 6:00 PM', dinner: '7:30 – 9:30 PM' }
const TAG_OPTIONS = ['Tasty', 'Good', 'Okay', 'Cold', 'Bland', 'No variety', 'Too spicy', 'Too oily']

export default function NutritionLog() {
  const [menu, setMenu]               = useState(null)
  const [logged, setLogged]           = useState({})
  const [ratings, setRatings]         = useState({})
  const [feedbackTags, setFeedbackTags] = useState({})
  const [saved, setSaved]             = useState(false)

  useEffect(() => { getTodayMenu().then(setMenu).catch(() => {}) }, [])

  const resolvedMenu = meal => {
    if (menu && menu[meal]) {
      return menu[meal].map(item =>
        typeof item === 'string'
          ? { name: item, cal: 0, protein: 0, carbs: 0, fat: 0 }
          : { name: item.name ?? item, cal: item.calories_per_100g ?? item.cal ?? 0, protein: item.protein_per_100g ?? item.protein ?? 0, carbs: item.carbs_per_100g ?? item.carbs ?? 0, fat: item.fat_per_100g ?? item.fat ?? 0 }
      )
    }
    return todayMessMenu[meal] || []
  }

  const toggleItem = (meal, itemName) => {
    setLogged(prev => {
      const mealItems = prev[meal] || {}
      if (mealItems[itemName]) {
        const { [itemName]: _, ...rest } = mealItems
        return { ...prev, [meal]: rest }
      }
      return { ...prev, [meal]: { ...mealItems, [itemName]: 'normal' } }
    })
  }

  const getTotals = () => {
    let cal = 0, protein = 0, carbs = 0, fat = 0
    Object.entries(logged).forEach(([meal, items]) => {
      const menuItems = resolvedMenu(meal)
      Object.entries(items).forEach(([name, portion]) => {
        const item = menuItems.find(i => i.name === name)
        if (item) {
          const mult = portion === 'half' ? 0.5 : portion === 'double' ? 2 : 1
          cal += item.cal * mult
          protein += item.protein * mult
          carbs += item.carbs * mult
          fat += item.fat * mult
        }
      })
    })
    return { cal: Math.round(cal), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) }
  }

  const totals = getTotals()

  const handleSave = async () => {
    const promises = Object.entries(logged).map(([meal, items]) => {
      const menuItems   = resolvedMenu(meal)
      let cal = 0, protein = 0, carbs = 0, fat = 0
      const foodList = Object.entries(items).map(([name, portion]) => {
        const item = menuItems.find(i => i.name === name)
        const mult = portion === 'half' ? 0.5 : portion === 'double' ? 2 : 1
        if (item) { cal += item.cal * mult; protein += item.protein * mult; carbs += item.carbs * mult; fat += item.fat * mult }
        return { name, portion }
      })
      return logNutrition({
        meal_type:         meal,
        food_items:        foodList,
        total_calories:    Math.round(cal),
        total_protein:     Math.round(protein),
        total_carbs:       Math.round(carbs),
        total_fat:         Math.round(fat),
        total_fibre:       0,
        meal_rating:       ratings[meal] || null,
        meal_feedback_tag: feedbackTags[meal] || null,
      })
    })
    try { await Promise.all(promises) } catch { /* silent */ }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">Daily Log · Nutrition</p>
        <h1 className="text-[20px] font-bold text-[#111827]">Nutrition Log</h1>
        <p className="text-[11px] text-[#6B7280]">Select what you ate from today's mess menu</p>
      </div>

      {/* Live nutrition totals */}
      <div className="bg-white border border-[#E5E7EB] p-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Today's Running Total</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Calories', value: `${totals.cal} kcal`, target: 2000, pct: (totals.cal / 2000) * 100 },
            { label: 'Protein', value: `${totals.protein}g`, target: 60, pct: (totals.protein / 60) * 100 },
            { label: 'Carbs', value: `${totals.carbs}g`, target: 275, pct: (totals.carbs / 275) * 100 },
            { label: 'Fat', value: `${totals.fat}g`, target: 65, pct: (totals.fat / 65) * 100 },
          ].map(n => (
            <div key={n.label}>
              <p className="text-[9px] text-[#9CA3AF]">{n.label}</p>
              <p className="text-[14px] font-bold text-[#111827]">{n.value}</p>
              <div className="h-1 bg-[#F3F4F6] border border-[#E5E7EB] mt-1">
                <div className="h-full bg-[#111827]" style={{ width: `${Math.min(n.pct, 100)}%` }} />
              </div>
              <p className="text-[8px] text-[#9CA3AF] mt-0.5">{Math.round(n.pct)}% of target</p>
            </div>
          ))}
        </div>
      </div>

      {/* Meal sections */}
      {MEALS.map(meal => {
        const items = resolvedMenu(meal)
        const mealLogged = logged[meal] || {}
        const loggedCount = Object.keys(mealLogged).length
        return (
          <div key={meal} className="bg-white border border-[#E5E7EB] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF]">{MEAL_TIMES[meal]}</p>
                <h3 className="text-[14px] font-bold text-[#111827]">{MEAL_LABELS[meal]}</h3>
              </div>
              {loggedCount > 0 && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#22c55e] border border-[#bbf7d0] bg-[#f0fdf4] px-2 py-0.5">{loggedCount} items logged</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {items.map(item => {
                const isLogged = !!mealLogged[item.name]
                return (
                  <button
                    key={item.name}
                    onClick={() => toggleItem(meal, item.name)}
                    className={`flex items-center gap-3 p-3 border text-left transition-all group ${isLogged ? 'border-[#111827] bg-[#FAFAFA]' : 'border-[#E5E7EB] hover:border-[#111827]'}`}
                  >
                    <div className={`w-4 h-4 border flex items-center justify-center shrink-0 ${isLogged ? 'bg-[#111827] border-[#111827]' : 'border-[#E5E7EB]'}`}>
                      {isLogged && <Check size={10} className="text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#111827] truncate">{item.name}</p>
                      <p className="text-[9px] text-[#9CA3AF]">{item.cal} kcal · {item.protein}g protein</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Rating */}
            <div className="border-t border-[#E5E7EB] pt-4">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Rate this meal</p>
              <div className="flex items-center gap-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      onClick={() => setRatings(p => ({ ...p, [meal]: s }))}
                      className="text-[20px] transition-all"
                      style={{ color: (ratings[meal] || 0) >= s ? '#111827' : '#E5E7EB' }}
                    >★</button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {TAG_OPTIONS.slice(0, 4).map(tag => (
                    <button
                      key={tag}
                      onClick={() => setFeedbackTags(p => ({ ...p, [meal]: tag }))}
                      className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border transition-all ${feedbackTags[meal] === tag ? 'bg-[#111827] text-white border-[#111827]' : 'border-[#E5E7EB] text-[#6B7280]'}`}
                    >{tag}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      <button onClick={handleSave} className={`w-full py-3 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${saved ? 'bg-[#22c55e] text-white' : 'bg-[#111827] text-white hover:bg-[#1f2937]'}`}>
        {saved ? <><Check size={13} /> Saved Successfully</> : 'Save Nutrition Log'}
      </button>
    </div>
  )
}
