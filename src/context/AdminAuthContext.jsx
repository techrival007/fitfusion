import { createContext, useContext, useState } from "react";
import { loginAdmin } from "../api/auth";

const AdminAuthContext = createContext(null);
const STORAGE_KEY = "univitals_admin_user";
const TOKEN_KEY   = "admin_token";

const loadUser = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const login = async (email, password) => {
    try {
      const data = await loginAdmin(email, password);
      localStorage.setItem(TOKEN_KEY, data.token);
      const payload = JSON.parse(atob(data.token.split(".")[1]));
      setUser(payload);
      return { success: true, role: payload.role };
    } catch (err) {
      // Fallback to demo accounts when backend is unreachable
      const DEMO = {
        "warden.bh3@iitd.ac.in": { password: "admin123", role: "warden",       name: "Warden BH-3",     hostel_id: "BH-3" },
        "mess@iitd.ac.in":        { password: "admin123", role: "mess_manager", name: "Mess Manager",     hostel_id: null },
        "dean@iitd.ac.in":        { password: "admin123", role: "dean",         name: "Dean of Students", hostel_id: null },
      };
      const acc = DEMO[email];
      if (acc && acc.password === password) {
        const fakeUser = { role: acc.role, name: acc.name, hostel_id: acc.hostel_id, sub: "demo", exp: Date.now() / 1000 + 86400 };
        setUser(fakeUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fakeUser));
        return { success: true, role: acc.role };
      }
      return { success: false, error: "Invalid credentials" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AdminAuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);
