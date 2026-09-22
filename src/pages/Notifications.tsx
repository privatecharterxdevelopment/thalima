import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WhoLine } from '../components/WhoLine'
import { crew, deptLabel } from '../data/crew'
import { buildAlerts } from '../lib/alerts'
import { canReviewAccounting } from '../lib/accounting'
import { canSeeTask, clock, taskAssignees } from '../lib/format'
import { buildNotices, isNoticeSeen, type CrewNotice } from '../lib/notices'
import { isOpenStatus, romeDay } from '../lib/opsTasks'
import { useStore } from '../store'
import type { CrewMember, Task } from '../types'

const filters = [
  { id: 'all', label: 'All' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'chat', label: 'Chat' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'crew', label: 'Crew' },
  { id: 'system', label: 'System' },
] as const

type NoteFilter = (typeof filters)[number]['id']

function noticeKind(n: CrewNotice, task?: Task): Exclude<NoteFilter, 'all'> {
  if (n.to.startsWith('/messages')) return 'chat'
  if (n.to.startsWith('/accounting')) return 'accounts'
  if (n.to.startsWith('/maintenance')) return 'maintenance'
  if (n.to.startsWith('/crew')) return 'crew'
  if (task?.kind === 'maintenance' || task?.kind === 'defect' || task?.kind === 'safety') {
    return 'maintenance'
  }
  if (n.taskId || n.to.startsWith('/board')) return 'tasks'
  return 'system'
}

function isToday(iso: string) {
  return romeDay(iso) === romeDay()
}

function stamp(iso: string) {
  if (isToday(iso)) return clock(iso)
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Europe/Rome',
  })
}

function peopleOf(n: CrewNotice, task?: Task): CrewMember[] {
  const ids = n.personIds?.length ? n.personIds : task ? taskAssignees(task) : []
  return ids
    .map((id) => crew.find((c) => c.id === id))
    .filter((who): who is CrewMember => Boolean(who))
}

function flagOf(n: CrewNotice) {
  if (n.id.startsWith('emergency')) return 'Emergency'
  if (n.id.startsWith('chat')) return 'Chat'
  if (n.to.startsWith('/accounting')) return n.tone === 'hot' ? 'Rejected' : n.tone === 'ok' ? 'Approved' : 'Approval'
  if (n.to.startsWith('/crew')) return 'Crew'
  if (n.taskId) return 'Pending'
  return null
}

export function Notifications() {
  const { user, tasks, lastRead, seenNotices, markNoticeSeen, ops, systems, roster, expenses, messages } = useStore()
  const nav = useNavigate()
  const [filter, setFilter] = useState<NoteFilter>('all')

  const items = useMemo(() => {
    if (!user) return []
    return buildNotices({ user, tasks, lastRead, roster, expenses, messages }).filter(
      (n) => !isNoticeSeen(user.id, n.id, seenNotices),
    )
  }, [user, tasks, lastRead, roster, expenses, messages, seenNotices])

  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])

  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (filter === 'all') return true
      return noticeKind(n, n.taskId ? byId.get(n.taskId) : undefined) === filter
    })
  }, [items, filter, byId])

  const today = filtered.filter((n) => isToday(n.at))
  const earlier = filtered.filter((n) => !isToday(n.at))

  if (!user) return null

  const alerts = buildAlerts({ tasks, ops, systems })
  const openCount = tasks.filter((t) => canSeeTask(user, t) && isOpenStatus(t.status)).length
  const waiting = canReviewAccounting(user)
    ? expenses.filter((e) => e.status === 'pending' && e.approverId === user.id).length
    : 0
  const overview = [
    { id: 'open', count: openCount, label: 'Open tasks', to: '/board' },
    {
      id: 'acct',
      count: waiting,
      label: 'Approvals waiting',
      to: '/accounting/approvals',
    },
    {
      id: 'maint',
      count: alerts.find((a) => a.id === 'maint')?.count ?? 0,
      label: 'Maintenance due',
      to: '/maintenance?tab=schedule',
    },
    {
      id: 'certs',
      count: alerts.find((a) => a.id === 'certs')?.count ?? 0,
      label: 'Certificates expiring',
      to: '/cloud?tab=certificates',
    },
  ].filter((row) => row.id !== 'acct' || canReviewAccounting(user))

  function dismiss(n: CrewNotice) {
    if (!isNoticeSeen(user.id, n.id, seenNotices)) markNoticeSeen(n.id)
    if (n.to) nav(n.to)
  }

  function markAll() {
    for (const n of items) markNoticeSeen(n.id)
  }

  return (
    <div className="note-page">
      <section className="note-feed">
        <header className="note-head">
          <p className="note-kicker">{items.length > 0 ? `${items.length} new` : 'All caught up'}</p>
          {items.length > 0 ? (
            <button type="button" className="note-mark" onClick={markAll}>
              Clear all
            </button>
          ) : null}
        </header>

        <div className="note-filters">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              className={filter === f.id ? 'on' : ''}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="note-empty">Nothing on your seats right now.</p>
        ) : filtered.length === 0 ? (
          <p className="note-empty">Nothing in this filter.</p>
        ) : (
          <div className="note-groups">
            <NoteGroup label="Today" items={today} byId={byId} onSelect={dismiss} />
            <NoteGroup label="Earlier" items={earlier} byId={byId} onSelect={dismiss} />
          </div>
        )}
      </section>

      <aside className="note-side">
        <TodayOverview rows={overview} onOpen={(to) => nav(to)} />
      </aside>
    </div>
  )
}

function NoteGroup({
  label,
  items,
  byId,
  onSelect,
}: {
  label: string
  items: CrewNotice[]
  byId: Map<string, Task>
  onSelect: (n: CrewNotice) => void
}) {
  if (!items.length) return null
  return (
    <section className="note-group">
      <h3>{label}</h3>
      <div className="note-list">
        {items.map((n) => {
          const task = n.taskId ? byId.get(n.taskId) : undefined
          const people = peopleOf(n, task)
          const flag = flagOf(n)
          const preview = n.body.slice(0, 110)
          return (
            <button
              key={n.id}
              type="button"
              className={`note-row is-new tone-${n.tone}`}
              onClick={() => onSelect(n)}
            >
              <span className="note-copy">
                <span className="note-title-row">
                  <strong>{n.title}</strong>
                  {flag ? <span className={`note-flag is-${n.tone}`}>{flag}</span> : null}
                </span>
                {preview ? (
                  <em>
                    {preview}
                    {n.body.length > 110 ? '…' : ''}
                  </em>
                ) : null}
                <span className="note-row-foot">
                  <WhoLine people={people} />
                  {task ? <span className="note-dept">{deptLabel[task.department]}</span> : null}
                </span>
              </span>
              <time dateTime={n.at}>{stamp(n.at)}</time>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function TodayOverview({
  rows,
  onOpen,
}: {
  rows: Array<{ id: string; count: number; label: string; to: string }>
  onOpen: (to: string) => void
}) {
  return (
    <div className="note-today">
      <p className="eyebrow">Today</p>
      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <button type="button" onClick={() => onOpen(row.to)}>
              <span>{row.label}</span>
              <b>{row.count}</b>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
