import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { calRoleLabel, calRoles, crew } from '../data/crew'
import { clock, dayClock } from '../lib/format'
import { monthDays, sameDay } from '../lib/cal'
import { romeDay } from '../lib/opsTasks'
import { formatSpan, rosterKindLabel, visibleRoster } from '../lib/roster'
import { canAdminCalendar, canEditCalendar } from '../lib/permissions'
import { useStore } from '../store'
import { SectionTabs } from '../components/SectionTabs'
import type { CalRole, Trip, TripGuest } from '../types'

const calTabs = [
  { id: 'diary', label: 'Diary' },
  { id: 'trips', label: 'Events' },
] as const

function localInput(iso: string) {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function Calendar() {
  const { user, events, addEvent, removeEvent, ops, addTrip, roster } = useStore()
  const [params, setParams] = useSearchParams()
  const view = (params.get('tab') === 'trips' ? 'trips' : 'diary') as 'diary' | 'trips'
  const [role, setRole] = useState<CalRole | 'all'>(() => {
    if (user && user.level > 1 && (calRoles as readonly string[]).includes(user.role)) {
      return user.role as CalRole
    }
    return 'all'
  })
  const [cursor, setCursor] = useState(() => new Date())
  const [picked, setPicked] = useState(() => new Date())
  const [compose, setCompose] = useState(false)
  const [tripCompose, setTripCompose] = useState(false)

  useEffect(() => {
    const want = params.get('new')
    if (want === 'event') {
      setTripCompose(true)
      setParams({ tab: 'trips' }, { replace: true })
    } else if (want === '1') {
      setCompose(true)
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  if (!user) return null

  const admin = canAdminCalendar(user)
  const visible = events.filter((e) => role === 'all' || e.role === role)
  const absences = visibleRoster(roster).filter((e) => {
    if (e.status !== 'approved') return false
    if (e.presence !== 'offboard' && e.duty !== 'leave') return false
    if (role === 'all') return true
    const who = crew.find((c) => c.id === e.crewId)
    return who?.role === role
  })
  const onDay = visible
    .filter((e) => sameDay(new Date(e.start), picked))
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  const cells = monthDays(cursor)
  const monthName = cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Europe/Rome' })
  const canWrite = role === 'all' ? admin : canEditCalendar(user, role)
  const viewSwitch = (
    <SectionTabs value={view} onChange={(id) => setParams(id === 'diary' ? {} : { tab: id })} tabs={[...calTabs]} />
  )

  return (
    <div className={`cal ${view === 'trips' ? 'cal-trips' : ''}`}>
      {view === 'trips' ? (
        <div className="trip-list">
          <div className="cal-trips-head">{viewSwitch}</div>
          {ops.trips.map((trip) => (
            <Link key={trip.id} to={`/calendar/event/${trip.id}`} className="glass-card trip-card">
              <p className="inv-kicker">{trip.ownerAboard ? 'Owner aboard' : 'Charter / guests'}</p>
              <h2>{trip.title}</h2>
              <p className="muted">
                {dayClock(trip.from)} → {dayClock(trip.to)}
                {trip.guests.length > 0 ? ` · ${trip.guests.length} guests` : ''}
              </p>
            </Link>
          ))}
          {tripCompose && user.level <= 2 ? (
            <NewTrip
              onClose={() => setTripCompose(false)}
              onSave={(input) => {
                addTrip(input)
                setTripCompose(false)
              }}
            />
          ) : null}
        </div>
      ) : (
        <>
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
            const key = romeDay(day.toISOString())
            const dots = visible.filter((e) => sameDay(new Date(e.start), day)).length
            const away = absences.filter((e) => e.from <= key && e.to >= key).length
            const on = sameDay(day, picked)
            const today = sameDay(day, new Date())
            return (
              <button key={day.toISOString()} className={`cal-day ${on ? 'on' : ''} ${today ? 'today' : ''}`} onClick={() => setPicked(day)}>
                {day.getDate()}
                {dots > 0 && <i />}
                {away > 0 && <i className="is-away" />}
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
          {viewSwitch}
        </div>
        <div className="cal-list">
          {(() => {
            const key = romeDay(picked.toISOString())
            const awayToday = absences.filter((e) => e.from <= key && e.to >= key)
            if (onDay.length === 0 && awayToday.length === 0) {
              return <p className="hint">Quiet.</p>
            }
            return (
              <>
                {awayToday.map((row) => {
                  const who = crew.find((c) => c.id === row.crewId)
                  return (
                    <article key={row.id} className="cal-item is-roster">
                      <time>Off board</time>
                      <div>
                        <strong>{who?.name}</strong>
                        <p>
                          {rosterKindLabel[row.kind].toUpperCase()} · {formatSpan(row.from, row.to)}
                        </p>
                      </div>
                    </article>
                  )
                })}
                {onDay.map((e) => {
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
                })}
              </>
            )
          })()}
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
        </>
      )}
    </div>
  )
}

function parseGuests(raw: string): TripGuest[] {
  return raw
    .split('\n')
    .map((line) => line.split(/[·|,]/).map((bit) => bit.trim()))
    .filter((bits) => bits[0])
    .map(([name, cabin, diet, allergy]) => ({
      name,
      cabin: cabin || '—',
      diet: diet || '—',
      allergy: allergy || '—',
      laundry: '—',
    }))
}

function NewTrip({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (input: Omit<Trip, 'id' | 'prepped' | 'log'>) => void
}) {
  const [title, setTitle] = useState('')
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    return localInput(d.toISOString())
  })
  const [to, setTo] = useState(() => {
    const d = new Date(Date.now() + 2 * 86_400_000)
    d.setHours(12, 0, 0, 0)
    return localInput(d.toISOString())
  })
  const [ownerAboard, setOwnerAboard] = useState(true)
  const [guests, setGuests] = useState('')
  const [transfers, setTransfers] = useState('')
  const [reservations, setReservations] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New event</h2>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim()) return
            const a = new Date(from).toISOString()
            const b = new Date(to).toISOString()
            onSave({
              title: title.trim(),
              from: a <= b ? a : b,
              to: a <= b ? b : a,
              ownerAboard,
              guests: parseGuests(guests),
              transfers: transfers.trim(),
              reservations: reservations.trim(),
              notes: notes.trim(),
            })
          }}
        >
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Owner weekend · Bonifacio" required />
          </label>
          <label>
            From
            <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            To
            <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label>
            Who is coming
            <select value={ownerAboard ? 'owner' : 'charter'} onChange={(e) => setOwnerAboard(e.target.value === 'owner')}>
              <option value="owner">Owner aboard</option>
              <option value="charter">Charter / guests</option>
            </select>
          </label>
          <label>
            Guests
            <textarea
              rows={3}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder={'One per line: Name · Cabin · Diet · Allergy\nMrs Adler · Owner suite · Soft wake 08:00'}
            />
          </label>
          <label>
            Transfers
            <input value={transfers} onChange={(e) => setTransfers(e.target.value)} placeholder="Tender 18:30 Porto Rotondo" />
          </label>
          <label>
            Reservations
            <input value={reservations} onChange={(e) => setReservations(e.target.value)} placeholder="Dinner ashore, beach club…" />
          </label>
          <label>
            Notes
            <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <div className="row-btns">
            <button className="btn" type="submit">
              Save event
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
