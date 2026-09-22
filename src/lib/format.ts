import type { CrewMember, Department, Task, TaskStatus, Urgency } from '../types'

export function padCoord(n: number, pos: string, neg: string) {
  const hem = n >= 0 ? pos : neg
  const abs = Math.abs(n)
  const d = Math.floor(abs)
  const m = (abs - d) * 60
  return `${d}°${m.toFixed(2).padStart(5, '0')}'${hem}`
}

export function formatLatLon(lat: number, lon: number) {
  return `${padCoord(lat, 'N', 'S')}  ${padCoord(lon, 'E', 'W')}`
}

export function cardinal(deg: number) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

export function beaufort(kn: number) {
  if (kn < 1) return { f: 0, name: 'Calm' }
  if (kn < 4) return { f: 1, name: 'Light air' }
  if (kn < 7) return { f: 2, name: 'Light breeze' }
  if (kn < 11) return { f: 3, name: 'Gentle breeze' }
  if (kn < 16) return { f: 4, name: 'Moderate breeze' }
  if (kn < 22) return { f: 5, name: 'Fresh breeze' }
  if (kn < 28) return { f: 6, name: 'Strong breeze' }
  if (kn < 34) return { f: 7, name: 'Near gale' }
  if (kn < 41) return { f: 8, name: 'Gale' }
  return { f: 9, name: 'Strong gale' }
}

export function clock(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  })
}

export function dueLine(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const same =
    d.toLocaleDateString('en-GB', { timeZone: 'Europe/Rome' }) ===
    now.toLocaleDateString('en-GB', { timeZone: 'Europe/Rome' })
  if (same) return `Today ${clock(iso)}`
  const date = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Europe/Rome',
  })
  return `Due ${date}`
}

export function dayClock(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  })
}

export function elapsedClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(total / 86400)
  const h = Math.floor((total % 86400) / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (d > 0) return `${d}d ${h}h ${String(m).padStart(2, '0')}m`
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

export function elapsedShort(ms: number) {
  const m = Math.max(0, Math.floor(ms / 60000))
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 48) return m % 60 ? `${h}h ${m % 60}m` : `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function taskOnlineMs(task: Task, now = Date.now()) {
  return now - new Date(task.createdAt).getTime()
}

export function taskWorkedMs(task: Task, now = Date.now()) {
  const base = task.workedMs ?? 0
  if (task.status === 'doing' && task.startedAt) {
    return base + (now - new Date(task.startedAt).getTime())
  }
  return base
}

export function punchStatus(task: Task, next: TaskStatus, now = Date.now()): Task {
  let workedMs = task.workedMs ?? 0
  let startedAt = task.startedAt
  if (task.status === 'doing' && next !== 'doing' && startedAt) {
    workedMs += now - new Date(startedAt).getTime()
    startedAt = undefined
  }
  if (task.status !== 'doing' && next === 'doing') {
    startedAt = new Date(now).toISOString()
  }
  return {
    ...task,
    status: next,
    workedMs,
    startedAt,
    completedAt: next === 'done' ? new Date(now).toISOString() : undefined,
  }
}

export function relative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.round(diff / 60000)
  if (Math.abs(min) < 1) return 'now'
  if (min > 0 && min < 60) return `${min}m ago`
  if (min < 0 && min > -60) return `in ${Math.abs(min)}m`
  const h = Math.round(min / 60)
  if (h > 0 && h < 36) return `${h}h ago`
  if (h < 0 && h > -36) return `in ${Math.abs(h)}h`
  return dayClock(iso)
}

export function dueState(iso: string): 'overdue' | 'soon' | 'ok' {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff < 0) return 'overdue'
  if (diff < 90 * 60000) return 'soon'
  return 'ok'
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function crewById(list: CrewMember[], id: string) {
  return list.find((c) => c.id === id)
}

export function sortTasks(a: Task, b: Task) {
  const u: Record<Urgency, number> = { emergency: 0, now: 1, soon: 2, routine: 3 }
  const du = u[a.urgency] - u[b.urgency]
  if (du !== 0) return du
  return new Date(a.due).getTime() - new Date(b.due).getTime()
}

export const stationIds: Department[] = ['bridge', 'engineering', 'deck', 'interior', 'galley']

export function parseStations(raw: unknown, fallback?: Department): Department[] {
  const bits: string[] = []
  if (Array.isArray(raw)) bits.push(...raw.map(String))
  else if (typeof raw === 'string' && raw.trim()) {
    const text = raw.trim()
    if (text.startsWith('[')) {
      try {
        bits.push(...(JSON.parse(text) as unknown[]).map(String))
      } catch {
        bits.push(...text.split(','))
      }
    } else if (text.startsWith('{') && text.endsWith('}')) {
      bits.push(...text.slice(1, -1).split(','))
    } else bits.push(...text.split(','))
  }
  const cleaned = [
    ...new Set(
      bits
        .map((d) => d.trim().replace(/^["']|["']$/g, ''))
        .filter((d): d is Department => stationIds.includes(d as Department)),
    ),
  ]
  if (fallback && stationIds.includes(fallback) && !cleaned.includes(fallback)) cleaned.unshift(fallback)
  return cleaned.length ? cleaned : fallback && stationIds.includes(fallback) ? [fallback] : ['deck']
}

export function stationsOf(user: Pick<CrewMember, 'department' | 'departments'>): Department[] {
  return parseStations(user.departments, user.department)
}

export function onStation(user: Pick<CrewMember, 'department' | 'departments'>, department: Department) {
  return stationsOf(user).includes(department)
}

export function canManageUsers(user: Pick<CrewMember, 'access' | 'level'>) {
  return user.access === 'owner' || user.level === 1
}

export function taskAssignees(task: { assigneeId: string; assigneeIds?: string[] }) {
  const ids = task.assigneeIds?.length ? task.assigneeIds : task.assigneeId ? [task.assigneeId] : []
  return [...new Set(ids)]
}

export function isMarkedOn(task: { assigneeId: string; assigneeIds?: string[] }, userId: string) {
  return taskAssignees(task).includes(userId)
}

export function canAssign(user: CrewMember, _department: Department) {
  return user.level <= 2
}

export function canSeeTask(user: CrewMember, task: Task) {
  const assigned = taskAssignees(task).includes(user.id)
  if (user.level === 1) return true
  return onStation(user, task.department) || assigned || task.createdBy === user.id
}

export function canMoveTask(user: CrewMember, task: Task) {
  const assigned = taskAssignees(task).includes(user.id)
  if (user.level === 1) return true
  return onStation(user, task.department) || assigned || (user.level <= 2 && task.createdBy === user.id)
}

export function tasksSeenKey(userId: string) {
  return `tasks:${userId}`
}

export function isFreshTask(task: Task, userId: string, lastRead: Record<string, string>) {
  if (task.createdBy === userId || task.status === 'done') return false
  const seen = lastRead[tasksSeenKey(userId)] ?? new Date(Date.now() - 3 * 3600_000).toISOString()
  return task.createdAt > seen
}

export function helloParts(name: string) {
  const h = Number(
    new Date().toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Europe/Rome' }),
  )
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return { greet, name }
}

export function hello(name: string) {
  const { greet, name: who } = helloParts(name)
  return `${greet}, ${who}`
}
