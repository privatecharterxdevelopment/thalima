import { statusLabel } from '../data/crew'
import type { TaskStatus, Urgency } from '../types'

export function statusTone(task: { status: TaskStatus; urgency?: Urgency; due?: string }) {
  if (task.status === 'done') return 'done'
  if (task.urgency === 'emergency') return 'hot'
  if (
    task.status === 'open' &&
    task.due &&
    new Date(task.due).getTime() < Date.now()
  ) {
    return 'hot'
  }
  return task.status
}

export function StatusPill({
  status,
  tone,
}: {
  status: TaskStatus
  tone?: string
}) {
  return <span className={`st-pill is-${tone ?? status}`}>{statusLabel[status] ?? status}</span>
}
