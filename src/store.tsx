import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { channels, crew, statusLabel } from './data/crew'
import { seed } from './data/seed'
import { opsSeed } from './data/ops'
import { keepMessages } from './lib/chat'
import { inferKind, normalizeTask } from './lib/opsTasks'
import { fetchWeather } from './lib/weather'
import { currentFix, subscribeFix } from './lib/ais'
import { haversineNm } from './lib/geo'
import type {
  AppSnapshot,
  AttachedFile,
  CalEvent,
  CalRole,
  CloudDoc,
  Department,
  DrillKind,
  Handover,
  OpsState,
  PurchaseStatus,
  Task,
  TaskKind,
  TaskNote,
  TaskStatus,
  Urgency,
  AwaitReason,
  DueKind,
  TaskEvent,
  TaskRecur,
} from './types'
import { punchStatus, taskAssignees, tasksSeenKey, uid } from './lib/format'
import { noticeSeenKey } from './lib/notices'

const KEY = 'thalima.crew.v1'
const SESSION = 'thalima.seat'
const KEEP = 'thalima.seat.keep'

function taskNote(authorId: string, text: string, kind: TaskNote['kind'] = 'note'): TaskNote {
  return { id: uid('n'), authorId, text, at: new Date().toISOString(), kind }
}

function namesFor(ids: string[]) {
  return ids
    .map((id) => crew.find((c) => c.id === id)?.name.split(' ')[0])
    .filter(Boolean)
    .join(', ')
}

function withNote(task: Task, note: TaskNote): Task {
  return { ...task, notes: [...(task.notes ?? []), note] }
}

function load(): AppSnapshot {
  const base = seed()
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSnapshot>
      const seedById = new Map(base.tasks.map((t) => [t.id, t]))
      const savedTasks = (parsed.tasks ?? base.tasks).map((t) => {
        const ids = t.assigneeIds?.length ? t.assigneeIds : t.assigneeId ? [t.assigneeId] : []
        const seed = seedById.get(t.id)
        const merged = seed
          ? {
              ...seed,
              ...t,
              assigneeIds: ids,
              assigneeId: ids[0] ?? t.assigneeId,
              kind: t.kind ?? seed.kind,
              dueKind: t.dueKind ?? seed.dueKind,
              dueHours: t.dueHours ?? seed.dueHours,
              dueAssetId: t.dueAssetId ?? seed.dueAssetId,
              recur: t.recur ?? seed.recur,
              eventCue: t.eventCue ?? seed.eventCue,
              ownerRequest: t.ownerRequest ?? seed.ownerRequest,
              awaitReason: t.awaitReason ?? seed.awaitReason,
              notes: t.notes?.length ? t.notes : (seed.notes ?? []),
              startedAt:
                t.startedAt && t.startedAt !== t.createdAt ? t.startedAt : (seed.startedAt ?? t.startedAt),
              workedMs: t.workedMs ?? seed.workedMs,
              title: seed.title,
              body: seed.body,
              due: seed.due,
              urgency: seed.urgency,
              department: seed.department,
            }
          : { ...t, assigneeIds: ids, assigneeId: ids[0] ?? t.assigneeId }
        return normalizeTask(merged)
      })
      const have = new Set(savedTasks.map((t) => t.id))
      const savedOps = parsed.ops
      const baseOps = opsSeed()
      Object.assign(base, {
        tasks: [...savedTasks, ...base.tasks.filter((t) => !have.has(t.id))].map(normalizeTask),
        messages: keepMessages(parsed.messages ?? base.messages),
        log: parsed.log ?? base.log,
        events: parsed.events
          ? [
              ...parsed.events,
              ...base.events.filter((e) => !parsed.events!.some((p) => p.id === e.id)),
            ]
          : base.events,
        systems: parsed.systems ?? base.systems,
        lastRead: parsed.lastRead ?? base.lastRead,
        seenNotices: parsed.seenNotices ?? base.seenNotices,
        theme: parsed.theme ?? base.theme,
        docs: parsed.docs
          ? [
              ...parsed.docs,
              ...base.docs.filter((d) => !parsed.docs!.some((p) => p.id === d.id)),
            ]
          : base.docs,
        ops: savedOps
          ? {
              equipment: savedOps.equipment ?? baseOps.equipment,
              services: savedOps.services ?? baseOps.services,
              defects: savedOps.defects ?? baseOps.defects,
              spares: savedOps.spares ?? baseOps.spares,
              certificates: savedOps.certificates ?? baseOps.certificates,
              leave: savedOps.leave ?? baseOps.leave,
              handovers: savedOps.handovers ?? baseOps.handovers,
              provisions: savedOps.provisions ?? baseOps.provisions,
              purchases: savedOps.purchases ?? baseOps.purchases,
              contacts: savedOps.contacts ?? baseOps.contacts,
              drills: savedOps.drills ?? baseOps.drills,
              trips: savedOps.trips ?? baseOps.trips,
            }
          : baseOps,
      })
    }
  } catch {
    /* fresh */
  }
  try {
    const keep = localStorage.getItem(KEEP)
    const seat = (keep && crew.some((c) => c.id === keep) ? keep : null) ?? sessionStorage.getItem(SESSION)
    base.userId = seat && crew.some((c) => c.id === seat) ? seat : null
  } catch {
    base.userId = null
  }
  return base
}

type Store = AppSnapshot & {
  login: (id: string, remember?: boolean) => void
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
    kind?: TaskKind
    awaitReason?: AwaitReason
    dueKind?: DueKind
    dueHours?: number
    dueAssetId?: string
    recur?: TaskRecur
    eventCue?: TaskEvent
    ownerRequest?: boolean
  }) => string
  moveTask: (id: string, status: TaskStatus) => void
  updateTask: (id: string, patch: Partial<Pick<Task, 'status' | 'urgency' | 'assigneeId' | 'assigneeIds' | 'department' | 'body' | 'title' | 'due' | 'files' | 'kind' | 'awaitReason' | 'dueKind' | 'dueHours' | 'dueAssetId' | 'recur' | 'eventCue' | 'ownerRequest'>>) => void
  addTaskNote: (id: string, text: string) => void
  addMessage: (channelId: string, text: string) => void
  markRead: (channelId: string) => void
  markTasksSeen: () => void
  markNoticeSeen: (id: string) => void
  addLog: (text: string) => void
  addEvent: (input: { title: string; body: string; role: CalRole; start: string; end: string }) => void
  removeEvent: (id: string) => void
  addDoc: (doc: CloudDoc) => void
  removeDoc: (id: string) => void
  setPurchaseStatus: (id: string, status: PurchaseStatus) => void
  addHandover: (input: { toId: string; body: string }) => void
  addDrill: (input: { kind: DrillKind; note: string }) => void
  setTripPrepped: (id: string) => void
  reset: () => void
  user: (typeof crew)[number] | null
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<AppSnapshot>(load)

  useEffect(() => {
    setSnap((s) => {
      const messages = keepMessages(s.messages)
      if (messages.length === s.messages.length) return s
      return { ...s, messages }
    })
  }, [])

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
        messages: keepMessages(parsed.messages ?? s.messages),
        log: parsed.log ?? s.log,
        events: parsed.events ?? s.events,
        systems: parsed.systems ?? s.systems,
        lastRead: parsed.lastRead ?? s.lastRead,
        seenNotices: parsed.seenNotices ?? s.seenNotices,
        theme: parsed.theme ?? s.theme,
        docs: parsed.docs ?? s.docs,
        ops: parsed.ops ?? s.ops,
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

  const login = useCallback((id: string, remember = true) => {
    try {
      if (remember) localStorage.setItem(KEEP, id)
      else localStorage.removeItem(KEEP)
    } catch {
      /* private mode */
    }
    setSnap((s) => ({ ...s, userId: id }))
  }, [])

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(KEEP)
    } catch {
      /* private mode */
    }
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
      kind?: TaskKind
      awaitReason?: AwaitReason
      dueKind?: DueKind
      dueHours?: number
      dueAssetId?: string
      recur?: TaskRecur
      eventCue?: TaskEvent
      ownerRequest?: boolean
    }) => {
      const id = uid('t')
      setSnap((s) => {
        if (!s.userId) return s
        const ids = input.assigneeIds?.length ? input.assigneeIds : [input.assigneeId]
        const who = namesFor(ids)
        const opened = taskNote(s.userId, who ? `Opened · ${who}` : 'Opened', 'assign')
        const task: Task = {
          id,
          title: input.title,
          body: input.body,
          status: 'open',
          urgency: input.urgency,
          kind: input.kind ?? inferKind(input.title, input.body, input.department),
          department: input.department,
          assigneeId: ids[0] ?? input.assigneeId,
          assigneeIds: ids,
          files: input.files ?? [],
          notes: [opened],
          createdBy: s.userId,
          due: input.due,
          createdAt: new Date().toISOString(),
          workedMs: 0,
          awaitReason: input.awaitReason,
          dueKind: input.dueKind,
          dueHours: input.dueHours,
          dueAssetId: input.dueAssetId,
          recur: input.recur,
          eventCue: input.eventCue,
          ownerRequest: input.ownerRequest,
        }
        return { ...s, tasks: [task, ...s.tasks] }
      })
      return id
    },
    [],
  )

  const moveTask = useCallback((id: string, status: TaskStatus) => {
    setSnap((s) => ({
      ...s,
      tasks: s.tasks.map((t) => {
        if (t.id !== id) return t
        const next = punchStatus(t, status)
        if (!s.userId || t.status === status) return next
        return withNote(next, taskNote(s.userId, statusLabel[status] ?? status, 'status'))
      }),
    }))
  }, [])

  const updateTask = useCallback(
    (id: string, patch: Partial<Pick<Task, 'status' | 'urgency' | 'assigneeId' | 'assigneeIds' | 'department' | 'body' | 'title' | 'due' | 'files' | 'kind' | 'awaitReason' | 'dueKind' | 'dueHours' | 'dueAssetId' | 'recur' | 'eventCue' | 'ownerRequest'>>) => {
      setSnap((s) => ({
        ...s,
        tasks: s.tasks.map((t) => {
          if (t.id !== id) return t
          let next: Task = { ...t, ...patch }
          if (patch.assigneeIds?.length) next.assigneeId = patch.assigneeIds[0]
          if (patch.status && patch.status !== t.status) {
            next = { ...punchStatus(t, patch.status), ...patch, status: patch.status }
            if (patch.assigneeIds?.length) next.assigneeId = patch.assigneeIds[0]
          }
          if (!s.userId) return next
          if (patch.status && patch.status !== t.status) {
            next = withNote(next, taskNote(s.userId, statusLabel[patch.status] ?? patch.status, 'status'))
          }
          if (patch.assigneeIds) {
            const before = taskAssignees(t).join(',')
            const after = taskAssignees(next).join(',')
            if (before !== after) {
              next = withNote(next, taskNote(s.userId, `Assigned to ${namesFor(taskAssignees(next))}`, 'assign'))
            }
          }
          if (patch.files && (patch.files.length ?? 0) > (t.files?.length ?? 0)) {
            const added = patch.files.filter((f) => !(t.files ?? []).some((x) => x.id === f.id))
            if (added.length) {
              next = withNote(next, taskNote(s.userId, `Attached ${added.map((f) => f.name).join(', ')}`, 'file'))
            }
          }
          return next
        }),
      }))
    },
    [],
  )

  const addTaskNote = useCallback((id: string, text: string) => {
    const body = text.trim()
    if (!body) return
    setSnap((s) => {
      if (!s.userId) return s
      return {
        ...s,
        tasks: s.tasks.map((t) => (t.id === id ? withNote(t, taskNote(s.userId!, body)) : t)),
      }
    })
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

  const markTasksSeen = useCallback(() => {
    setSnap((s) => {
      if (!s.userId) return s
      return {
        ...s,
        lastRead: { ...s.lastRead, [tasksSeenKey(s.userId)]: new Date().toISOString() },
      }
    })
  }, [])

  const markNoticeSeen = useCallback((id: string) => {
    setSnap((s) => {
      if (!s.userId) return s
      const key = noticeSeenKey(s.userId, id)
      const seen = s.seenNotices ?? {}
      if (seen[key]) return s
      return {
        ...s,
        seenNotices: { ...seen, [key]: new Date().toISOString() },
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

  const patchOps = useCallback((fn: (ops: OpsState) => OpsState) => {
    setSnap((s) => ({ ...s, ops: fn(s.ops) }))
  }, [])

  const setPurchaseStatus = useCallback((id: string, status: PurchaseStatus) => {
    patchOps((ops) => ({
      ...ops,
      purchases: ops.purchases.map((p) => (p.id === id ? { ...p, status } : p)),
    }))
  }, [patchOps])

  const addHandover = useCallback((input: { toId: string; body: string }) => {
    setSnap((s) => {
      if (!s.userId || !input.body.trim()) return s
      const row: Handover = {
        id: uid('ho'),
        fromId: s.userId,
        toId: input.toId,
        at: new Date().toISOString(),
        body: input.body.trim(),
      }
      return {
        ...s,
        ops: { ...s.ops, handovers: [row, ...s.ops.handovers] },
        log: [
          {
            id: uid('l'),
            at: new Date().toISOString(),
            authorId: s.userId,
            text: `Handover to ${crew.find((c) => c.id === input.toId)?.name ?? input.toId}: ${input.body.trim()}`,
          },
          ...s.log,
        ],
      }
    })
  }, [])

  const addDrill = useCallback((input: { kind: DrillKind; note: string }) => {
    setSnap((s) => {
      if (!s.userId) return s
      const labels: Record<DrillKind, string> = {
        fire: 'Fire drill',
        mob: 'MOB drill',
        abandon: 'Abandon ship',
        first_aid: 'First aid',
        safety_check: 'Safety equipment check',
      }
      return {
        ...s,
        ops: {
          ...s.ops,
          drills: [
            {
              id: uid('dr'),
              kind: input.kind,
              at: new Date().toISOString(),
              by: s.userId,
              note: input.note.trim(),
            },
            ...s.ops.drills,
          ],
        },
        log: [
          {
            id: uid('l'),
            at: new Date().toISOString(),
            authorId: s.userId,
            text: `${labels[input.kind]}${input.note.trim() ? ` — ${input.note.trim()}` : ''}`,
          },
          ...s.log,
        ],
      }
    })
  }, [])

  const setTripPrepped = useCallback((id: string) => {
    patchOps((ops) => ({
      ...ops,
      trips: ops.trips.map((t) => (t.id === id ? { ...t, prepped: true } : t)),
    }))
  }, [patchOps])

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
      ops: snap.ops ?? opsSeed(),
      seenNotices: snap.seenNotices ?? {},
      login,
      logout,
      setTheme,
      addTask,
      moveTask,
      updateTask,
      addTaskNote,
      addMessage,
      markRead,
      markTasksSeen,
      markNoticeSeen,
      addLog,
      addEvent,
      removeEvent,
      addDoc,
      removeDoc,
      setPurchaseStatus,
      addHandover,
      addDrill,
      setTripPrepped,
      reset,
      user,
    }),
    [snap, login, logout, setTheme, addTask, moveTask, updateTask, addTaskNote, addMessage, markRead, markTasksSeen, markNoticeSeen, addLog, addEvent, removeEvent, addDoc, removeDoc, setPurchaseStatus, addHandover, addDrill, setTripPrepped, reset, user],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('store')
  return ctx
}

export { crew, channels }
