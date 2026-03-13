// UniVitals Mock Data — 1000 students, 90 days, 10 hostels
// Simulates exam weeks: days 30–37 and 70–77
// AQI spike: days 45–55

const BASE_DATE = new Date()
BASE_DATE.setDate(BASE_DATE.getDate() - 90)

export const HOSTELS = [
  { id: 1, name: 'BH-1', type: 'boys', capacity: 100 },
  { id: 2, name: 'BH-2', type: 'boys', capacity: 100 },
  { id: 3, name: 'BH-3', type: 'boys', capacity: 100 },
  { id: 4, name: 'BH-4', type: 'boys', capacity: 100 },
  { id: 5, name: 'BH-5', type: 'boys', capacity: 100 },
  { id: 6, name: 'GH-1', type: 'girls', capacity: 100 },
  { id: 7, name: 'GH-2', type: 'girls', capacity: 100 },
  { id: 8, name: 'GH-3', type: 'girls', capacity: 100 },
  { id: 9, name: 'GH-4', type: 'girls', capacity: 100 },
  { id: 10, name: 'GH-5', type: 'girls', capacity: 100 },
]

export const BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'Textile', 'Chemical', 'Mathematics']
export const YEARS = [1, 2, 3, 4]

export const FOOD_ITEMS = [
  { id: 'f1', name: 'Dal Fry', category: 'dal', cal: 180, protein: 9, carbs: 28, fat: 4, fibre: 6, isVeg: true },
  { id: 'f2', name: 'Roti', category: 'staple', cal: 70, protein: 3, carbs: 15, fat: 0.5, fibre: 2, isVeg: true },
  { id: 'f3', name: 'Rice', category: 'staple', cal: 130, protein: 2.7, carbs: 28, fat: 0.3, fibre: 0.4, isVeg: true },
  { id: 'f4', name: 'Paneer Sabzi', category: 'vegetable', cal: 220, protein: 14, carbs: 8, fat: 16, fibre: 2, isVeg: true },
  { id: 'f5', name: 'Aloo Sabzi', category: 'vegetable', cal: 150, protein: 3, carbs: 25, fat: 5, fibre: 3, isVeg: true },
  { id: 'f6', name: 'Rajma', category: 'dal', cal: 200, protein: 12, carbs: 30, fat: 4, fibre: 8, isVeg: true },
  { id: 'f7', name: 'Chole', category: 'dal', cal: 210, protein: 11, carbs: 32, fat: 5, fibre: 9, isVeg: true },
  { id: 'f8', name: 'Mixed Veg', category: 'vegetable', cal: 120, protein: 3, carbs: 18, fat: 4, fibre: 5, isVeg: true },
  { id: 'f9', name: 'Palak Paneer', category: 'vegetable', cal: 240, protein: 15, carbs: 9, fat: 17, fibre: 3, isVeg: true },
  { id: 'f10', name: 'Egg Curry', category: 'non-veg', cal: 180, protein: 13, carbs: 5, fat: 12, fibre: 1, isVeg: false },
  { id: 'f11', name: 'Chicken Curry', category: 'non-veg', cal: 250, protein: 22, carbs: 6, fat: 15, fibre: 1, isVeg: false },
  { id: 'f12', name: 'Sambar', category: 'dal', cal: 90, protein: 5, carbs: 14, fat: 2, fibre: 4, isVeg: true },
  { id: 'f13', name: 'Idli (2 pcs)', category: 'staple', cal: 140, protein: 4, carbs: 28, fat: 1, fibre: 2, isVeg: true },
  { id: 'f14', name: 'Poha', category: 'staple', cal: 180, protein: 3, carbs: 35, fat: 4, fibre: 2, isVeg: true },
  { id: 'f15', name: 'Curd', category: 'dairy', cal: 100, protein: 8, carbs: 6, fat: 4, fibre: 0, isVeg: true },
  { id: 'f16', name: 'Banana', category: 'fruit', cal: 90, protein: 1, carbs: 23, fat: 0.3, fibre: 2.6, isVeg: true },
  { id: 'f17', name: 'Tea', category: 'beverage', cal: 40, protein: 1, carbs: 6, fat: 1, fibre: 0, isVeg: true },
  { id: 'f18', name: 'Milk', category: 'dairy', cal: 150, protein: 8, carbs: 12, fat: 8, fibre: 0, isVeg: true },
  { id: 'f19', name: 'Khichdi', category: 'staple', cal: 200, protein: 7, carbs: 35, fat: 5, fibre: 3, isVeg: true },
  { id: 'f20', name: 'Paratha', category: 'staple', cal: 180, protein: 4, carbs: 28, fat: 7, fibre: 2, isVeg: true },
  { id: 'f21', name: 'Halwa', category: 'snack', cal: 280, protein: 3, carbs: 42, fat: 12, fibre: 1, isVeg: true },
  { id: 'f22', name: 'Moong Dal Chilla', category: 'staple', cal: 160, protein: 10, carbs: 22, fat: 4, fibre: 5, isVeg: true },
  { id: 'f23', name: 'Sabzi (Seasonal)', category: 'vegetable', cal: 100, protein: 2.5, carbs: 15, fat: 3.5, fibre: 4, isVeg: true },
  { id: 'f24', name: 'Upma', category: 'staple', cal: 190, protein: 4, carbs: 32, fat: 6, fibre: 3, isVeg: true },
  { id: 'f25', name: 'Boiled Egg', category: 'non-veg', cal: 78, protein: 6, carbs: 0.6, fat: 5, fibre: 0, isVeg: false },
]

const rng = (seed) => {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

const clamp = (val, min, max) => Math.max(min, Math.min(max, val))
const gauss = (mean, std, rand) => {
  const u1 = rand(), u2 = rand()
  return mean + std * Math.sqrt(-2 * Math.log(u1 + 0.001)) * Math.cos(2 * Math.PI * u2)
}

const EXAM_DAYS = new Set([...Array.from({length: 8}, (_, i) => i + 30), ...Array.from({length: 8}, (_, i) => i + 70)])
const AQI_SPIKE_DAYS = new Set(Array.from({length: 11}, (_, i) => i + 45))

function generateAQI(dayIdx) {
  const r = rng(dayIdx * 7919)
  if (AQI_SPIKE_DAYS.has(dayIdx)) return Math.floor(gauss(220, 40, r))
  return Math.floor(gauss(85, 35, r))
}

function getAQICategory(aqi) {
  if (aqi <= 50) return { label: 'Good', color: '#55a84f' }
  if (aqi <= 100) return { label: 'Satisfactory', color: '#a3c853' }
  if (aqi <= 200) return { label: 'Moderate', color: '#fff833' }
  if (aqi <= 300) return { label: 'Poor', color: '#f29c33' }
  if (aqi <= 400) return { label: 'Very Poor', color: '#e93f33' }
  return { label: 'Severe', color: '#af2d24' }
}

function computeWellnessScore(activityMin, caloriePct, aqi, moodDev) {
  const activityScore = clamp((activityMin / 45) * 100, 0, 100)
  const nutritionScore = clamp(100 - Math.abs(1.0 - caloriePct) * 80, 0, 100)
  const envStress = clamp((aqi - 50) / 2.5, 0, 100)
  const moodDevScore = clamp(moodDev * 20, 0, 100)
  return clamp(
    activityScore * 0.35 + nutritionScore * 0.30 - envStress * 0.15 - moodDevScore * 0.20,
    0, 100
  )
}

// Generate 90-day environmental data
export const environmentalData = Array.from({ length: 90 }, (_, i) => {
  const r = rng(i * 1337)
  const aqi = clamp(generateAQI(i), 25, 450)
  const { label, color } = getAQICategory(aqi)
  const d = new Date(BASE_DATE)
  d.setDate(d.getDate() + i)
  return {
    day: i,
    date: d.toISOString().split('T')[0],
    aqi,
    aqiCategory: label,
    aqiColor: color,
    temperature: clamp(gauss(25, 8, r), 8, 42),
    humidity: clamp(gauss(55, 15, r), 20, 95),
    uvIndex: clamp(gauss(5, 2.5, r), 0, 12),
    isExamDay: EXAM_DAYS.has(i),
    isAQISpike: AQI_SPIKE_DAYS.has(i),
    outdoorSafe: aqi <= 150,
  }
})

// Generate hostel-level aggregated wellness data
export function generateHostelWellnessSeries(hostelId, days = 90) {
  const rand = rng(hostelId * 3571)
  const baseScore = 58 + rand() * 15
  return Array.from({ length: days }, (_, i) => {
    const r = rng(hostelId * 1000 + i)
    const env = environmentalData[i]
    const isExam = env.isExamDay
    const baseActivity = gauss(40, 10, r)
    const activity = clamp(isExam ? baseActivity * 0.65 : baseActivity, 0, 90)
    const calPct = clamp(gauss(0.9, 0.1, r) * (isExam ? 0.88 : 1), 0.5, 1.4)
    const baseMood = 3.2 + (rand() - 0.5) * 0.6
    const moodToday = clamp(gauss(baseMood, 0.4, r) - (isExam ? 1.0 : 0), 1, 5)
    const moodDev = Math.abs(moodToday - baseMood)
    const wellness = computeWellnessScore(activity, calPct, env.aqi, moodDev)
    const d = new Date(BASE_DATE)
    d.setDate(d.getDate() + i)
    return {
      day: i,
      date: d.toISOString().split('T')[0],
      wellnessScore: Math.round(wellness * 10) / 10,
      activityMin: Math.round(activity),
      calorieAvg: Math.round(calPct * 2000),
      moodAvg: Math.round(moodToday * 10) / 10,
      sleepHours: clamp(gauss(isExam ? 5.8 : 6.8, 0.8, r), 4, 9),
      participationRate: clamp(gauss(isExam ? 0.55 : 0.72, 0.1, r), 0.3, 1),
      studentsLogged: Math.floor(clamp(gauss(isExam ? 55 : 72, 10, r), 30, 100)),
      isExam,
    }
  })
}

// All hostels wellness data
export const hostelWellnessData = HOSTELS.reduce((acc, h) => {
  acc[h.name] = generateHostelWellnessSeries(h.id)
  return acc
}, {})

// Current hostel scores (last 7 days avg)
export const hostelCurrentScores = HOSTELS.map(h => {
  const series = hostelWellnessData[h.name]
  const last7 = series.slice(-7)
  const avg = last7.reduce((s, d) => s + d.wellnessScore, 0) / 7
  const prev7 = series.slice(-14, -7)
  const prevAvg = prev7.reduce((s, d) => s + d.wellnessScore, 0) / 7
  return {
    ...h,
    weeklyAvgScore: Math.round(avg * 10) / 10,
    trend: avg - prevAvg,
    studentsActive: last7[last7.length - 1]?.studentsLogged ?? 72,
    alerts: avg < 50 ? 2 : avg < 60 ? 1 : 0,
  }
})

// Warden-specific data
export function getWardenOverview(hostelName) {
  const series = hostelWellnessData[hostelName]
  const today = series[series.length - 1]
  const yesterday = series[series.length - 2]
  const last7 = series.slice(-7)
  const prev7 = series.slice(-14, -7)
  const weekAvg = last7.reduce((s, d) => s + d.wellnessScore, 0) / 7
  const prevWeekAvg = prev7.reduce((s, d) => s + d.wellnessScore, 0) / 7

  const scoreDistribution = {
    thriving: Math.floor(today.studentsLogged * 0.22),
    good: Math.floor(today.studentsLogged * 0.35),
    fair: Math.floor(today.studentsLogged * 0.28),
    needsAttention: Math.floor(today.studentsLogged * 0.15),
  }

  const activityTypes = [
    { type: 'Running', count: 14 },
    { type: 'Gym', count: 9 },
    { type: 'Sports', count: 7 },
    { type: 'Yoga', count: 5 },
    { type: 'Cycling', count: 3 },
  ]

  return {
    studentsLoggedToday: today.studentsLogged,
    studentsTotal: 100,
    participationToday: today.participationRate,
    participationYesterday: yesterday.participationRate,
    avgWellnessScore: Math.round(weekAvg * 10) / 10,
    wellnessTrend: weekAvg - prevWeekAvg,
    needsAttentionCount: scoreDistribution.needsAttention,
    weeklyParticipation: last7.reduce((s, d) => s + d.participationRate, 0) / 7,
    scoreDistribution,
    weeklyTrend: last7.map(d => ({ date: d.date, score: d.wellnessScore, day: d.day })),
    signals: {
      sleep: today.sleepHours,
      mood: today.moodAvg,
      outdoorActivity: environmentalData[environmentalData.length - 1].aqi,
    },
    activityToday: {
      logged: Math.floor(today.studentsLogged * 0.68),
      total: today.studentsLogged,
      types: activityTypes,
    },
  }
}

// Activity report data
export function getActivityReport(hostelName, days = 28) {
  const series = hostelWellnessData[hostelName].slice(-days)
  const env = environmentalData.slice(-days)
  const rand = rng(hostelName.charCodeAt(0) * 1000)

  return {
    dailyTrend: series.map((d, i) => ({
      date: d.date,
      avgMinutes: d.activityMin,
      participation: Math.round(d.participationRate * 100),
      outdoor: clamp(Math.round(d.activityMin * (env[i].aqi > 150 ? 0.2 : 0.6)), 0, 60),
      indoor: clamp(Math.round(d.activityMin * (env[i].aqi > 150 ? 0.8 : 0.4)), 0, 45),
    })),
    activityTypeBreakdown: [
      { week: 'W1', Running: 38, Gym: 28, Sports: 19, Yoga: 8, Cycling: 4, Walking: 3 },
      { week: 'W2', Running: 34, Gym: 31, Sports: 21, Yoga: 7, Cycling: 5, Walking: 2 },
      { week: 'W3', Running: 29, Gym: 26, Sports: 14, Yoga: 11, Cycling: 6, Walking: 14 },
      { week: 'W4', Running: 32, Gym: 29, Sports: 18, Yoga: 9, Cycling: 5, Walking: 7 },
    ],
    weeklyAQI: env.filter((_, i) => i % 7 === 0).map((e, i) => ({
      week: `W${i + 1}`,
      aqi: e.aqi,
      indoor: series[i * 7]?.activityMin ? Math.round(series[i * 7].activityMin * 0.45) : 18,
      outdoor: series[i * 7]?.activityMin ? Math.round(series[i * 7].activityMin * 0.55) : 22,
    })),
  }
}

// Meal ratings and mess data
export const mealRatingsData = Array.from({ length: 30 }, (_, i) => {
  const r = rng(i * 2053)
  const d = new Date()
  d.setDate(d.getDate() - (29 - i))
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return {
    date: d.toISOString().split('T')[0],
    day: days[d.getDay()],
    breakfast: { rating: clamp(gauss(3.6, 0.5, r), 1, 5), count: Math.floor(gauss(580, 60, r)), tag: 'Good' },
    lunch: { rating: clamp(gauss(3.4, 0.6, r), 1, 5), count: Math.floor(gauss(720, 50, r)), tag: 'Okay' },
    snacks: { rating: clamp(gauss(3.8, 0.4, r), 1, 5), count: Math.floor(gauss(490, 70, r)), tag: 'Tasty' },
    dinner: { rating: clamp(gauss(3.1, 0.7, r), 1, 5), count: Math.floor(gauss(680, 55, r)), tag: 'Bland' },
  }
})

export const messKPIs = {
  todayAvgRating: 3.4,
  ratingsCount: 1847,
  totalMealsToday: 2614,
  highestSkipMeal: 'Breakfast',
  highestSkipRate: 44,
  worstRatedMealWeek: 'Wednesday Dinner',
  worstRatedStars: 2.1,
}

export const nutrientRDA = {
  calories: { avg: 1840, rda: 2000, unit: 'kcal' },
  protein: { avg: 48, rda: 60, unit: 'g' },
  carbs: { avg: 220, rda: 275, unit: 'g' },
  fat: { avg: 62, rda: 65, unit: 'g' },
  fibre: { avg: 11, rda: 30, unit: 'g' },
}

export const macroTrend = Array.from({ length: 12 }, (_, i) => {
  const r = rng(i * 3337)
  return {
    week: `W${i + 1}`,
    protein: clamp(gauss(48, 4, r), 35, 65),
    carbs: clamp(gauss(220, 20, r), 160, 280),
    fat: clamp(gauss(62, 6, r), 45, 80),
    fibre: clamp(gauss(11, 2, r), 6, 18),
  }
})

export const feedbackTags = [
  { tag: 'Tasty', count: 1240, type: 'positive' },
  { tag: 'Good', count: 890, type: 'positive' },
  { tag: 'Fresh', count: 430, type: 'positive' },
  { tag: 'Bland', count: 680, type: 'negative' },
  { tag: 'Cold', count: 520, type: 'negative' },
  { tag: 'No Variety', count: 460, type: 'negative' },
  { tag: 'Too Oily', count: 310, type: 'negative' },
  { tag: 'Undercooked', count: 180, type: 'negative' },
  { tag: 'Okay', count: 760, type: 'neutral' },
]

// Campus-wide KPIs for Dean
export const campusKPIs = {
  studentsActive: 612,
  studentsTotal: 1000,
  campusWellnessScore: 67.3,
  wellnessTrend: 2.1,
  needsAttentionCount: 94,
  avgDailyActivity: 38,
  activityTarget: 45,
  avgSleep: 6.4,
  sleepTarget: 7,
  campusMoodIndex: 3.2,
}

// 7-week campus trends per hostel
export const campusWeeklyTrend = (() => {
  const weeks = Array.from({ length: 7 }, (_, wi) => {
    const entry = { week: `W${wi + 1}` }
    HOSTELS.forEach(h => {
      const series = hostelWellnessData[h.name]
      const start = wi * 13
      const slice = series.slice(start, start + 13)
      entry[h.name] = Math.round(slice.reduce((s, d) => s + d.wellnessScore, 0) / slice.length * 10) / 10
    })
    return entry
  })
  return weeks
})()

// Academic correlation data
export const academicCorrelationData = Array.from({ length: 90 }, (_, i) => {
  const allHostels = HOSTELS.map(h => hostelWellnessData[h.name][i].wellnessScore)
  const campusAvg = allHostels.reduce((s, v) => s + v, 0) / allHostels.length
  const r = rng(i * 9901)
  return {
    day: i,
    date: environmentalData[i].date,
    wellnessScore: Math.round(campusAvg * 10) / 10,
    moodScore: clamp(gauss(environmentalData[i].isExamDay ? 2.8 : 3.3, 0.3, r), 1, 5),
    stressLevel: clamp(gauss(environmentalData[i].isExamDay ? 3.8 : 2.4, 0.5, r), 1, 5),
    sleepHours: clamp(gauss(environmentalData[i].isExamDay ? 5.7 : 6.8, 0.6, r), 4, 9),
    activityMin: clamp(gauss(environmentalData[i].isExamDay ? 28 : 40, 8, r), 5, 65),
    isExam: environmentalData[i].isExamDay,
  }
})

export const branchWellnessTrend = BRANCHES.map(branch => {
  const baseScore = 60 + Math.random() * 12
  const examSensitivity = branch === 'CSE' || branch === 'ECE' ? 0.7 : 0.85
  return {
    branch,
    avgScore: Math.round(baseScore * 10) / 10,
    examWeekDrop: Math.round((1 - examSensitivity) * baseScore * 10) / 10,
    data: Array.from({ length: 13 }, (_, i) => {
      const r = rng(branch.charCodeAt(0) * i + 1)
      return {
        week: `W${i + 1}`,
        score: clamp(gauss(baseScore - (i === 5 || i === 11 ? baseScore * (1 - examSensitivity) : 0), 3, r), 30, 100),
      }
    }),
  }
})

// Admin alerts mock
export const adminAlerts = [
  { id: 'a1', hostel: 'BH-3', type: 'sleep_deficit', severity: 'warning', title: 'Sleep deficit persisting in BH-3', detail: 'Average sleep hours have been 6.1 for the past 6 days (threshold: 6.5 hrs)', triggeredAt: '2026-03-07', isActive: true, metricValue: 6.1, threshold: 6.5 },
  { id: 'a2', hostel: 'GH-2', type: 'mood_crisis', severity: 'critical', title: 'Sustained low mood in GH-2', detail: 'Average mood score has been below 2.5 for 4 consecutive days', triggeredAt: '2026-03-09', isActive: true, metricValue: 2.3, threshold: 2.5 },
  { id: 'a3', hostel: 'BH-5', type: 'activity_drought', severity: 'warning', title: 'Activity participation has dropped significantly', detail: 'Only 31% of BH-5 has logged activity in the past 5 days', triggeredAt: '2026-03-10', isActive: true, metricValue: 31, threshold: 35 },
  { id: 'a4', hostel: null, type: 'environmental', severity: 'info', title: 'Outdoor activity not recommended today', detail: 'Current AQI is 187 (Moderate). Advise students to exercise indoors.', triggeredAt: '2026-03-13', isActive: true, metricValue: 187, threshold: 150 },
  { id: 'a5', hostel: 'BH-1', type: 'nutrition_gap', severity: 'info', title: 'Students may be undereating this week', detail: 'Average logged calorie intake is 1,520 kcal — below 1,600 kcal threshold for 3 days', triggeredAt: '2026-03-11', isActive: true, metricValue: 1520, threshold: 1600 },
  { id: 'a6', hostel: 'GH-4', type: 'high_stress', severity: 'warning', title: 'High stress levels being reported in GH-4', detail: '54% of mood check-ins this week rated stress as high (threshold: 50%)', triggeredAt: '2026-03-08', isActive: false, acknowledgedAt: '2026-03-09', metricValue: 54, threshold: 50 },
]

// Initiatives mock
export const initiativesMock = [
  { id: 'i1', hostel: 'BH-3', title: '7-Day Sleep Challenge', goalType: 'sleep', target: 7, startDate: '2026-03-01', endDate: '2026-03-08', participationRate: 68, goalMetPct: 42 },
  { id: 'i2', hostel: 'BH-3', title: 'Morning Run Initiative', goalType: 'activity', target: 30, startDate: '2026-03-10', endDate: '2026-03-24', participationRate: 55, goalMetPct: null },
  { id: 'i3', hostel: 'BH-3', title: 'Full Nutrition Week', goalType: 'nutrition', target: 3, startDate: '2026-02-15', endDate: '2026-02-22', participationRate: 72, goalMetPct: 58 },
]

// Student portal mock
export const studentProfile = {
  id: 'stu-001',
  name: 'Radhika Goel',
  rollNumber: '2021EE10492',
  hostel: 'GH-1',
  branch: 'EE',
  year: 3,
  height: 163,
  weight: 55,
  fitnessLevel: 'intermediate',
  dietaryPreference: 'veg',
  allergens: ['dairy'],
  streakDays: 14,
  totalPoints: 2840,
}

export const studentWellnessHistory = Array.from({ length: 30 }, (_, i) => {
  const r = rng(i * 2311 + 42)
  const d = new Date()
  d.setDate(d.getDate() - (29 - i))
  const score = clamp(gauss(68, 8, r), 35, 95)
  return {
    date: d.toISOString().split('T')[0],
    wellnessScore: Math.round(score * 10) / 10,
    activityMin: Math.floor(clamp(gauss(38, 12, r), 0, 80)),
    calories: Math.floor(clamp(gauss(1850, 200, r), 1200, 2600)),
    sleep: clamp(gauss(6.8, 0.8, r), 4.5, 9),
    mood: clamp(gauss(3.4, 0.6, r), 1, 5),
  }
})

export const todayMessMenu = {
  breakfast: [
    { ...FOOD_ITEMS[12], quantity: '2 pcs' },
    { ...FOOD_ITEMS[11], quantity: '1 bowl' },
    { ...FOOD_ITEMS[16], quantity: '1 cup' },
    { ...FOOD_ITEMS[14], quantity: '1 bowl' },
  ],
  lunch: [
    { ...FOOD_ITEMS[2], quantity: '1 serving' },
    { ...FOOD_ITEMS[1], quantity: '3 pcs' },
    { ...FOOD_ITEMS[0], quantity: '1 bowl' },
    { ...FOOD_ITEMS[7], quantity: '1 serving' },
  ],
  snacks: [
    { ...FOOD_ITEMS[13], quantity: '1 bowl' },
    { ...FOOD_ITEMS[17], quantity: '1 glass' },
  ],
  dinner: [
    { ...FOOD_ITEMS[2], quantity: '1 serving' },
    { ...FOOD_ITEMS[19], quantity: '2 pcs' },
    { ...FOOD_ITEMS[3], quantity: '1 serving' },
    { ...FOOD_ITEMS[14], quantity: '1 bowl' },
  ],
}

export const weeklyMenuPlanner = {
  0: { // Monday
    breakfast: ['f13', 'f12', 'f17', 'f15'],
    lunch: ['f3', 'f2', 'f1', 'f8'],
    snacks: ['f14', 'f18'],
    dinner: ['f3', 'f20', 'f4', 'f15'],
  },
  1: { // Tuesday
    breakfast: ['f14', 'f17', 'f16'],
    lunch: ['f3', 'f2', 'f6', 'f5'],
    snacks: ['f21', 'f17'],
    dinner: ['f19', 'f9', 'f15'],
  },
  2: { // Wednesday
    breakfast: ['f24', 'f17', 'f15'],
    lunch: ['f3', 'f2', 'f7', 'f23'],
    snacks: ['f22', 'f18'],
    dinner: ['f3', 'f2', 'f10', 'f15'],
  },
  3: { // Thursday
    breakfast: ['f2', 'f1', 'f17', 'f16'],
    lunch: ['f3', 'f2', 'f4', 'f8'],
    snacks: ['f20', 'f17'],
    dinner: ['f19', 'f23', 'f15'],
  },
  4: { // Friday
    breakfast: ['f13', 'f12', 'f17', 'f15'],
    lunch: ['f3', 'f2', 'f6', 'f5'],
    snacks: ['f21', 'f18'],
    dinner: ['f3', 'f20', 'f9', 'f15'],
  },
  5: { // Saturday
    breakfast: ['f24', 'f15', 'f17'],
    lunch: ['f3', 'f2', 'f11', 'f8'],
    snacks: ['f22', 'f17'],
    dinner: ['f3', 'f2', 'f7', 'f15'],
  },
  6: { // Sunday
    breakfast: ['f14', 'f16', 'f18'],
    lunch: ['f3', 'f2', 'f4', 'f5'],
    snacks: ['f21', 'f17'],
    dinner: ['f19', 'f23', 'f10', 'f15'],
  },
}

export const moodLogHistory = Array.from({ length: 30 }, (_, i) => {
  const r = rng(i * 4567 + 99)
  const d = new Date()
  d.setDate(d.getDate() - (29 - i))
  return {
    date: d.toISOString().split('T')[0],
    morning: clamp(Math.round(gauss(3.2, 0.8, r)), 1, 5),
    evening: clamp(Math.round(gauss(3.5, 0.7, r)), 1, 5),
    stressLevel: clamp(Math.round(gauss(2.8, 0.9, r)), 1, 5),
    energyLevel: clamp(Math.round(gauss(3.1, 0.8, r)), 1, 5),
  }
})

// Anonymous hostel leaderboard
export const anonymousLeaderboard = HOSTELS.map(h => ({
  hostelName: h.name,
  type: h.type,
  avgScore: hostelCurrentScores.find(s => s.name === h.name)?.weeklyAvgScore ?? 65,
  activityRank: Math.floor(Math.random() * 10) + 1,
  streak: Math.floor(Math.random() * 21) + 3,
})).sort((a, b) => b.avgScore - a.avgScore)

export const nudges = [
  { id: 'n1', type: 'activity', message: 'You haven\'t logged any activity today. Even a 15-min walk counts!', trigger: 'no_activity_logged' },
  { id: 'n2', type: 'nutrition', message: 'You skipped breakfast today. Campus mood data shows skipping breakfast correlates with lower afternoon energy.', trigger: 'meal_skip' },
  { id: 'n3', type: 'environmental', message: 'AQI is 187 today — moderate. Consider an indoor workout instead of your usual outdoor run.', trigger: 'high_aqi' },
  { id: 'n4', type: 'mental', message: 'Your mood has been lower than your usual average for 2 days. Try a 2-min breathing exercise?', trigger: 'mood_dip' },
  { id: 'n5', type: 'sleep', message: 'You\'ve averaged 5.8 hrs sleep this week. Try a consistent 10pm–6am schedule this week.', trigger: 'sleep_deficit' },
]

export const achievements = [
  { id: 'ach1', title: '7-Day Streak', description: 'Logged data 7 days in a row', earned: true, points: 100 },
  { id: 'ach2', title: '14-Day Streak', description: 'Logged data 14 days in a row', earned: true, points: 200 },
  { id: 'ach3', title: 'Wellness Pro', description: 'Maintained score > 70 for 2 weeks', earned: true, points: 300 },
  { id: 'ach4', title: 'Activity Champion', description: 'Hit 45min/day for 5 consecutive days', earned: false, points: 150 },
  { id: 'ach5', title: 'Nutrition Master', description: 'Logged all 4 meals for 7 days', earned: false, points: 200 },
  { id: 'ach6', title: '30-Day Streak', description: 'Logged data 30 days in a row', earned: false, points: 500 },
]

export function getWellnessLabel(score) {
  if (score >= 80) return { label: 'Thriving', color: '#22c55e', bg: '#f0fdf4' }
  if (score >= 60) return { label: 'Good', color: '#84cc16', bg: '#f7fee7' }
  if (score >= 40) return { label: 'Fair', color: '#f59e0b', bg: '#fffbeb' }
  return { label: 'Needs Attention', color: '#ef4444', bg: '#fef2f2' }
}
