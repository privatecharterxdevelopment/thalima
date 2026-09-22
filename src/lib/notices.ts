import { crew } from '../data/crew'
import { canSeeChannel, firstName } from './chat'
import { dueState, isMarkedOn, onStation, taskAssignees } from './format'
import { canManageRoster, formatSpan, rosterKindLabel } from './roster'
import type { ChatMessage, CrewMember, Expense, RosterEntry, Task } from '../types'

export type CrewNotice = {
  id: string
  title: string
  body: string
  at: string
  to: string
  tone: 'hot' | 'soon' | 'ok'
  taskId?: string
  expenseId?: string
  personIds?: string[]
}

export function noticeSeenKey(userId: string, id: string) {
  return `n:${userId}:${id}`
}

export function isNoticeSeen(userId: string, id: string, seen: Record<string, string> | undefined) {
  return Boolean(seen?.[noticeSeenKey(userId, id)])
}

export function emergencyDismissKey(userId: string, taskId: string) {
  return `em:${userId}:${taskId}`
}

export function isEmergencyDismissed(
  userId: string,
  taskId: string,
  dismissed: Record<string, string> | undefined,
) {
  return Boolean(dismissed?.[emergencyDismissKey(userId, taskId)])
}

export function openEmergencies(tasks: Task[]) {
  return tasks
    .filter((t) => t.urgency === 'emergency' && t.status !== 'done')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function buildNotices(input: {
  user: CrewMember
  tasks: Task[]
  lastRead: Record<string, string>
  roster?: RosterEntry[]
  expenses?: Expense[]
  messages?: ChatMessage[]
}): CrewNotice[] {
  const { user, tasks, lastRead, roster = [], expenses = [], messages = [] } = input
  const list: CrewNotice[] = []

  for (const t of tasks) {
    if (t.status === 'done') continue

    if (t.urgency === 'emergency') {
      list.push({
        id: `emergency-${t.id}`,
        title: t.title,
        body: 'Emergency · all crew',
        at: t.createdAt,
        to: `/board/${t.id}`,
        tone: 'hot',
        taskId: t.id,
        personIds: taskAssignees(t),
      })
      continue
    }

    const onJob = isMarkedOn(t, user.id) || onStation(user, t.department)
    if (!onJob) continue

    const due = dueState(t.due)
    list.push({
      id: `task-${t.id}`,
      title: t.title,
      body: t.body,
      at: t.createdAt,
      to: `/board/${t.id}`,
      tone: due === 'overdue' || t.urgency === 'now' ? 'hot' : 'soon',
      taskId: t.id,
      personIds: taskAssignees(t),
    })
  }

  for (const row of roster) {
    const who = crewName(row.crewId)
    const span = formatSpan(row.from, row.to)
    const kind = rosterKindLabel[row.kind]
    if (row.source === 'status') {
      if (row.status === 'approved' && row.crewId !== user.id && canManageRoster(user)) {
        list.push({
          id: `roster-status-${row.id}`,
          title: 'Crew status changed',
          body: `${who} · ${kind} · ${span}`,
          at: row.decidedAt ?? row.requestedAt,
          to: '/crew/schedule',
          tone: row.kind === 'sick' ? 'hot' : 'soon',
          personIds: [row.crewId],
        })
      }
      continue
    }
    if (row.status === 'pending' && canManageRoster(user) && row.requestedBy !== user.id) {
      list.push({
        id: `roster-pending-${row.id}`,
        title: 'New crew absence request',
        body: `${who} requested ${kind} · ${span}`,
        at: row.requestedAt,
        to: `/crew/schedule?request=${row.id}`,
        tone: 'soon',
        personIds: [row.crewId],
      })
    }
    if (row.requestedBy === user.id && row.status === 'approved' && row.decidedAt) {
      list.push({
        id: `roster-ok-${row.id}`,
        title: 'Absence request approved',
        body: `${kind} · ${span}`,
        at: row.decidedAt,
        to: `/crew/schedule?request=${row.id}`,
        tone: 'ok',
        personIds: [row.crewId],
      })
    }
    if (row.requestedBy === user.id && row.status === 'rejected' && row.decidedAt) {
      list.push({
        id: `roster-no-${row.id}`,
        title: 'Absence request declined',
        body: `${kind} · ${span}`,
        at: row.decidedAt,
        to: `/crew/schedule?request=${row.id}`,
        tone: 'hot',
        personIds: [row.crewId],
      })
    }
  }

  for (const exp of expenses) {
    if (exp.status === 'pending' && exp.approverId === user.id && exp.uploadedBy !== user.id) {
      const amount =
        exp.eurAmount != null
          ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(exp.eurAmount)
          : 'amount pending'
      list.push({
        id: `expense-${exp.id}`,
        title: `Approval · ${exp.vendor || exp.ref}`,
        body: `${amount} · ${exp.ref} waiting on you`,
        at: exp.uploadedAt,
        to: `/accounting/expenses/${exp.id}`,
        tone: 'soon',
        expenseId: exp.id,
        personIds: [exp.uploadedBy],
      })
    }
    if (exp.status === 'approved' && exp.uploadedBy === user.id && exp.approvedAt) {
      const amount =
        exp.eurAmount != null
          ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(exp.eurAmount)
          : 'amount pending'
      list.push({
        id: `expense-ok-${exp.id}`,
        title: `Approved · ${exp.vendor || exp.ref}`,
        body: `${amount} · ${exp.ref}`,
        at: exp.approvedAt,
        to: `/accounting/expenses/${exp.id}`,
        tone: 'ok',
        expenseId: exp.id,
        personIds: [exp.uploadedBy],
      })
    }
    if (exp.status === 'rejected' && exp.uploadedBy === user.id) {
      const at = [...exp.notes].reverse().find((n) => n.action === 'rejected')?.at ?? exp.uploadedAt
      list.push({
        id: `expense-no-${exp.id}`,
        title: `Rejected · ${exp.vendor || exp.ref}`,
        body: `${exp.ref} was declined`,
        at,
        to: `/accounting/expenses/${exp.id}`,
        tone: 'hot',
        expenseId: exp.id,
        personIds: [exp.uploadedBy],
      })
    }
  }

  const unreadChat = messages
    .filter((m) => {
      if (!m.text || m.authorId === user.id) return false
      if (!canSeeChannel(user, m.channelId)) return false
      const read = lastRead[`${user.id}:${m.channelId}`]
      const cutoff = read ?? new Date(Date.now() - 24 * 3600_000).toISOString()
      return m.at > cutoff
    })
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 40)

  for (const m of unreadChat) {
    const from = firstName(crew.find((c) => c.id === m.authorId)?.name ?? 'Crew')
    const preview = m.text.slice(0, 120)
    list.push({
      id: `chat-${m.id}`,
      title: m.channelId === 'all' ? `${from} in All crew` : from,
      body: `${preview}${m.text.length > 120 ? '…' : ''}`,
      at: m.at,
      to: `/messages/${m.channelId}`,
      tone: 'soon',
      personIds: [m.authorId],
    })
  }

  return list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

function crewName(id: string) {
  return crew.find((c) => c.id === id)?.name.split(' ')[0] ?? id
}
