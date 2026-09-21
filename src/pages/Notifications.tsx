import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { dayClock } from '../lib/format'
import { buildNotices, isNoticeSeen } from '../lib/notices'
import { useStore } from '../store'

export function Notifications() {
  const { user, tasks, lastRead, seenNotices, markNoticeSeen } = useStore()
  const nav = useNavigate()

  const items = useMemo(() => {
    if (!user) return []
    return buildNotices({ user, tasks, lastRead })
  }, [user, tasks, lastRead])

  if (!user) return null

  const unseen = items.filter((n) => !isNoticeSeen(user.id, n.id, seenNotices)).length

  return (
    <div className="pad note-page">
      <p className="note-kicker">
        {items.length === 0 ? 'Nothing waiting.' : unseen ? `${unseen} new` : 'All seen.'}
      </p>

      {items.length === 0 ? (
        <p className="note-empty">No notifications on your seats.</p>
      ) : (
        <div className="note-list">
          {items.map((n) => {
            const seen = isNoticeSeen(user.id, n.id, seenNotices)
            const to = n.taskId ? `/board/${n.taskId}` : n.to
            return (
              <button
                key={n.id}
                type="button"
                className={`note-row ${seen ? 'is-read' : ''} tone-${n.tone}`}
                onClick={() => {
                  if (!seen) markNoticeSeen(n.id)
                  nav(to)
                }}
              >
                <span className="note-copy">
                  <strong>{n.title}</strong>
                  <em>{n.body}</em>
                </span>
                <time>{dayClock(n.at)}</time>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
