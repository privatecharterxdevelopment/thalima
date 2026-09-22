import { crew } from '../data/crew'
import { romeDay } from './opsTasks'
import { uid } from './format'
import type {
  AbsenceReason,
  CrewMember,
  DutyStatus,
  Presence,
  RosterAudit,
  RosterDecision,
  RosterEntry,
  RosterKind,
  SelfStatus,
} from '../types'
import { canAdminCalendar } from './permissions'

export const rosterKinds: RosterKind[] = ['offboard', 'off_duty', 'leave', 'sick', 'travel', 'training']

export const rosterKindLabel: Record<RosterKind, string> = {
  offboard: 'Off board',
  off_duty: 'Off duty',
  leave: 'Leave',
  sick: 'Sick',
  travel: 'Travel',
  training: 'Training',
}

export const absenceReasons: AbsenceReason[] = ['leave', 'personal', 'travel', 'medical', 'other']

export const absenceReasonLabel: Record<AbsenceReason, string> = {
  leave: 'Leave',
  personal: 'Personal',
  travel: 'Travel',
  medical: 'Medical',
  other: 'Other',
}

export const presenceLabel: Record<Presence, string> = {
  onboard: 'On board',
  offboard: 'Off board',
}

export const dutyLabel: Record<DutyStatus, string> = {
  working: 'Working',
  off_duty: 'Off duty',
  leave: 'Leave',
  sick: 'Sick',
  travel: 'Travel',
  training: 'Training',
}

export const selfStatuses: SelfStatus[] = ['working', 'off_duty', 'offboard', 'sick']

export const selfStatusLabel: Record<SelfStatus, string> = {
  working: 'On board',
  off_duty: 'Off duty',
  offboard: 'Off board',
  sick: 'Sick',
}

export function currentSelfStatus(crewId: string, list: RosterEntry[], day = romeDay()): SelfStatus {
  const hit = covering(list, crewId, day, 'approved')[0]
  if (!hit) return 'working'
  if (hit.duty === 'sick') return 'sick'
  if (hit.presence === 'offboard') return 'offboard'
  if (hit.duty === 'off_duty') return 'off_duty'
  return 'working'
}

export function canManageRoster(user: CrewMember) {
  return canAdminCalendar(user)
}

export function canApproveRoster(user: CrewMember, entry: RosterEntry) {
  if (entry.status !== 'pending') return false
  if (entry.requestedBy === user.id || entry.crewId === user.id) return false
  return canManageRoster(user)
}

export function addDays(day: string, n: number) {
  const [y, m, d] = day.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + n))
  return dt.toISOString().slice(0, 10)
}

export function eachDay(from: string, to: string) {
  const out: string[] = []
  let cur = from
  while (cur <= to) {
    out.push(cur)
    cur = addDays(cur, 1)
  }
  return out
}

export function formatDay(day: string) {
  return new Date(`${day}T12:00:00+02:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Rome',
  })
}

export function formatDayLong(day: string) {
  return new Date(`${day}T12:00:00+02:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Rome',
  })
}

export function formatSpan(from: string, to: string) {
  if (from === to) return formatDayLong(from)
  const a = new Date(`${from}T12:00:00+02:00`)
  const b = new Date(`${to}T12:00:00+02:00`)
  const sameYear = a.getFullYear() === b.getFullYear()
  const left = a.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
    timeZone: 'Europe/Rome',
  })
  return `${left} — ${formatDayLong(to)}`
}

export function overlaps(aFrom: string, aTo: string, bFrom: string, bTo: string) {
  return aFrom <= bTo && aTo >= bFrom
}

export function visibleRoster(list: RosterEntry[]) {
  return list.filter((e) => e.status === 'pending' || e.status === 'approved')
}

export function entriesForCrew(list: RosterEntry[], crewId: string) {
  return visibleRoster(list).filter((e) => e.crewId === crewId)
}

export function covering(list: RosterEntry[], crewId: string, day: string, status?: RosterDecision) {
  return visibleRoster(list).filter(
    (e) => e.crewId === crewId && e.from <= day && e.to >= day && (!status || e.status === status),
  )
}

export function presenceOf(kind: RosterKind, _reason: AbsenceReason): Presence {
  if (kind === 'off_duty' || kind === 'sick') return 'onboard'
  if (kind === 'offboard' || kind === 'leave' || kind === 'travel' || kind === 'training') return 'offboard'
  return 'onboard'
}

export function dutyOf(kind: RosterKind, reason: AbsenceReason): DutyStatus {
  if (kind === 'off_duty') return 'off_duty'
  if (kind === 'sick') return 'sick'
  if (kind === 'travel' || (kind === 'offboard' && reason === 'travel')) return 'travel'
  if (kind === 'training') return 'training'
  if (kind === 'offboard' && reason === 'medical') return 'sick'
  if (kind === 'leave' || kind === 'offboard') return 'leave'
  return 'leave'
}

export function currentPresence(crewId: string, list: RosterEntry[], day = romeDay()): Presence {
  const hit = covering(list, crewId, day, 'approved')[0]
  return hit?.presence ?? 'onboard'
}

export function currentDuty(crewId: string, list: RosterEntry[], day = romeDay()): DutyStatus {
  const hit = covering(list, crewId, day, 'approved')[0]
  return hit?.duty ?? 'working'
}

export function untilOffboard(crewId: string, list: RosterEntry[], day = romeDay()) {
  const hit = covering(list, crewId, day, 'approved').find((e) => e.presence === 'offboard')
  return hit?.to
}

export function upcomingAbsence(crewId: string, list: RosterEntry[], day = romeDay()) {
  return visibleRoster(list)
    .filter(
      (e) =>
        e.crewId === crewId &&
        e.from > day &&
        (e.presence === 'offboard' || e.duty === 'leave' || e.duty === 'sick' || e.duty === 'travel' || e.duty === 'training'),
    )
    .sort((a, b) => a.from.localeCompare(b.from))[0]
}

export function rosterSummary(list: RosterEntry[], day = romeDay()) {
  const onboard = crew.filter((c) => currentPresence(c.id, list, day) === 'onboard').length
  const offboard = crew.length - onboard
  const onLeave = crew.filter((c) => currentDuty(c.id, list, day) === 'leave').length
  const pending = list.filter((e) => e.status === 'pending').length
  return { onboard, offboard, onLeave, pending }
}

export function unavailableOn(crewId: string, day: string, list: RosterEntry[]) {
  const hit = covering(list, crewId, day, 'approved').find(
    (e) => e.presence === 'offboard' || e.duty === 'leave' || e.duty === 'sick' || e.duty === 'travel' || e.duty === 'training',
  )
  if (!hit) return null
  return hit
}

export function rosterAudit(authorId: string, action: RosterAudit['action'], text: string): RosterAudit {
  return { id: uid('ra'), at: new Date().toISOString(), authorId, action, text }
}

export function weekdayShort(day: string) {
  return new Date(`${day}T12:00:00+02:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    timeZone: 'Europe/Rome',
  })
}
