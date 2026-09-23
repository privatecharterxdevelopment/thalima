import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { crew } from '../data/crew'
import { dayClock, relative, uid } from '../lib/format'
import type { TripGuest } from '../types'

function localInput(iso: string) {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function emptyGuest(): TripGuest {
  return { id: uid('tg'), name: '', cabin: '', diet: '', allergy: '', laundry: '' }
}

export function EventPage() {
  const { tripId } = useParams()
  const { user, ops, updateTrip, addTripNote, addTask, setTripPrepped } = useStore()
  const [note, setNote] = useState('')
  const trip = ops.trips.find((t) => t.id === tripId)

  const [title, setTitle] = useState(trip?.title ?? '')
  const [from, setFrom] = useState(trip ? localInput(trip.from) : '')
  const [to, setTo] = useState(trip ? localInput(trip.to) : '')
  const [transfers, setTransfers] = useState(trip?.transfers ?? '')
  const [reservations, setReservations] = useState(trip?.reservations ?? '')
  const [notes, setNotes] = useState(trip?.notes ?? '')

  useEffect(() => {
    if (!trip) return
    setTitle(trip.title)
    setFrom(localInput(trip.from))
    setTo(localInput(trip.to))
    setTransfers(trip.transfers)
    setReservations(trip.reservations)
    setNotes(trip.notes)
  }, [trip])

  if (!user) return null
  if (!trip) return <Navigate to="/calendar?tab=trips" replace />

  const can = user.level <= 2
  const log = [...(trip.log ?? [])].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  function commitTitle() {
    const next = title.trim()
    if (!can || !next || next === trip!.title) {
      setTitle(trip!.title)
      return
    }
    updateTrip(trip!.id, { title: next })
  }

  function commitDates() {
    if (!can) return
    const a = new Date(from).toISOString()
    const b = new Date(to).toISOString()
    const nextFrom = a <= b ? a : b
    const nextTo = a <= b ? b : a
    const patch: { from?: string; to?: string } = {}
    if (nextFrom !== trip!.from) patch.from = nextFrom
    if (nextTo !== trip!.to) patch.to = nextTo
    if (Object.keys(patch).length) updateTrip(trip!.id, patch)
  }

  function commitField(key: 'transfers' | 'reservations' | 'notes', value: string) {
    if (!can || value === trip![key]) return
    updateTrip(trip!.id, { [key]: value })
  }

  function patchGuest(index: number, patch: Partial<TripGuest>) {
    if (!can) return
    const guests = trip!.guests.map((g, i) => (i === index ? { ...g, ...patch } : g))
    updateTrip(trip!.id, { guests })
  }

  function addGuest() {
    if (!can) return
    updateTrip(trip!.id, { guests: [...trip!.guests, emptyGuest()] })
  }

  function removeGuest(index: number) {
    if (!can) return
    updateTrip(trip!.id, { guests: trip!.guests.filter((_, i) => i !== index) })
  }

  function post(e: FormEvent) {
    e.preventDefault()
    if (!can || !note.trim()) return
    addTripNote(trip!.id, note)
    setNote('')
  }

  function makePrep() {
    if (!can || trip!.prepped) return
    addTask({
      title: `Prepare cabins · ${trip!.title}`,
      body: trip!.guests.map((g) => `${g.name} · ${g.cabin} · ${g.allergy}`).join('\n') || trip!.notes,
      department: 'interior',
      assigneeId: 'sofia',
      urgency: 'soon',
      due: trip!.from,
      kind: 'guest_request',
    })
    addTask({
      title: `Provisioning · ${trip!.title}`,
      body: trip!.notes,
      department: 'galley',
      assigneeId: 'julien',
      urgency: 'soon',
      due: trip!.from,
      kind: 'provisioning',
    })
    if (trip!.transfers) {
      addTask({
        title: `Transfer · ${trip!.title}`,
        body: trip!.transfers,
        department: 'deck',
        assigneeId: 'luca',
        urgency: 'soon',
        due: trip!.from,
        kind: 'tender',
      })
    }
    setTripPrepped(trip!.id)
  }

  return (
    <article className="task-page event-page">
      <Link className="task-page-back" to="/calendar?tab=trips">
        <ArrowLeft size={16} strokeWidth={2} />
        Events
      </Link>

      <div className="task-page-grid">
        <div className="task-page-main">
          <div className="task-page-tags">
            <span className="event-kicker">{trip.ownerAboard ? 'Owner aboard' : 'Charter / guests'}</span>
            <span>
              {dayClock(trip.from)} → {dayClock(trip.to)}
            </span>
          </div>

          {can ? (
            <input
              className="event-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              }}
              aria-label="Event title"
            />
          ) : (
            <h2 className="task-page-title">{trip.title}</h2>
          )}

          {can ? (
            <div className="event-edit-grid">
              <label>
                From
                <input
                  type="datetime-local"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  onBlur={commitDates}
                />
              </label>
              <label>
                To
                <input
                  type="datetime-local"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  onBlur={commitDates}
                />
              </label>
              <label>
                Who is coming
                <select
                  value={trip.ownerAboard ? 'owner' : 'charter'}
                  onChange={(e) => updateTrip(trip.id, { ownerAboard: e.target.value === 'owner' })}
                >
                  <option value="owner">Owner aboard</option>
                  <option value="charter">Charter / guests</option>
                </select>
              </label>
            </div>
          ) : (
            <p className="task-page-body">
              {trip.ownerAboard ? 'Owner aboard' : 'Charter / guests'} · {dayClock(trip.from)} → {dayClock(trip.to)}
            </p>
          )}

          <section className="event-block">
            <div className="event-block-head">
              <h3>Guests</h3>
              {can ? (
                <button type="button" className="text-link" onClick={addGuest}>
                  <Plus size={14} strokeWidth={2} />
                  Add guest
                </button>
              ) : null}
            </div>
            {trip.guests.length === 0 ? (
              <p className="hint">No guests listed yet.</p>
            ) : (
              <table className="table inv-table event-guest-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Cabin</th>
                    <th>Diet</th>
                    <th>Allergy</th>
                    <th>Laundry</th>
                    {can ? <th /> : null}
                  </tr>
                </thead>
                <tbody>
                  {trip.guests.map((g, i) => (
                    <tr key={g.id ?? `${g.name}-${i}`}>
                      {(['name', 'cabin', 'diet', 'allergy', 'laundry'] as const).map((field) => (
                        <td key={field}>
                          {can ? (
                            <GuestCell
                              value={g[field]}
                              placeholder={field === 'name' ? 'Name' : '—'}
                              onCommit={(value) => patchGuest(i, { [field]: value || (field === 'name' ? '' : '—') })}
                            />
                          ) : (
                            <span className={field === 'allergy' && g.allergy !== '—' ? 'low' : field === 'laundry' ? 'muted' : undefined}>
                              {g[field] || '—'}
                            </span>
                          )}
                        </td>
                      ))}
                      {can ? (
                        <td>
                          <button
                            type="button"
                            className="ghost-icon"
                            aria-label={`Remove ${g.name || 'guest'}`}
                            onClick={() => removeGuest(i)}
                          >
                            <Trash2 size={14} strokeWidth={1.75} />
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="event-block">
            <h3>Transfers</h3>
            {can ? (
              <textarea
                rows={2}
                value={transfers}
                onChange={(e) => setTransfers(e.target.value)}
                onBlur={() => commitField('transfers', transfers)}
                placeholder="Tender times, cars, flights…"
              />
            ) : (
              <p className="task-page-body">{trip.transfers || '—'}</p>
            )}
          </section>

          <section className="event-block">
            <h3>Reservations</h3>
            {can ? (
              <textarea
                rows={2}
                value={reservations}
                onChange={(e) => setReservations(e.target.value)}
                onBlur={() => commitField('reservations', reservations)}
                placeholder="Dinner ashore, beach club…"
              />
            ) : (
              <p className="task-page-body">{trip.reservations || '—'}</p>
            )}
          </section>

          <section className="event-block">
            <h3>Notes</h3>
            {can ? (
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => commitField('notes', notes)}
                placeholder="Cabins, preferences, watch-outs…"
              />
            ) : (
              <p className="task-page-body">{trip.notes || '—'}</p>
            )}
          </section>

          {can && !trip.prepped ? (
            <button className="btn" type="button" onClick={makePrep}>
              Make prep tasks
            </button>
          ) : null}
          {trip.prepped ? <p className="hint">Prep tasks are on the board.</p> : null}
        </div>

        <div className="task-page-side">
          <section className="task-log">
            <p className="eyebrow">Log</p>
            {log.length === 0 ? <p className="task-log-empty">No changes yet.</p> : null}
            {log.map((entry) => {
              const who = crew.find((c) => c.id === entry.authorId)
              const sys = entry.kind && entry.kind !== 'note'
              return (
                <article key={entry.id} className={sys ? 'task-log-item is-sys' : 'task-log-item'}>
                  <span className="task-log-dot" />
                  <div>
                    <p>
                      <b>{who?.name.split(' ')[0] ?? 'Crew'}</b>
                      <time>{relative(entry.at)}</time>
                    </p>
                    {sys ? (
                      <>
                        <p className="task-log-sys">
                          {entry.kind === 'guest' ? 'Guest list' : entry.kind === 'prep' ? 'Prep' : 'Updated'}
                        </p>
                        <p>{entry.text}</p>
                      </>
                    ) : (
                      <p>{entry.text}</p>
                    )}
                  </div>
                </article>
              )
            })}
          </section>

          {can ? (
            <form className="task-compose" onSubmit={post}>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note to the log…"
              />
              <div>
                <div className="task-compose-actions" />
                <button className="btn" type="submit" disabled={!note.trim()}>
                  Post
                </button>
              </div>
            </form>
          ) : (
            <p className="hint">You can read this event. Editing is for bridge and heads.</p>
          )}
        </div>
      </div>
    </article>
  )
}

function GuestCell({
  value,
  placeholder,
  onCommit,
}: {
  value: string
  placeholder: string
  onCommit: (value: string) => void
}) {
  const [local, setLocal] = useState(value === '—' ? '' : value)
  useEffect(() => {
    setLocal(value === '—' ? '' : value)
  }, [value])

  return (
    <input
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const next = local.trim()
        const prev = value === '—' ? '' : value
        if (next !== prev) onCommit(next)
      }}
    />
  )
}
