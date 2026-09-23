import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { channels, crew, resetCrew, setLiveCrew, statusLabel } from './data/crew'
import { api, recordActivity } from './lib/api'
import { expenseMailFrom, notifyChat, notifyExpenseApproval, notifyTaskAssigned } from './lib/notify'
import { seed } from './data/seed'
import { opsSeed } from './data/ops'
import { expensesSeed } from './data/accounting'
import { rosterSeed } from './data/roster'
import { chatRecipients, keepMessages } from './lib/chat'
import { pickOps, type DeletedIds } from './lib/opsSync'
import { inferKind } from './lib/opsTasks'
import { fetchWeather } from './lib/weather'
import { currentFix, subscribeFix } from './lib/ais'
import { haversineNm } from './lib/geo'
import {
  defaultApproverId,
  emptyDraftExpense,
  expenseAudit,
  expenseCategoryLabel,
  missingExpenseFields,
  nextExpenseRef,
} from './lib/accounting'
import { addDays, dutyOf, presenceOf, rosterAudit, selfStatusLabel } from './lib/roster'
import { romeDay } from './lib/opsTasks'
import type {
  AppSnapshot,
  AttachedFile,
  CalEvent,
  CalRole,
  CloudDoc,
  Department,
  DrillKind,
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  Handover,
  OpsState,
  PurchaseStatus,
  PurchaseRequest,
  ProvisionItem,
  StockItem,
  RosterEntry,
  SelfStatus,
  AbsenceReason,
  RosterKind,
  Task,
  Trip,
  TripNote,
  TaskKind,
  TaskNote,
  TaskStatus,
  Urgency,
  AwaitReason,
  DueKind,
  TaskEvent,
  TaskRecur,
} from './types'
import { punchStatus, stationsOf, taskAssignees, tasksSeenKey, uid } from './lib/format'
import { emergencyDismissKey, noticeSeenKey } from './lib/notices'
import { applyHtmlTheme, readNight, writeTheme } from './lib/siteCopy'

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

function tripNote(authorId: string, text: string, kind: TripNote['kind'] = 'note'): TripNote {
  return { id: uid('tn'), authorId, text, at: new Date().toISOString(), kind }
}

function withTripLog(trip: Trip, note: TripNote): Trip {
  const log = [...(trip.log ?? [])]
  const last = log[log.length - 1]
  if (note.kind === 'edit' && last?.kind === 'edit' && last.authorId === note.authorId) {
    log[log.length - 1] = { ...last, text: note.text, at: note.at }
  } else {
    log.push(note)
  }
  return { ...trip, log }
}

function guestLabel(g: { name: string }) {
  return g.name.trim() || 'Guest'
}

function describeTripPatch(
  prev: Trip,
  patch: Partial<
    Pick<Trip, 'title' | 'from' | 'to' | 'ownerAboard' | 'guests' | 'transfers' | 'reservations' | 'notes' | 'prepped'>
  >,
): { text: string; kind: TripNote['kind'] } | null {
  if (patch.guests) {
    const before = prev.guests
    const after = patch.guests
    if (after.length > before.length) {
      const added = after[after.length - 1]
      return { text: `Added guest ${guestLabel(added)}`, kind: 'guest' }
    }
    if (after.length < before.length) {
      const afterKeys = new Set(after.map((g) => g.id ?? g.name))
      const removed = before.find((g) => !afterKeys.has(g.id ?? g.name)) ?? before[before.length - 1]
      return { text: `Removed guest ${guestLabel(removed)}`, kind: 'guest' }
    }
    const changed = after.find((g, i) => {
      const b = before[i]
      if (!b) return true
      return (
        g.name !== b.name ||
        g.cabin !== b.cabin ||
        g.diet !== b.diet ||
        g.allergy !== b.allergy ||
        g.laundry !== b.laundry
      )
    })
    if (changed) return { text: `Updated guest ${guestLabel(changed)}`, kind: 'guest' }
    return null
  }
  if (patch.title !== undefined && patch.title !== prev.title) {
    return { text: `Changed title to “${patch.title.trim() || 'Untitled'}”`, kind: 'edit' }
  }
  if (patch.from !== undefined && patch.from !== prev.from) {
    return { text: 'Updated start', kind: 'edit' }
  }
  if (patch.to !== undefined && patch.to !== prev.to) {
    return { text: 'Updated end', kind: 'edit' }
  }
  if (patch.ownerAboard !== undefined && patch.ownerAboard !== prev.ownerAboard) {
    return {
      text: patch.ownerAboard ? 'Set owner aboard' : 'Set charter / guests',
      kind: 'edit',
    }
  }
  if (patch.transfers !== undefined && patch.transfers !== prev.transfers) {
    return { text: patch.transfers.trim() ? 'Updated transfers' : 'Cleared transfers', kind: 'edit' }
  }
  if (patch.reservations !== undefined && patch.reservations !== prev.reservations) {
    return {
      text: patch.reservations.trim() ? 'Updated reservations' : 'Cleared reservations',
      kind: 'edit',
    }
  }
  if (patch.notes !== undefined && patch.notes !== prev.notes) {
    return { text: patch.notes.trim() ? 'Updated notes' : 'Cleared notes', kind: 'edit' }
  }
  if (patch.prepped !== undefined && patch.prepped && !prev.prepped) {
    return { text: 'Prep tasks created', kind: 'prep' }
  }
  return null
}

function load(): AppSnapshot {
  const base = seed()
  base.userId = null
  base.theme = readNight() ? 'dark' : 'light'
  applyHtmlTheme(base.theme)
  return base
}

type Store = AppSnapshot & {
  authReady: boolean
  signIn: (email: string, password: string, remember?: boolean) => Promise<string | null>
  refreshPeople: () => Promise<void>
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
  dismissEmergency: (taskId: string) => void
  claimEmergency: (taskId: string) => void
  addLog: (text: string) => void
  addEvent: (input: { title: string; body: string; role: CalRole; start: string; end: string }) => void
  removeEvent: (id: string) => void
  addDoc: (doc: CloudDoc) => void
  removeDoc: (id: string) => void
  setPurchaseStatus: (id: string, status: PurchaseStatus) => void
  addHandover: (input: { toId: string; body: string }) => void
  addDrill: (input: { kind: DrillKind; note: string }) => void
  setTripPrepped: (id: string) => void
  addTrip: (input: Omit<Trip, 'id' | 'prepped' | 'log'>) => string
  updateTrip: (
    id: string,
    patch: Partial<
      Pick<Trip, 'title' | 'from' | 'to' | 'ownerAboard' | 'guests' | 'transfers' | 'reservations' | 'notes' | 'prepped'>
    >,
  ) => void
  addTripNote: (id: string, text: string) => void
  addStockItem: (
    input: { kind: 'technical'; row: Omit<StockItem, 'id'> } | { kind: 'provisioning'; row: Omit<ProvisionItem, 'id'> },
  ) => void
  addPurchase: (input: Pick<PurchaseRequest, 'title' | 'supplier' | 'amount' | 'currency' | 'category' | 'note'>) => void
  addReceipt: (file: AttachedFile) => string
  addManualExpense: (input: {
    vendor: string
    date: string
    amount: number
    currency: string
    eurAmount: number
    vat: number | null
    category: ExpenseCategory
    description: string
    receipt?: AttachedFile
    approverId: string
  }) => string
  updateExpense: (
    id: string,
    patch: Partial<
      Pick<
        Expense,
        | 'vendor'
        | 'date'
        | 'category'
        | 'amount'
        | 'currency'
        | 'eurAmount'
        | 'vat'
        | 'invoiceNo'
        | 'description'
        | 'place'
        | 'paymentMethod'
        | 'approverId'
        | 'receipt'
      >
    >,
  ) => void
  submitExpense: (id: string) => void
  approveExpense: (id: string) => void
  rejectExpense: (id: string) => void
  addRosterRequest: (input: {
    crewId: string
    from: string
    to: string
    kind: RosterKind
    reason: AbsenceReason
    comment: string
  }) => string
  decideRoster: (id: string, decision: 'approved' | 'rejected') => void
  setMyStatus: (status: SelfStatus) => void
  cancelRoster: (id: string) => void
  reset: () => void
  user: (typeof crew)[number] | null
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<AppSnapshot>(load)
  const [authReady, setAuthReady] = useState(false)
  const snapRef = useRef(snap)
  snapRef.current = snap
  const revRef = useRef(0)
  const lastSavedRef = useRef('')
  const deletedRef = useRef<DeletedIds>({})
  const persistOnRef = useRef(false)
  const persistTimer = useRef(0)
  const persistBusy = useRef(false)
  const persistAgain = useRef(false)
  const replaceNext = useRef(false)

  const markDeleted = useCallback((key: keyof DeletedIds, id: string) => {
    const bag = deletedRef.current
    bag[key] = [...(bag[key] ?? []), id]
  }, [])

  const adoptOps = useCallback((revision: number, board: ReturnType<typeof pickOps>, userId?: string) => {
    revRef.current = revision
    lastSavedRef.current = JSON.stringify(board)
    persistOnRef.current = true
    try {
      localStorage.removeItem('thalima.crew.v1')
    } catch {
      /* private mode */
    }
    setSnap((s) => ({ ...s, ...board, ...(userId ? { userId } : {}) }))
  }, [])

  const flushPersist = useCallback(async () => {
    if (!persistOnRef.current || !snapRef.current.userId) return
    if (persistBusy.current) {
      persistAgain.current = true
      return
    }
    persistBusy.current = true
    persistAgain.current = false
    const deleted = deletedRef.current
    deletedRef.current = {}
    const replace = replaceNext.current
    replaceNext.current = false
    const payload = pickOps(snapRef.current)
    try {
      const res = await api.putOps({
        ...payload,
        revision: revRef.current,
        deleted: Object.keys(deleted).length ? deleted : undefined,
        replace: replace || undefined,
      })
      const next = pickOps(res)
      revRef.current = res.revision
      lastSavedRef.current = JSON.stringify(next)
      const local = JSON.stringify(pickOps(snapRef.current))
      if (local === JSON.stringify(payload) || local === lastSavedRef.current) {
        setSnap((s) => ({ ...s, ...next }))
      } else {
        persistAgain.current = true
      }
    } catch {
      deletedRef.current = { ...deleted, ...deletedRef.current }
      if (replace) replaceNext.current = true
      persistAgain.current = true
    } finally {
      persistBusy.current = false
      if (persistAgain.current) void flushPersist()
    }
  }, [])

  const schedulePersist = useCallback(() => {
    window.clearTimeout(persistTimer.current)
    persistTimer.current = window.setTimeout(() => {
      void flushPersist()
    }, 280)
  }, [flushPersist])

  useEffect(() => {
    setSnap((s) => {
      const messages = keepMessages(s.messages)
      if (messages.length === s.messages.length) return s
      return { ...s, messages }
    })
  }, [])

  useEffect(() => {
    if (!persistOnRef.current || !snap.userId) return
    const json = JSON.stringify(pickOps(snap))
    if (json === lastSavedRef.current) return
    schedulePersist()
  }, [snap, schedulePersist])

  useEffect(() => {
    if (!snap.userId) return
    const tick = window.setInterval(() => {
      if (!persistOnRef.current || persistBusy.current) return
      if (JSON.stringify(pickOps(snapRef.current)) !== lastSavedRef.current) return
      void api
        .getOps(revRef.current)
        .then((res) => {
          if (res.unchanged || persistBusy.current) return
          if (JSON.stringify(pickOps(snapRef.current)) !== lastSavedRef.current) return
          adoptOps(res.revision, pickOps(res))
        })
        .catch(() => {})
    }, 2000)
    return () => window.clearInterval(tick)
  }, [snap.userId, adoptOps])

  useEffect(() => {
    applyHtmlTheme(snap.theme)
    writeTheme(snap.theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      snap.theme === 'dark' ? '#0b1622' : '#f3f4f7',
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

  useEffect(() => {
    let stop = false
    void (async () => {
      try {
        const { user } = await api.me()
        const { users } = await api.users()
        if (stop) return
        setLiveCrew(users)
        const ops = await api.getOps()
        if (stop) return
        if (ops.unchanged) throw new Error('ops')
        adoptOps(ops.revision, pickOps(ops), user.id)
      } catch {
        if (stop) return
        persistOnRef.current = false
        resetCrew()
        setSnap((s) => ({ ...s, userId: null }))
      } finally {
        if (!stop) setAuthReady(true)
      }
    })()
    return () => {
      stop = true
    }
  }, [adoptOps])

  const signIn = useCallback(async (email: string, password: string, remember = true) => {
    try {
      const { user } = await api.login(email, password, remember)
      const { users } = await api.users()
      setLiveCrew(users)
      try {
        if (remember) localStorage.setItem(KEEP, user.id)
        else localStorage.removeItem(KEEP)
      } catch {
        /* private mode */
      }
      const ops = await api.getOps()
      if (ops.unchanged) throw new Error('ops')
      adoptOps(ops.revision, pickOps(ops), user.id)
      return null
    } catch (err) {
      return err instanceof Error ? err.message : 'Sign in failed.'
    }
  }, [adoptOps])

  const refreshPeople = useCallback(async () => {
    const { users } = await api.users()
    setLiveCrew(users)
    setSnap((s) => ({ ...s }))
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
    persistOnRef.current = false
    window.clearTimeout(persistTimer.current)
    void api.logout().catch(() => {})
    resetCrew()
    try {
      localStorage.removeItem(KEEP)
    } catch {
      /* private mode */
    }
    setSnap((s) => ({ ...s, userId: null }))
  }, [])

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    writeTheme(theme)
    applyHtmlTheme(theme)
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
      recordActivity('task_create', input.title)
      const fromId = snapRef.current.userId
      if (fromId) {
        const assigned = input.assigneeIds?.length ? input.assigneeIds : [input.assigneeId]
        const station = crew.filter((c) => c.id !== fromId && stationsOf(c).includes(input.department)).map((c) => c.id)
        notifyTaskAssigned({
          taskId: id,
          title: input.title,
          body: input.body,
          due: input.due,
          department: input.department,
          assigneeIds: input.urgency === 'emergency' ? crew.map((c) => c.id) : [...new Set([...assigned, ...station])],
          fromId,
        })
      }
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
      const prev = snapRef.current.tasks.find((t) => t.id === id)
      const fromId = snapRef.current.userId
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
            const before = taskAssignees(t)
            const after = taskAssignees(next)
            if (before.join(',') !== after.join(',')) {
              next = withNote(next, taskNote(s.userId, `Assigned to ${namesFor(after)}`, 'assign'))
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
      if (!fromId || !prev) return
      if (patch.assigneeIds) {
        const before = taskAssignees(prev)
        const after = [...new Set(patch.assigneeIds)]
        const added = after.filter((pid) => !before.includes(pid) && pid !== fromId)
        if (added.length) {
          notifyTaskAssigned({
            taskId: id,
            title: patch.title ?? prev.title,
            body: patch.body ?? prev.body,
            due: patch.due ?? prev.due,
            department: patch.department ?? prev.department,
            assigneeIds: added,
            fromId,
          })
        }
      }
      if (patch.urgency === 'emergency' && prev.urgency !== 'emergency') {
        notifyTaskAssigned({
          taskId: id,
          title: patch.title ?? prev.title,
          body: patch.body ?? prev.body,
          due: patch.due ?? prev.due,
          department: patch.department ?? prev.department,
          assigneeIds: crew.map((c) => c.id),
          fromId,
        })
      }
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
    const body = text.trim()
    const fromId = snapRef.current.userId
    if (!fromId || !body) return
    setSnap((s) => {
      if (!s.userId || !body) return s
      const key = `${s.userId}:${channelId}`
      return {
        ...s,
        messages: [
          ...s.messages,
          {
            id: uid('m'),
            channelId,
            authorId: s.userId,
            text: body,
            at: new Date().toISOString(),
          },
        ],
        lastRead: { ...s.lastRead, [key]: new Date().toISOString() },
      }
    })
    notifyChat({
      channelId,
      text: body,
      fromId,
      toIds: chatRecipients(channelId, fromId),
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

  const dismissEmergency = useCallback((taskId: string) => {
    setSnap((s) => {
      if (!s.userId) return s
      const key = emergencyDismissKey(s.userId, taskId)
      const dismissed = s.dismissedEmergencies ?? {}
      if (dismissed[key]) return s
      return {
        ...s,
        dismissedEmergencies: { ...dismissed, [key]: new Date().toISOString() },
      }
    })
  }, [])

  const claimEmergency = useCallback((taskId: string) => {
    setSnap((s) => {
      if (!s.userId) return s
      return {
        ...s,
        tasks: s.tasks.map((t) => {
          if (t.id !== taskId || t.status === 'done') return t
          const ids = [...taskAssignees(t)]
          if (!ids.includes(s.userId!)) ids.push(s.userId!)
          let next: Task = { ...t, assigneeIds: ids, assigneeId: ids[0] ?? t.assigneeId }
          if (next.status !== 'doing') next = punchStatus(next, 'doing')
          return withNote(next, taskNote(s.userId!, 'Took on emergency', 'assign'))
        }),
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
    if (text.trim()) recordActivity('deck_log', text.trim())
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
    markDeleted('events', id)
    setSnap((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }))
  }, [markDeleted])

  const addDoc = useCallback((doc: CloudDoc) => {
    setSnap((s) => ({ ...s, docs: [doc, ...(s.docs ?? [])] }))
  }, [])

  const removeDoc = useCallback((id: string) => {
    markDeleted('docs', id)
    setSnap((s) => ({ ...s, docs: (s.docs ?? []).filter((d) => d.id !== id) }))
  }, [markDeleted])

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

  const addStockItem = useCallback(
    (input: { kind: 'technical'; row: Omit<StockItem, 'id'> } | { kind: 'provisioning'; row: Omit<ProvisionItem, 'id'> }) => {
      if (input.kind === 'technical') {
        const row = { ...input.row, id: uid('st') }
        patchOps((ops) => ({ ...ops, stock: [...(ops.stock ?? []), row] }))
      } else {
        const row = { ...input.row, id: uid('pv') }
        patchOps((ops) => ({ ...ops, provisions: [...ops.provisions, row] }))
      }
      recordActivity('stock_add', `Added ${input.row.item}`)
    },
    [patchOps],
  )

  const addPurchase = useCallback(
    (input: Pick<PurchaseRequest, 'title' | 'supplier' | 'amount' | 'currency' | 'category' | 'note'>) => {
      setSnap((s) => {
        if (!s.userId) return s
        const row: PurchaseRequest = {
          ...input,
          id: uid('pr'),
          status: 'pending',
          by: s.userId,
          at: new Date().toISOString(),
        }
        return { ...s, ops: { ...s.ops, purchases: [row, ...s.ops.purchases] } }
      })
      recordActivity('purchase_add', `Requested ${input.title}`)
    },
    [],
  )

  const addTrip = useCallback((input: Omit<Trip, 'id' | 'prepped' | 'log'>) => {
    const id = uid('trip')
    setSnap((s) => {
      const who = s.userId ? crew.find((c) => c.id === s.userId)?.name.split(' ')[0] ?? 'Crew' : null
      const trip: Trip = {
        ...input,
        id,
        log: s.userId && who ? [tripNote(s.userId, `Created · ${who}`, 'edit')] : [],
      }
      return {
        ...s,
        ops: {
          ...s.ops,
          trips: [...s.ops.trips, trip].sort((a, b) => a.from.localeCompare(b.from)),
        },
      }
    })
    recordActivity('trip_add', `Added event ${input.title}`)
    return id
  }, [])

  const updateTrip = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<Trip, 'title' | 'from' | 'to' | 'ownerAboard' | 'guests' | 'transfers' | 'reservations' | 'notes' | 'prepped'>
      >,
    ) => {
      setSnap((s) => {
        if (!s.userId) return s
        return {
          ...s,
          ops: {
            ...s.ops,
            trips: s.ops.trips.map((t) => {
              if (t.id !== id) return t
              const next = { ...t, ...patch }
              if (patch.from !== undefined || patch.to !== undefined) {
                const a = patch.from ?? t.from
                const b = patch.to ?? t.to
                next.from = a <= b ? a : b
                next.to = a <= b ? b : a
              }
              const change = describeTripPatch(t, patch)
              if (!change) return next
              return withTripLog(next, tripNote(s.userId!, change.text, change.kind))
            }),
          },
        }
      })
    },
    [],
  )

  const addTripNote = useCallback((id: string, text: string) => {
    const body = text.trim()
    if (!body) return
    setSnap((s) => {
      if (!s.userId) return s
      return {
        ...s,
        ops: {
          ...s.ops,
          trips: s.ops.trips.map((t) =>
            t.id === id ? withTripLog(t, tripNote(s.userId!, body, 'note')) : t,
          ),
        },
      }
    })
  }, [])

  const setTripPrepped = useCallback((id: string) => {
    setSnap((s) => ({
      ...s,
      ops: {
        ...s.ops,
        trips: s.ops.trips.map((t) => {
          if (t.id !== id || t.prepped) return t
          const next = { ...t, prepped: true }
          if (!s.userId) return next
          return withTripLog(next, tripNote(s.userId, 'Prep tasks created', 'prep'))
        }),
      },
    }))
  }, [])

  const addReceipt = useCallback((file: AttachedFile) => {
    const id = uid('ex')
    setSnap((s) => {
      if (!s.userId) return s
      const who = crew.find((c) => c.id === s.userId)?.name.split(' ')[0] ?? 'Crew'
      const list = s.expenses ?? expensesSeed()
      const draft = emptyDraftExpense(s.userId, nextExpenseRef(list), 'receipt')
      draft.id = id
      draft.receipt = file
      draft.notes = [expenseAudit(s.userId, 'uploaded', `Uploaded by ${who}`)]
      return { ...s, expenses: [draft, ...list] }
    })
    return id
  }, [])

  const addManualExpense = useCallback(
    (input: {
      vendor: string
      date: string
      amount: number
      currency: string
      eurAmount: number
      vat: number | null
      category: ExpenseCategory
      description: string
      receipt?: AttachedFile
      approverId: string
    }) => {
      let created = uid('ex')
      const existing = snapRef.current.expenses ?? expensesSeed()
      const ref = nextExpenseRef(existing)
      setSnap((s) => {
        if (!s.userId) return s
        const who = crew.find((c) => c.id === s.userId)?.name.split(' ')[0] ?? 'Crew'
        const list = s.expenses ?? expensesSeed()
        const draft = emptyDraftExpense(s.userId, ref, 'manual')
        const next: Expense = {
          ...draft,
          id: created,
          vendor: input.vendor.trim(),
          date: input.date,
          amount: input.amount,
          currency: input.currency,
          eurAmount: input.eurAmount,
          vat: input.vat,
          category: input.category,
          description: input.description.trim(),
          receipt: input.receipt,
          approverId: input.approverId,
          status: 'pending',
          extraction: {
            completed: false,
            confidence: {
              vendor: 'ok',
              date: 'ok',
              amount: 'ok',
              currency: 'ok',
              eurAmount: 'ok',
              category: 'ok',
              description: input.description.trim() ? 'ok' : 'missing',
              vat: input.vat != null ? 'ok' : 'missing',
              invoiceNo: 'missing',
            },
          },
          notes: [
            expenseAudit(s.userId, 'created', `Manual expense by ${who}`),
            expenseAudit(s.userId, 'submitted', `Submitted for approval`),
          ],
        }
        return { ...s, expenses: [next, ...list] }
      })
      const fromId = snapRef.current.userId
      if (fromId) {
        notifyExpenseApproval({
          expenseId: created,
          ref,
          vendor: input.vendor.trim(),
          amount: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(input.eurAmount),
          category: expenseCategoryLabel[input.category],
          description: input.description.trim(),
          approverId: input.approverId,
          fromId,
        })
      }
      return created
    },
    [],
  )

  const updateExpense = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          Expense,
          | 'vendor'
          | 'date'
          | 'category'
          | 'amount'
          | 'currency'
          | 'eurAmount'
          | 'vat'
          | 'invoiceNo'
          | 'description'
          | 'place'
          | 'paymentMethod'
          | 'approverId'
          | 'receipt'
        >
      >,
    ) => {
      setSnap((s) => {
        if (!s.userId) return s
        const who = crew.find((c) => c.id === s.userId)?.name.split(' ')[0] ?? 'Crew'
        return {
          ...s,
          expenses: (s.expenses ?? expensesSeed()).map((exp) => {
            if (exp.id !== id) return exp
            const next = { ...exp, ...patch }
            if (next.currency === 'EUR' && next.amount != null) next.eurAmount = next.amount
            const confidence = { ...next.extraction.confidence }
            ;(
              [
                'vendor',
                'date',
                'amount',
                'currency',
                'eurAmount',
                'vat',
                'invoiceNo',
                'category',
                'description',
              ] as const
            ).forEach((field) => {
              if (field in patch) {
                const value = next[field]
                const filled = value !== '' && value !== null && value !== undefined
                confidence[field] = filled ? 'ok' : 'missing'
              }
            })
            const last = next.notes[next.notes.length - 1]
            const note = expenseAudit(s.userId!, 'edited', `Edited by ${who}`)
            const notes =
              last?.action === 'edited' && last.authorId === s.userId
                ? [...next.notes.slice(0, -1), { ...last, at: note.at }]
                : [...next.notes, note]
            return {
              ...next,
              extraction: { ...next.extraction, confidence },
              notes,
            }
          }),
        }
      })
    },
    [],
  )

  const submitExpense = useCallback((id: string) => {
    const fromId = snapRef.current.userId
    const exp = (snapRef.current.expenses ?? expensesSeed()).find((e) => e.id === id)
    if (!fromId || !exp || exp.status !== 'draft') return
    if (missingExpenseFields(exp).length) return
    const approverId = exp.approverId ?? defaultApproverId(fromId)
    if (!approverId) return
    setSnap((s) => {
      if (!s.userId) return s
      return {
        ...s,
        expenses: (s.expenses ?? expensesSeed()).map((row) => {
          if (row.id !== id) return row
          return {
            ...row,
            status: 'pending' as ExpenseStatus,
            approverId,
            notes: [...row.notes, expenseAudit(s.userId!, 'submitted', 'Submitted for approval')],
          }
        }),
      }
    })
    recordActivity('expense_submit', 'Submitted an expense for approval')
    notifyExpenseApproval(expenseMailFrom({ ...exp, status: 'pending', approverId }, fromId))
  }, [])

  const approveExpense = useCallback((id: string) => {
    setSnap((s) => {
      if (!s.userId) return s
      const who = crew.find((c) => c.id === s.userId)?.name.split(' ')[0] ?? 'Crew'
      const now = new Date().toISOString()
      return {
        ...s,
        expenses: (s.expenses ?? expensesSeed()).map((exp) => {
          if (exp.id !== id) return exp
          if (exp.uploadedBy === s.userId) return exp
          return {
            ...exp,
            status: 'approved' as ExpenseStatus,
            approvedBy: s.userId ?? undefined,
            approvedAt: now,
            notes: [...exp.notes, expenseAudit(s.userId!, 'approved', `Approved by ${who}`)],
          }
        }),
      }
    })
    recordActivity('expense_approve', 'Approved an expense')
  }, [])

  const rejectExpense = useCallback((id: string) => {
    setSnap((s) => {
      if (!s.userId) return s
      const who = crew.find((c) => c.id === s.userId)?.name.split(' ')[0] ?? 'Crew'
      return {
        ...s,
        expenses: (s.expenses ?? expensesSeed()).map((exp) => {
          if (exp.id !== id) return exp
          if (exp.uploadedBy === s.userId) return exp
          return {
            ...exp,
            status: 'rejected' as ExpenseStatus,
            approvedBy: s.userId ?? undefined,
            notes: [...exp.notes, expenseAudit(s.userId!, 'rejected', `Rejected by ${who}`)],
          }
        }),
      }
    })
    recordActivity('expense_reject', 'Rejected an expense')
  }, [])

  const addRosterRequest = useCallback(
    (input: {
      crewId: string
      from: string
      to: string
      kind: RosterKind
      reason: AbsenceReason
      comment: string
    }) => {
      const id = uid('rs')
      setSnap((s) => {
        if (!s.userId) return s
        const from = input.from <= input.to ? input.from : input.to
        const to = input.from <= input.to ? input.to : input.from
        const admin = crew.find((c) => c.id === s.userId)
        const forSelf = input.crewId === s.userId
        const auto = Boolean(admin && (admin.level === 1 || admin.role === 'captain') && !forSelf)
        const now = new Date().toISOString()
        const row: RosterEntry = {
          id,
          crewId: input.crewId,
          from,
          to,
          kind: input.kind,
          presence: presenceOf(input.kind, input.reason),
          duty: dutyOf(input.kind, input.reason),
          reason: input.reason,
          comment: input.comment.trim(),
          status: auto ? 'approved' : 'pending',
          requestedBy: s.userId,
          requestedAt: now,
          decidedBy: auto ? s.userId : undefined,
          decidedAt: auto ? now : undefined,
          notes: [
            rosterAudit(s.userId, auto ? 'admin_change' : 'created', auto ? 'Admin change' : 'Request created'),
          ],
        }
        return { ...s, roster: [row, ...(s.roster ?? rosterSeed())] }
      })
      return id
    },
    [],
  )

  const decideRoster = useCallback((id: string, decision: 'approved' | 'rejected') => {
    setSnap((s) => {
      if (!s.userId) return s
      const who = crew.find((c) => c.id === s.userId)?.name.split(' ')[0] ?? 'Crew'
      const now = new Date().toISOString()
      return {
        ...s,
        roster: (s.roster ?? rosterSeed()).map((row) => {
          if (row.id !== id || row.status !== 'pending') return row
          if (row.requestedBy === s.userId || row.crewId === s.userId) return row
          return {
            ...row,
            status: decision,
            decidedBy: s.userId ?? undefined,
            decidedAt: now,
            notes: [
              ...row.notes,
              rosterAudit(
                s.userId!,
                decision === 'approved' ? 'approved' : 'rejected',
                decision === 'approved' ? `Approved by ${who}` : `Rejected by ${who}`,
              ),
            ],
          }
        }),
      }
    })
    recordActivity('roster_decide', decision === 'approved' ? 'Approved a roster request' : 'Rejected a roster request')
  }, [])

  const setMyStatus = useCallback((status: SelfStatus) => {
    setSnap((s) => {
      if (!s.userId) return s
      const me = s.userId
      const day = romeDay()
      const now = new Date().toISOString()
      const note = rosterAudit(me, 'admin_change', `Status set to ${selfStatusLabel[status]}`)
      const list: RosterEntry[] = []
      for (const row of s.roster ?? rosterSeed()) {
        const covers = row.crewId === me && row.status === 'approved' && row.from <= day && row.to >= day
        if (!covers) {
          list.push(row)
          continue
        }
        if (row.from < day) list.push({ ...row, to: addDays(day, -1), notes: [...row.notes, note] })
        if (row.to > day) list.push({ ...row, id: uid('rs'), from: addDays(day, 1), notes: [...row.notes, note] })
        if (row.from === day && row.to === day) list.push({ ...row, status: 'cancelled', notes: [...row.notes, note] })
      }
      if (status === 'working') return { ...s, roster: list }
      const reason = status === 'sick' ? 'medical' : 'other'
      const row: RosterEntry = {
        id: uid('rs'),
        crewId: me,
        from: day,
        to: day,
        kind: status,
        presence: presenceOf(status, reason),
        duty: status === 'offboard' ? 'working' : dutyOf(status, reason),
        reason,
        comment: '',
        status: 'approved',
        requestedBy: me,
        requestedAt: now,
        decidedBy: me,
        decidedAt: now,
        source: 'status',
        notes: [note],
      }
      return { ...s, roster: [row, ...list] }
    })
    recordActivity('roster_status', `Status set to ${selfStatusLabel[status]}`)
  }, [])

  const cancelRoster = useCallback((id: string) => {
    setSnap((s) => {
      if (!s.userId) return s
      const who = crew.find((c) => c.id === s.userId)?.name.split(' ')[0] ?? 'Crew'
      return {
        ...s,
        roster: (s.roster ?? rosterSeed()).map((row) => {
          if (row.id !== id) return row
          if (row.status !== 'pending') return row
          if (row.requestedBy !== s.userId && row.crewId !== s.userId) return row
          return {
            ...row,
            status: 'cancelled' as const,
            notes: [...row.notes, rosterAudit(s.userId!, 'cancelled', `Cancelled by ${who}`)],
          }
        }),
      }
    })
  }, [])

  const reset = useCallback(() => {
    const next = seed()
    next.theme = snap.theme
    next.userId = snap.userId
    replaceNext.current = true
    lastSavedRef.current = ''
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
      dismissedEmergencies: snap.dismissedEmergencies ?? {},
      expenses: snap.expenses ?? expensesSeed(),
      roster: snap.roster ?? rosterSeed(),
      authReady,
      signIn,
      refreshPeople,
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
      dismissEmergency,
      claimEmergency,
      addLog,
      addEvent,
      removeEvent,
      addDoc,
      removeDoc,
      setPurchaseStatus,
      addHandover,
      addDrill,
      setTripPrepped,
      addTrip,
      updateTrip,
      addTripNote,
      addStockItem,
      addPurchase,
      addReceipt,
      addManualExpense,
      updateExpense,
      submitExpense,
      approveExpense,
      rejectExpense,
      addRosterRequest,
      decideRoster,
      setMyStatus,
      cancelRoster,
      reset,
      user,
    }),
    [snap, authReady, signIn, refreshPeople, login, logout, setTheme, addTask, moveTask, updateTask, addTaskNote, addMessage, markRead, markTasksSeen, markNoticeSeen, dismissEmergency, claimEmergency, addLog, addEvent, removeEvent, addDoc, removeDoc, setPurchaseStatus, addHandover, addDrill, setTripPrepped, addTrip, updateTrip, addTripNote, addStockItem, addPurchase, addReceipt, addManualExpense, updateExpense, submitExpense, approveExpense, rejectExpense, addRosterRequest, decideRoster, setMyStatus, cancelRoster, reset, user],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('store')
  return ctx
}

export { crew, channels }
