import { useState, type FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { crew } from '../data/crew'
import { dayClock, relative, uid } from '../lib/format'
import { useStore } from '../store'
import type { TripGuest } from '../types'

function localInput(iso: string) {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function emptyGuest(): TripGuest {
  return { id: uid('g'), name: '', cabin: '', diet: '', allergy: '', laundry: '' }
}

export function EventPage() {
  const { tripId } = useParams()
  const { user, ops, updateTrip, addTripNote, addTask, setTripPrepped } = useStore()
  const [note, setNote] = useState('')

  if (!user) return null

  const trip = ops.trips.find((t) => t.id === tripId)
  if (!trip) return <Navigate to="/calendar?tab=trips" replace />

  const can = user.level <= 2
  const log = [...(trip.log ?? [])].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  function post(e: FormEvent) {
    e.preventDefault()
    if (!trip || !can || !note.trim()) return
    addTripNote(trip.id, note)
    setNote('')
  }

  function patchGuest(index: number, field: keyof TripGuest, value: string) {
    if (!trip) return
    const guests = trip.guests.map((g, i) => {
      if (i !== index) return g
      return { ...g, id: g.id ?? uid('g'), [field]: value }
    })
    updateTrip(trip.id, { guests })
  }

  function addGuest() {
    if (!trip) return
    updateTrip(trip.id, { guests: [...trip.guests, emptyGuest()] })
  }

  function removeGuest(index: number) {
    if (!trip) return
    updateTrip(trip.id, { guests: trip.guests.filter((_, i) => i !== index) })
  }

  function makePrep() {
    if (!trip || trip.prepped) return
    addTask({
      title: `Prepare cabins · ${trip.title}`,
      body: trip.guests.map((g) => `${g.name} · ${g.cabin} · ${g.allergy}`).join('\n') || trip.notes,
      department: 'interior',
      assigneeId: 'sofia',
      urgency: 'soon',
      due: trip.from,
      kind: 'guest_request',
    })
    addTask({
      title: `Provisioning · ${trip.title}`,
      body: trip.notes,
      department: 'galley',
      assigneeId: 'julien',
      urgency: 'soon',
      due: trip.from,
      kind: 'provisioning',
    })
    if (trip.transfers) {
      addTask({
        title: `Transfer · ${trip.title}`,
        body: trip.transfers,
        department: 'deck',
        assigneeId: 'luca',
        urgency: 'soon',
        due: trip.from,
        kind: 'tender',
      })
    }
    setTripPrepped(trip.id)
  }

  return (
    <article className="task-page event-page">
      <Link className="task-page-back" to="/calendar?tab=trips">
        <ArrowLeft size={16} strokeWidth={2} />
        Events
      </Link>

      <div className="task-page-grid">
        <div className="task-page-main">
          <p className="inv-kicker">{trip.ownerAboard ? 'Owner aboard' : 'Charter / guests'}</p>

          {can ? (
            <label className="event-field">
              Title
              <input
                className="event-title-input"
                value={trip.title}
                onChange={(e) => updateTrip(trip.id, { title: e.target.value })}
              />
            </label>
          ) : (
            <h2 className="task-page-title">{trip.title}</h2>
          )}

          <div className="event-dates">
            {can ? (
              <>
                <label className="event-field">
                  From
                  <input
                    type="datetime-local"
                    value={localInput(trip.from)}
                    onChange={(e) => updateTrip(trip.id, { from: new Date(e.target.value).toISOString() })}
                  />
                </label>
                <label className="event-field">
                  To
                  <input
                    type="datetime-local"
                    value={localInput(trip.to)}
                    onChange={(e) => updateTrip(trip.id, { to: new Date(e.target.value).toISOString() })}
                  />
                </label>
              </>
            ) : (
              <p className="task-page-meta">
                {dayClock(trip.from)} → {dayClock(trip.to)}
              </p>
            )}
          </div>

          {can ? (
            <label className="event-field">
              Who is coming
              <select
                value={trip.ownerAboard ? 'owner' : 'charter'}
                onChange={(e) => updateTrip(trip.id, { ownerAboard: e.target.value === 'owner' })}
              >
                <option value="owner">Owner aboard</option>
                <option value="charter">Charter / guests</option>
              </select>
            </label>
          ) : null}

          <section className="event-guests">
            <div className="event-guests-head">
              <p className="eyebrow">Guests</p>
              {can ? (
                <button type="button" className="text-link" onClick={addGuest}>
                  <Plus size={14} strokeWidth={2} />
                  Add guest
                </button>
              ) : null}
            </div>
            {trip.guests.length === 0 ? <p className="hint">No guests yet.</p> : null}
            {trip.guests.length > 0 ? (
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
                      {can ? (
                        <>
                          <td>
                            <input value={g.name} onChange={(e) => patchGuest(i, 'name', e.target.value)} placeholder="Name" />
                          </td>
                          <td>
                            <input value={g.cabin} onChange={(e) => patchGuest(i, 'cabin', e.target.value)} placeholder="Cabin" />
                          </td>
                          <td>
                            <input value={g.diet} onChange={(e) => patchGuest(i, 'diet', e.target.value)} placeholder="Diet" />
                          </td>
                          <td>
                            <input
                              value={g.allergy}
                              onChange={(e) => patchGuest(i, 'allergy', e.target.value)}
                              placeholder="Allergy"
                            />
                          </td>
                          <td>
                            <input
                              value={g.laundry}
                              onChange={(e) => patchGuest(i, 'laundry', e.target.value)}
                              placeholder="Laundry"
                            />
                          </td>
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
                        </>
                      ) : (
                        <>
                          <td>{g.name}</td>
                          <td>{g.cabin}</td>
                          <td>{g.diet}</td>
                          <td className={g.allergy !== '—' && g.allergy ? 'low' : ''}>{g.allergy || '—'}</td>
                          <td className="muted">{g.laundry || '—'}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </section>

          <label className="event-field">
            Transfers
            {can ? (
              <input
                value={trip.transfers}
                onChange={(e) => updateTrip(trip.id, { transfers: e.target.value })}
                placeholder="Tender times, airports…"
              />
            ) : (
              <p>{trip.transfers || '—'}</p>
            )}
          </label>

          <label className="event-field">
            Reservations
            {can ? (
              <input
                value={trip.reservations}
                onChange={(e) => updateTrip(trip.id, { reservations: e.target.value })}
                placeholder="Dinner ashore, beach club…"
              />
            ) : (
              <p>{trip.reservations || '—'}</p>
            )}
          </label>

          <label className="event-field">
            Notes
            {can ? (
              <textarea
                rows={3}
                value={trip.notes}
                onChange={(e) => updateTrip(trip.id, { notes: e.target.value })}
                placeholder="Cabin setup, preferences…"
              />
            ) : (
              <p>{trip.notes || '—'}</p>
            )}
          </label>

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
                <span />
                <button className="btn" type="submit" disabled={!note.trim()}>
                  Post
                </button>
              </div>
            </form>
          ) : (
            <p className="hint">You can read this event. Editing is for bridge and leads.</p>
          )}
        </div>
      </div>
    </article>
  )
}
