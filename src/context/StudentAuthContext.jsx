import { createContext, useContext, useState } from 'react'
import { studentLogin } from '../api/student'

const StudentAuthContext = createContext(null)
const TOKEN_KEY   = 'student_token'
const STORAGE_KEY = 'univitals_student_user'

// Demo credentials (also seeded in DB: roll=2021EE10492, password=student123)
const DEMO = {
  '2021EE10492': { password: 'student123', name: 'Aditya Kumar', hostel: 'BH-3', branch: 'EE', year: 3 }
}

const loadUser = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp * 1000 > Date.now()) return payload
      localStorage.removeItem(TOKEN_KEY)
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch { return null }
}

export function StudentAuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  const login = async (rollNumber, password) => {
    try {
      const data = await studentLogin(rollNumber, password)
      localStorage.setItem(TOKEN_KEY, data.token)
      const payload = JSON.parse(atob(data.token.split('.')[1]))
      const merged = { ...payload, name: data.name, hostel: data.hostel, branch: data.branch, year: data.year, roll_number: data.roll_number, streakDays: 1 }
      setUser(merged)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      return { success: true }
    } catch {
      const demo = DEMO[rollNumber]
      if (demo && demo.password === password) {
        const fakeUser = {
          sub: 'demo', role: 'student', name: demo.name, hostel: demo.hostel,
          branch: demo.branch, year: demo.year, roll_number: rollNumber, streakDays: 5,
          exp: Date.now() / 1000 + 86400,
        }
        setUser(fakeUser)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fakeUser))
        return { success: true }
      }
      return { success: false, error: 'Invalid credentials' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <StudentAuthContext.Provider value={{ user, login, logout }}>
      {children}
    </StudentAuthContext.Provider>
  )
}

export const useStudentAuth = () => useContext(StudentAuthContext)
