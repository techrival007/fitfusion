import { createContext, useContext, useState } from 'react'

const AdminAuthContext = createContext(null)
const STORAGE_KEY = 'univitals_admin_user'

const DEMO_ACCOUNTS = {
  'warden@bh3.edu': { password: 'warden123', role: 'warden', name: 'Mr. Suresh Kumar', hostelId: 'BH-3' },
  'mess@campus.edu': { password: 'mess123', role: 'mess_manager', name: 'Mrs. Priya Sharma', hostelId: null },
  'dean@campus.edu': { password: 'dean123', role: 'dean', name: 'Prof. Ashok Verma', hostelId: null },
}

const loadUser = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) } catch { return null }
}

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  const login = (email, password) => {
    const account = DEMO_ACCOUNTS[email]
    if (account && account.password === password) {
      const u = { email, ...account }
      setUser(u)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
      return { success: true, role: account.role }
    }
    return { success: false }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AdminAuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => useContext(AdminAuthContext)
