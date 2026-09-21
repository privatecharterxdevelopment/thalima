import { dueState, isFreshTask, isMarkedOn } from './format'
import type { CrewMember, Task } from '../types'

export type CrewNotice = {
  id: string
  title: string
  body: string
  at: string
  to: string
  tone: 'hot' | 'soon' | 'ok'
  taskId?: string
}

export function noticeSeenKey(userId: string, id: string) {
  return `n:${userId}:${id}`
}

export function isNoticeSeen(userId: string, id: string, seen: Record<string, string> | undefined) {
  return Boolean(seen?.[noticeSeenKey(userId, id)])
}

export function buildNotices(input: { user: CrewMember; tasks: Task[]; lastRead: Record<string, string> }): CrewNotice[] {
  const { user, tasks, lastRead } = input
  const list: CrewNotice[] = []

  for (const t of tasks) {
    if (t.status === 'done' || !isMarkedOn(t, user.id)) continue

    if (isFreshTask(t, user.id, lastRead)) {
      list.push({
        id: `new-${t.id}`,
        title: t.title,
        body: 'New',
        at: t.createdAt,
        to: `/board/${t.id}`,
        tone: t.urgency === 'emergency' ? 'hot' : 'soon',
        taskId: t.id,
      })
    }

    const due = dueState(t.due)
    if (due === 'overdue') {
      list.push({
        id: `overdue-${t.id}`,
        title: t.title,
        body: 'Overdue',
        at: t.due,
        to: `/board/${t.id}`,
        tone: 'hot',
        taskId: t.id,
      })
    } else if (t.urgency === 'now' || t.urgency === 'emergency') {
      list.push({
        id: `hot-${t.id}`,
        title: t.title,
        body: t.urgency === 'emergency' ? 'Emergency' : 'Due now',
        at: t.due,
        to: `/board/${t.id}`,
        tone: 'hot',
        taskId: t.id,
      })
    }
  }

  return list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}
