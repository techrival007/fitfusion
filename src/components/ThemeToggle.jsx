import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const STORAGE_KEY = 'fitfusion-theme'

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'

  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY)
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme
  } catch {}

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    const isDark = theme === 'dark'
    document.documentElement.classList.toggle('dark', isDark)

    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {}
  }, [theme])

  return (
    <button
      type="button"
      onClick={() => setTheme(current => (current === 'dark' ? 'light' : 'dark'))}
      className="fixed top-4 right-4 z-[70] flex items-center gap-2 border border-[#E5E7EB] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#6B7280] shadow-sm transition-all hover:border-[#111827] hover:text-[#111827]"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  )
}
