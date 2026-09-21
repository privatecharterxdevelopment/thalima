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
import { fetchWeather } from './lib/weather'
import { currentFix, subscribeFix } from './lib/ais'
import { haversineNm } from './lib/geo'
import type { AppSnapshot, AttachedFile, CalEvent, CalRole, CloudDoc, Department, Task, TaskStatus, Urgency } from './types'
import { tasksSeenKey, uid } from './lib/format'

const KEY = 'thalima.crew.v1'
const SESSION = 'thalima.seat'

function load(): AppSnapshot {
  const base = seed()
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSnapshot>
      const savedTasks = (parsed.tasks ?? base.tasks).map((t) => {
        const ids = t.assigneeIds?.length ? t.assigneeIds : t.assigneeId ? [t.assigneeId] : []
        return { ...t, assigneeIds: ids, assigneeId: ids[0] ?? t.assigneeId }
      })
      const have = new Set(savedTasks.map((t) => t.id))
      Object.assign(base, {
        tasks: [...savedTasks, ...base.tasks.filter((t) => !have.has(t.id))],
        messages: parsed.messages ?? base.messages,
        log: parsed.log ?? base.log,
        events: parsed.events
          ? [
              ...parsed.events,
              ...base.events.filter((e) => !parsed.events!.some((p) => p.id === e.id)),
            ]
          : base.events,
        systems: parsed.systems ?? base.systems,
        lastRead: parsed.lastRead ?? base.lastRead,
        theme: parsed.theme ?? base.theme,
        docs: parsed.docs
          ? [
              ...parsed.docs,
              ...base.docs.filter((d) => !parsed.docs!.some((p) => p.id === d.id)),
            ]
          : base.docs,
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
    assigneeIds?: string[]
    files?: AttachedFile[]
    urgency: Urgency
    due: string
  }) => void
  moveTask: (id: string, status: TaskStatus) => void
  updateTask: (id: string, patch: Partial<Pick<Task, 'status' | 'urgency' | 'assigneeId' | 'assigneeIds' | 'department' | 'body' | 'title' | 'due' | 'files'>>) => void
  addMessage: (channelId: string, text: string) => void
  markRead: (channelId: string) => void
  markTasksSeen: () => void
  addLog: (text: string) => void
  addEvent: (input: { title: string; body: string; role: CalRole; start: string; end: string }) => void
  removeEvent: (id: string) => void
  addDoc: (doc: CloudDoc) => void
  removeDoc: (id: string) => void
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
        events: parsed.events ?? s.events,
        systems: parsed.systems ?? s.systems,
        lastRead: parsed.lastRead ?? s.lastRead,
        theme: parsed.theme ?? s.theme,
        docs: parsed.docs ?? s.docs,
      }))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = snap.theme
    document.documentElement.style.colorScheme = snap.theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      snap.theme === 'dark' ? '#0c0e13' : '#f3f4f7',
    )
  }, [snap.theme])

  useEffect(() => {
    let stop = false
    let lastAt = { lat: Number.NaN, lon: Number.NaN }
    const apply = (lat: number, lon: number) => {
      fetchWeather(lat, lon)
        .then((w) => {
          if (!stop) setSnap((s) => ({ ...s, weather: w }))
        })
        .catch(() => {
          /* offline: keep last */
        })
    }
    const unsub = subscribeFix((fix) => {
      if (stop) return
      const first = Number.isNaN(lastAt.lat)
      if (!first && haversineNm(lastAt, fix) * 1852 < 1200) return
      lastAt = { lat: fix.lat, lon: fix.lon }
      apply(fix.lat, fix.lon)
    })
    const t = setInterval(() => {
      const fix = currentFix()
      apply(fix.lat, fix.lon)
    }, 5 * 60_000)
    return () => {
      stop = true
      unsub()
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
      assigneeIds?: string[]
      files?: AttachedFile[]
      urgency: Urgency
      due: string
    }) => {
      setSnap((s) => {
        if (!s.userId) return s
        const ids = input.assigneeIds?.length ? input.assigneeIds : [input.assigneeId]
        const task: Task = {
          id: uid('t'),
          title: input.title,
          body: input.body,
          status: 'ready',
          urgency: input.urgency,
          department: input.department,
          assigneeId: ids[0] ?? input.assigneeId,
          assigneeIds: ids,
          files: input.files ?? [],
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
      tasks: s.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              completedAt: status === 'done' ? new Date().toISOString() : undefined,
            }
          : t,
      ),
    }))
  }, [])

  const updateTask = useCallback(
    (id: string, patch: Partial<Pick<Task, 'status' | 'urgency' | 'assigneeId' | 'assigneeIds' | 'department' | 'body' | 'title' | 'due' | 'files'>>) => {
      setSnap((s) => ({
        ...s,
        tasks: s.tasks.map((t) => {
          if (t.id !== id) return t
          const next = { ...t, ...patch }
          if (patch.assigneeIds?.length) next.assigneeId = patch.assigneeIds[0]
          if (patch.status === 'done') next.completedAt = new Date().toISOString()
          if (patch.status && patch.status !== 'done') next.completedAt = undefined
          return next
        }),
      }))
    },
    [],
  )

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

  const markTasksSeen = useCallback(() => {
    setSnap((s) => {
      if (!s.userId) return s
      return {
        ...s,
        lastRead: { ...s.lastRead, [tasksSeenKey(s.userId)]: new Date().toISOString() },
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

  const addEvent = useCallback((input: { title: string; body: string; role: CalRole; start: string; end: string }) => {
    setSnap((s) => {
      if (!s.userId) return s
      const event: CalEvent = {
        id: uid('c'),
        title: input.title,
        body: input.body,
        role: input.role,
        start: input.start,
        end: input.end,
        createdBy: s.userId,
      }
      return { ...s, events: [...s.events, event] }
    })
  }, [])

  const removeEvent = useCallback((id: string) => {
    setSnap((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }))
  }, [])

  const addDoc = useCallback((doc: CloudDoc) => {
    setSnap((s) => ({ ...s, docs: [doc, ...(s.docs ?? [])] }))
  }, [])

  const removeDoc = useCallback((id: string) => {
    setSnap((s) => ({ ...s, docs: (s.docs ?? []).filter((d) => d.id !== id) }))
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
      events: snap.events ?? [],
      docs: snap.docs ?? [],
      login,
      logout,
      setTheme,
      addTask,
      moveTask,
      updateTask,
      addMessage,
      markRead,
      markTasksSeen,
      addLog,
      addEvent,
      removeEvent,
      addDoc,
      removeDoc,
      reset,
      user,
    }),
    [snap, login, logout, setTheme, addTask, moveTask, updateTask, addMessage, markRead, markTasksSeen, addLog, addEvent, removeEvent, addDoc, removeDoc, reset, user],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('store')
  return ctx
}

export { crew, channels }
