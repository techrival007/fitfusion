import { createContext, useContext, useState } from 'react'
import { studentProfile } from '../data/mockData'

const StudentAuthContext = createContext(null)
const STORAGE_KEY = 'univitals_student_user'

const loadUser = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

export function StudentAuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  const login = (rollNumber, password) => {
    if (rollNumber === '2021EE10492' && password === 'student123') {
      setUser(studentProfile)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(studentProfile))
      return { success: true }
    }
    return { success: false }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <StudentAuthContext.Provider value={{ user, login, logout }}>
      {children}
    </StudentAuthContext.Provider>
  )
}

export const useStudentAuth = () => useContext(StudentAuthContext)
