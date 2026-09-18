import { Moon, Sun } from 'lucide-react'
import { useStore } from '../store'

export function ThemeToggle() {
  const { theme, setTheme } = useStore()
  const next = theme === 'light' ? 'dark' : 'light'
  return (
    <button
      className="theme-btn"
      onClick={() => setTheme(next)}
      aria-label={next === 'dark' ? 'Switch to night watch' : 'Switch to day'}
      title={next === 'dark' ? 'Night' : 'Day'}
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  )
}
