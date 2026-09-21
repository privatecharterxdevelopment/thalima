import { liveHours } from './alerts'
import type {
  AwaitReason,
  Department,
  DueKind,
  Equipment,
  Systems,
  Task,
  TaskEvent,
  TaskKind,
  TaskRecur,
  TaskStatus,
} from '../types'

const oldStatus: Record<string, TaskStatus> = {
  backlog: 'open',
  ready: 'open',
  open: 'open',
  doing: 'doing',
  waiting: 'waiting',
  done: 'done',
}

export const kindLabel: Record<TaskKind, string> = {
  guest_request: 'Guest request',
  maintenance: 'Maintenance',
  defect: 'Defect',
  safety: 'Safety',
  tender: 'Tender',
  provisioning: 'Provisioning',
  cleaning: 'Cleaning',
  navigation: 'Navigation',
  routine: 'Routine',
  delivery: 'Delivery',
}

export const awaitLabel: Record<AwaitReason, string> = {
  spare: 'Awaiting spare part',
  contractor: 'Awaiting contractor',
  owner: 'Awaiting owner approval',
  marina: 'Awaiting marina',
  delivery: 'Awaiting delivery',
}

export const eventLabel: Record<TaskEvent, string> = {
  before_departure: 'Before departure',
  before_guest_arrival: 'Before guest arrival',
  after_anchoring: 'After anchoring',
  before_crossing: 'Before crossing',
}

export const recurLabel: Record<TaskRecur, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
}

export function inferKind(title: string, body = '', department?: Department): TaskKind {
  const s = `${title} ${body}`.toLowerCase()
  if (/\btender|williams|splash|launch\b/.test(s)) return 'tender'
  if (/\bimpeller|defect|weep|manifold|fault|broken\b/.test(s)) return 'defect'
  if (/\bservice|winch|watermaker|generator|genset|filter|hours\b/.test(s)) return 'maintenance'
  if (/\bowner asked|guest|laundry|turndown|adler|nina|clara|dinner\b/.test(s)) return 'guest_request'
  if (/\bprovision|citrus|shop|stores\b/.test(s)) return 'provisioning'
  if (/\bteak|wash|clean|bilge|laundry\b/.test(s) && department === 'deck') return 'cleaning'
  if (/\bteak|wash|clean\b/.test(s)) return 'cleaning'
  if (/\banchor|brief|transit|chart|nav\b/.test(s)) return 'navigation'
  if (/\bdrill|safety|lifejack|fire|abandon\b/.test(s)) return 'safety'
  if (/\bdeliver|order|parts in\b/.test(s)) return 'delivery'
  return 'routine'
}

export function normalizeTask(task: Task): Task {
  const status = oldStatus[task.status] ?? 'open'
  const kind = task.kind ?? inferKind(task.title, task.body, task.department)
  const startedAt = status === 'doing' ? (task.startedAt ?? task.createdAt) : task.startedAt
  return {
    ...task,
    status,
    kind,
    notes: task.notes ?? [],
    files: task.files ?? [],
    workedMs: task.workedMs ?? 0,
    startedAt,
  }
}

export function isOpenStatus(status: TaskStatus) {
  return status !== 'done'
}

export function romeDay(iso?: string) {
  return (iso ? new Date(iso) : new Date()).toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' })
}

export function isDueToday(iso: string) {
  return romeDay(iso) === romeDay()
}

export function isDueUpcoming(iso: string) {
  return romeDay(iso) > romeDay()
}

export type PriorityFilter = 'critical' | 'today' | 'upcoming' | 'routine'

export function matchesPriority(task: Task, filter: PriorityFilter | 'all') {
  if (filter === 'all') return true
  if (filter === 'critical') return task.urgency === 'emergency'
  if (filter === 'today') return isDueToday(task.due)
  if (filter === 'upcoming') return isDueUpcoming(task.due)
  return task.urgency === 'routine'
}

export function overdueMins(iso: string) {
  return Math.round((Date.now() - new Date(iso).getTime()) / 60000)
}

export function overdueText(iso: string) {
  const min = overdueMins(iso)
  if (min < 1) return 'Overdue'
  if (min < 60) return `${min} min overdue`
  const h = Math.round(min / 60)
  if (h < 36) return `${h} h overdue`
  return `${Math.round(h / 24)} d overdue`
}

export function clockRome(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  })
}

export function dateRome(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Rome',
  })
}

export function hoursLine(task: Task, equipment: Equipment[], systems: Systems) {
  const eq = equipment.find((e) => e.id === (task.dueAssetId ?? ''))
  if (!eq || !task.dueHours) return null
  const now = liveHours(eq, systems)
  return {
    due: task.dueHours,
    now,
    label: `Due at ${task.dueHours.toLocaleString()} h · Current ${now.toLocaleString()} h`,
  }
}

export function dueKindOf(task: Task): DueKind {
  if (task.dueKind) return task.dueKind
  if (task.dueHours) return 'hours'
  if (task.recur) return 'recurring'
  if (task.eventCue) return 'event'
  if (!isDueToday(task.due) && isDueUpcoming(task.due)) return 'date'
  return 'time'
}

export function dueLine(task: Task, equipment: Equipment[], systems: Systems) {
  const kind = dueKindOf(task)
  const overdue = new Date(task.due).getTime() < Date.now() && task.status !== 'done' && kind !== 'hours'
  if (kind === 'hours') {
    const hours = hoursLine(task, equipment, systems)
    return { kind, text: hours?.label ?? 'Hours due', overdue: (hours?.now ?? 0) > (task.dueHours ?? 0), hint: hours }
  }
  if (kind === 'date') {
    return { kind, text: `Due ${dateRome(task.due)}`, overdue, hint: null }
  }
  if (kind === 'recurring') {
    return {
      kind,
      text: `${task.recur ? recurLabel[task.recur] : 'Recurring'} ${clockRome(task.due)}`,
      overdue: false,
      hint: null,
    }
  }
  if (kind === 'event') {
    const cue = task.eventCue ? eventLabel[task.eventCue] : 'On event'
    return {
      kind,
      text: overdue ? `${cue} · ${overdueText(task.due)}` : `${cue} · ${clockRome(task.due)}`,
      overdue,
      hint: null,
    }
  }
  const clock = `Due ${clockRome(task.due)}`
  return { kind, text: overdue ? `${clock} · ${overdueText(task.due)}` : clock, overdue, hint: null }
}
