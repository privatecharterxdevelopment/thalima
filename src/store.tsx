import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { channels, crew } from './data/crew'
import { seed } from './data/seed'
import { position } from './data/yacht'
import { fetchWeather } from './lib/weather'
import type { AppSnapshot, Department, Task, TaskStatus, Urgency } from './types'
import { uid } from './lib/format'

const KEY = 'thalima.crew.v1'
const SESSION = 'thalima.seat'

function load(): AppSnapshot {
  const base = seed()
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSnapshot>
      Object.assign(base, {
        tasks: parsed.tasks ?? base.tasks,
        messages: parsed.messages ?? base.messages,
        log: parsed.log ?? base.log,
        systems: parsed.systems ?? base.systems,
        lastRead: parsed.lastRead ?? base.lastRead,
        theme: parsed.theme ?? base.theme,
      })
    }
  } catch {
    /* fresh */
  }
  const seat = sessionStorage.getItem(SESSION)
  base.userId = seat && crew.some((c) => c.id === seat) ? seat : null
  return base
}

type Store = AppSnapshot & {
  login: (id: string) => void
  logout: () => void
  setTheme: (theme: 'light' | 'dark') => void
  addTask: (input: {
    title: string
    body: string
    department: Department
    assigneeId: string
    urgency: Urgency
    due: string
  }) => void
  moveTask: (id: string, status: TaskStatus) => void
  addMessage: (channelId: string, text: string) => void
  markRead: (channelId: string) => void
  addLog: (text: string) => void
  reset: () => void
  user: (typeof crew)[number] | null
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<AppSnapshot>(load)

  useEffect(() => {
    const { userId, weather, ...rest } = snap
    void weather
    localStorage.setItem(KEY, JSON.stringify(rest))
    if (userId) sessionStorage.setItem(SESSION, userId)
    else sessionStorage.removeItem(SESSION)
  }, [snap])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY || !e.newValue) return
      const parsed = JSON.parse(e.newValue) as Partial<AppSnapshot>
      setSnap((s) => ({
        ...s,
        tasks: parsed.tasks ?? s.tasks,
        messages: parsed.messages ?? s.messages,
        log: parsed.log ?? s.log,
        systems: parsed.systems ?? s.systems,
        lastRead: parsed.lastRead ?? s.lastRead,
        theme: parsed.theme ?? s.theme,
      }))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = snap.theme
    document.documentElement.style.colorScheme = snap.theme
  }, [snap.theme])

  useEffect(() => {
    let stop = false
    const pull = () => {
      fetchWeather(position.lat, position.lon)
        .then((w) => {
          if (!stop) setSnap((s) => ({ ...s, weather: w }))
        })
        .catch(() => {
          /* offline: keep last */
        })
    }
    pull()
    const t = setInterval(pull, 5 * 60_000)
    return () => {
      stop = true
      clearInterval(t)
    }
  }, [])

  const login = useCallback((id: string) => {
    setSnap((s) => ({ ...s, userId: id }))
  }, [])

  const logout = useCallback(() => {
    setSnap((s) => ({ ...s, userId: null }))
  }, [])

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    setSnap((s) => ({ ...s, theme }))
  }, [])

  const addTask = useCallback(
    (input: {
      title: string
      body: string
      department: Department
      assigneeId: string
      urgency: Urgency
      due: string
    }) => {
      setSnap((s) => {
        if (!s.userId) return s
        const task: Task = {
          id: uid('t'),
          title: input.title,
          body: input.body,
          status: 'ready',
          urgency: input.urgency,
          department: input.department,
          assigneeId: input.assigneeId,
          createdBy: s.userId,
          due: input.due,
          createdAt: new Date().toISOString(),
        }
        return { ...s, tasks: [task, ...s.tasks] }
      })
    },
    [],
  )

  const moveTask = useCallback((id: string, status: TaskStatus) => {
    setSnap((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    }))
  }, [])

  const addMessage = useCallback((channelId: string, text: string) => {
    setSnap((s) => {
      if (!s.userId || !text.trim()) return s
      const key = `${s.userId}:${channelId}`
      return {
        ...s,
        messages: [
          ...s.messages,
          {
            id: uid('m'),
            channelId,
            authorId: s.userId,
            text: text.trim(),
            at: new Date().toISOString(),
          },
        ],
        lastRead: { ...s.lastRead, [key]: new Date().toISOString() },
      }
    })
  }, [])

  const markRead = useCallback((channelId: string) => {
    setSnap((s) => {
      if (!s.userId) return s
      return {
        ...s,
        lastRead: { ...s.lastRead, [`${s.userId}:${channelId}`]: new Date().toISOString() },
      }
    })
  }, [])

  const addLog = useCallback((text: string) => {
    setSnap((s) => {
      if (!s.userId || !text.trim()) return s
      return {
        ...s,
        log: [
          {
            id: uid('l'),
            at: new Date().toISOString(),
            authorId: s.userId,
            text: text.trim(),
          },
          ...s.log,
        ],
      }
    })
  }, [])

  const reset = useCallback(() => {
    const next = seed()
    next.theme = snap.theme
    next.userId = snap.userId
    setSnap(next)
  }, [snap.theme, snap.userId])

  const user = crew.find((c) => c.id === snap.userId) ?? null

  const value = useMemo(
    () => ({
      ...snap,
      login,
      logout,
      setTheme,
      addTask,
      moveTask,
      addMessage,
      markRead,
      addLog,
      reset,
      user,
    }),
    [snap, login, logout, setTheme, addTask, moveTask, addMessage, markRead, addLog, reset, user],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('store')
  return ctx
}

export { crew, channels }
