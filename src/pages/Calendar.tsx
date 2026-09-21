import { useMemo, useState } from 'react'
import { calRoleLabel, calRoles, crew } from '../data/crew'
import { clock } from '../lib/format'
import { monthDays, sameDay } from '../lib/cal'
import { canAdminCalendar, canEditCalendar } from '../lib/permissions'
import { useStore } from '../store'
import type { CalRole } from '../types'

function localInput(iso: string) {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function Calendar() {
  const { user, events, addEvent, removeEvent } = useStore()
  const [role, setRole] = useState<CalRole | 'all'>(() => {
    if (user && user.level > 1 && (calRoles as readonly string[]).includes(user.role)) {
      return user.role as CalRole
    }
    return 'all'
  })
  const [cursor, setCursor] = useState(() => new Date())
  const [picked, setPicked] = useState(() => new Date())
  const [compose, setCompose] = useState(false)

  if (!user) return null

  const admin = canAdminCalendar(user)
  const visible = events.filter((e) => role === 'all' || e.role === role)
  const onDay = visible
    .filter((e) => sameDay(new Date(e.start), picked))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  const cells = monthDays(cursor)
  const monthName = cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Europe/Rome' })
  const canWrite = role === 'all' ? admin : canEditCalendar(user, role)

  return (
    <div className="cal">
      <div className="cal-month glass-card">
        <div className="cal-nav">
          <button className="ghost-icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Previous month">
            ‹
          </button>
          <span>{monthName}</span>
          <button className="ghost-icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Next month">
            ›
          </button>
        </div>
        <div className="cal-week">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="cal-grid">
          {cells.map((day, i) => {
            if (!day) return <span key={`e-${i}`} />
            const dots = visible.filter((e) => sameDay(new Date(e.start), day)).length
            const on = sameDay(day, picked)
            const today = sameDay(day, new Date())
            return (
              <button key={day.toISOString()} className={`cal-day ${on ? 'on' : ''} ${today ? 'today' : ''}`} onClick={() => setPicked(day)}>
                {day.getDate()}
                {dots > 0 && <i />}
              </button>
            )
          })}
        </div>
      </div>

      <section className="cal-agenda glass-card">
        <div className="filters">
          <button className={role === 'all' ? 'on' : ''} onClick={() => setRole('all')}>
            All
          </button>
          {calRoles.map((r) => (
            <button key={r} className={role === r ? 'on' : ''} onClick={() => setRole(r)}>
              {calRoleLabel[r]}
            </button>
          ))}
        </div>
        <div className="cal-agenda-head">
          <span>
            {picked.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
              timeZone: 'Europe/Rome',
            })}
          </span>
          {canWrite && (
            <button className="btn" onClick={() => setCompose(true)}>
              New
            </button>
          )}
        </div>
        <div className="cal-list">
          {onDay.length === 0 ? (
            <p className="hint">Quiet.</p>
          ) : (
            onDay.map((e) => {
              const who = crew.find((c) => c.id === e.createdBy)
              const edit = canEditCalendar(user, e.role)
              return (
                <article key={e.id} className="cal-item">
                  <time>
                    {clock(e.start)} – {clock(e.end)}
                  </time>
                  <div>
                    <strong>{e.title}</strong>
                    <p>{e.body}</p>
                    <small>
                      {calRoleLabel[e.role]}
                      {who ? ` · ${who.name.split(' ')[0]}` : ''}
                    </small>
                  </div>
                  {edit && (
                    <button className="text-link" onClick={() => removeEvent(e.id)}>
                      Remove
                    </button>
                  )}
                </article>
              )
            })
          )}
        </div>
      </section>

      {compose && canWrite && (
        <NewEvent
          defaultRole={role === 'all' ? (admin ? 'captain' : (user.role as CalRole)) : role}
          day={picked}
          admin={admin}
          onClose={() => setCompose(false)}
          onSave={(input) => {
            addEvent(input)
            setCompose(false)
          }}
        />
      )}
    </div>
  )
}

function NewEvent({
  defaultRole,
  day,
  admin,
  onClose,
  onSave,
}: {
  defaultRole: CalRole
  day: Date
  admin: boolean
  onClose: () => void
  onSave: (input: { title: string; body: string; role: CalRole; start: string; end: string }) => void
}) {
  const { user } = useStore()
  const start0 = useMemo(() => {
    const d = new Date(day)
    d.setHours(9, 0, 0, 0)
    return localInput(d.toISOString())
  }, [day])
  const end0 = useMemo(() => {
    const d = new Date(day)
    d.setHours(10, 0, 0, 0)
    return localInput(d.toISOString())
  }, [day])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [role, setRole] = useState<CalRole>(defaultRole)
  const [start, setStart] = useState(start0)
  const [end, setEnd] = useState(end0)
  if (!user) return null

  const roles = admin ? calRoles : calRoles.filter((r) => canEditCalendar(user, r))

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New entry</h2>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim()) return
            onSave({
              title: title.trim(),
              body: body.trim(),
              role,
              start: new Date(start).toISOString(),
              end: new Date(end).toISOString(),
            })
          }}
        >
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            Notes
            <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <label>
            Calendar
            <select value={role} onChange={(e) => setRole(e.target.value as CalRole)} disabled={!admin && roles.length === 1}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {calRoleLabel[r]}
                </option>
              ))}
            </select>
          </label>
          <label>
            From
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            To
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
          <div className="row-btns">
            <button className="btn" type="submit">
              Save
            </button>
            <button className="btn ghost" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
