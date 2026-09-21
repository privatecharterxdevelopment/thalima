import { useEffect, useMemo, useRef } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { canSeeTask, clock, dueState, isFreshTask, taskAssignees } from '../lib/format'
import { channels } from '../data/crew'
import { visibleChannels } from '../lib/permissions'
import { useStore } from '../store'
import { useUi } from '../ui'

export function Notices() {
  const { user, tasks, messages, lastRead, systems, markTasksSeen } = useStore()
  const { bell, setBell, openTask } = useUi()
  const nav = useNavigate()
  const box = useRef<HTMLDivElement>(null)

  const items = useMemo(() => {
    if (!user) return []
    const list: { id: string; title: string; body: string; at: string; go: () => void }[] = []

    for (const t of tasks) {
      if (!canSeeTask(user, t) || t.status === 'done') continue
      if (isFreshTask(t, user.id, lastRead)) {
        list.push({
          id: `new-${t.id}`,
          title: 'New task',
          body: t.title,
          at: t.createdAt,
          go: () => openTask(t.id),
        })
      }
      const due = dueState(t.due)
      if (due === 'overdue') {
        list.push({
          id: `overdue-${t.id}`,
          title: 'Overdue',
          body: t.title,
          at: t.due,
          go: () => openTask(t.id),
        })
      } else if ((t.urgency === 'now' || t.urgency === 'emergency') && taskAssignees(t).includes(user.id)) {
        list.push({
          id: `hot-${t.id}`,
          title: t.urgency === 'emergency' ? 'Emergency' : 'Due now',
          body: t.title,
          at: t.due,
          go: () => openTask(t.id),
        })
      }
    }

    const vis = visibleChannels(user, channels)
    for (const ch of vis) {
      const read = lastRead[`${user.id}:${ch.id}`]
      const unread = messages.filter((m) => m.channelId === ch.id && m.authorId !== user.id && (!read || m.at > read))
      if (unread.length) {
        const last = unread[unread.length - 1]
        list.push({
          id: `msg-${ch.id}`,
          title: ch.name,
          body: last.text,
          at: last.at,
          go: () => nav(`/messages/${ch.id}`),
        })
      }
    }

    if (systems.hydraulics === 'watch') {
      list.push({
        id: 'hyd',
        title: 'Plant',
        body: 'Hydraulic vang manifold on watch. Level marked 08:00.',
        at: new Date().toISOString(),
        go: () => nav('/engineering'),
      })
    }

    return list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  }, [user, tasks, messages, lastRead, systems, openTask, nav])

  useEffect(() => {
    if (!bell) return
    const on = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setBell(false)
    }
    window.addEventListener('mousedown', on)
    return () => window.removeEventListener('mousedown', on)
  }, [bell, setBell])

  if (!user) return null

  return (
    <div className="bell-wrap" ref={box}>
    <button
        className="ghost-icon"
      aria-label="Notifications"
        onClick={() => setBell(!bell)}
      >
        <Bell size={18} />
        {items.length > 0 && <span className="badge">{items.length > 9 ? '9+' : items.length}</span>}
      </button>
      {bell && (
        <div className="menu-pop">
          <header>
            <strong>Inbox</strong>
            <span>{items.length}</span>
          </header>
          {items.length === 0 ? (
            <p className="hint" style={{ padding: '12px 14px' }}>
              Quiet.
            </p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                className="menu-row"
                onClick={() => {
                  n.go()
                  if (n.id.startsWith('new-')) markTasksSeen()
                  setBell(false)
                }}
              >
                <span>
                  <b>{n.title}</b>
                  {n.body}
                </span>
                <small>{clock(n.at)}</small>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
