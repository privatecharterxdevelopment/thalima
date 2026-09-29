import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Check, Plus, Trash2 } from 'lucide-react'
import { SignaturePad } from '../components/SignaturePad'
import { routineKey, routineLabel, routineSeeds } from '../data/routines'
import { clock } from '../lib/format'
import { romeDay, romeDayLong } from '../lib/opsTasks'
import { useStore } from '../store'
import { crew } from '../data/crew'

export function Routine() {
  const { user, ops, toggleRoutine, noteRoutine, addRoutineItem, removeRoutineItem, addRoutineNote, signRoutine } =
    useStore()
  const [entry, setEntry] = useState('')
  const [note, setNote] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [ink, setInk] = useState('')
  if (!user) return null

  const position = routineKey(user)
  const day = romeDay()
  const filed = (ops.routineReports ?? []).find((row) => row.userId === user.id && row.day === day)
  const seeds = routineSeeds(position)
  const custom = (ops.routineItems ?? []).filter((row) => row.position === position)
  const items = [
    ...seeds.map((row) => ({ ...row, custom: false })),
    ...custom.map((row) => ({ id: row.id, title: row.title, custom: true })),
  ]
  const ticks = (ops.routineTicks ?? []).filter((tick) => tick.day === day)
  const notes = (ops.routineNotes ?? []).filter((row) => row.position === position && row.day === day)
  const done = items.filter((item) => ticks.find((tick) => tick.itemId === item.id)?.done).length

  const onAdd = (e: FormEvent) => {
    e.preventDefault()
    if (filed) return
    addRoutineItem(entry)
    setEntry('')
  }

  const onNote = (e: FormEvent) => {
    e.preventDefault()
    if (filed) return
    addRoutineNote(note)
    setNote('')
  }

  const onSign = (e: FormEvent) => {
    e.preventDefault()
    if (!ink) return
    signRoutine(ink)
    setInk('')
  }

  return (
    <div className="routine">
      <p className="routine-kicker">Daily routine</p>
      <h1>{routineLabel(position)}</h1>
      <p className="routine-lead">
        {romeDayLong(day)}. {done} of {items.length} done.
        {filed
          ? ` Filed at ${clock(filed.signedAt)}.`
          : ' Sign the day to file it under My reports. Checks start again tomorrow morning.'}
      </p>
      <p className="routine-links">
        <Link to="/reports">My reports</Link>
      </p>

      <ul className="routine-list">
        {items.map((item) => {
          const tick = ticks.find((row) => row.itemId === item.id)
          const saved = tick?.note ?? ''
          const value = drafts[item.id] ?? saved
          return (
            <li key={item.id} className={tick?.done ? 'is-done' : ''}>
              <button
                type="button"
                className={`routine-check${tick?.done ? ' on' : ''}`}
                aria-pressed={Boolean(tick?.done)}
                aria-label={tick?.done ? `Mark ${item.title} open` : `Mark ${item.title} done`}
                disabled={Boolean(filed)}
                onClick={() => toggleRoutine(item.id)}
              >
                {tick?.done ? <Check size={14} strokeWidth={2.4} /> : null}
              </button>
              <div>
                <div className="routine-title">
                  <strong>{item.title}</strong>
                  {tick?.done && tick.at ? <em>{clock(tick.at)}</em> : null}
                  {item.custom && !filed ? (
                    <button type="button" className="routine-drop" onClick={() => removeRoutineItem(item.id)} aria-label="Remove entry">
                      <Trash2 size={14} strokeWidth={1.7} />
                    </button>
                  ) : null}
                </div>
                <input
                  className="routine-item-note"
                  value={value}
                  placeholder="Add a note"
                  disabled={Boolean(filed)}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  onBlur={() => {
                    if (!filed && value !== saved) noteRoutine(item.id, value)
                  }}
                />
              </div>
            </li>
          )
        })}
      </ul>

      {filed ? (
        <section className="routine-filed">
          <h2>Filed</h2>
          <p>
            {romeDayLong(day)} is signed and locked. The report keeps each line and the time it was completed.
          </p>
          {notes.length > 0 ? (
            <ul className="routine-notes" style={{ listStyle: 'none', margin: '0 0 1.2rem', padding: 0 }}>
              {notes.map((row) => (
                <li key={row.id}>
                  <b>
                    {crew.find((c) => c.id === row.by)?.name.split(' ')[0] ?? 'Crew'} · {clock(row.at)}
                  </b>
                  <span>{row.text}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <figure className="report-sign">
            <figcaption>Signature · {clock(filed.signedAt)}</figcaption>
            <img src={filed.signature} alt={`Signature of ${filed.userName}`} />
          </figure>
          <Link to="/reports">Open My reports</Link>
        </section>
      ) : (
        <>
          <form className="routine-add" onSubmit={onAdd}>
            <input
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="New entry for this position"
              aria-label="New routine entry"
            />
            <button type="submit" disabled={!entry.trim()}>
              <Plus size={15} strokeWidth={2} />
              Add
            </button>
          </form>

          <section className="routine-notes">
            <h2>Notes</h2>
            {notes.length === 0 ? <p className="routine-quiet">Nothing written for today.</p> : null}
            <ul>
              {notes.map((row) => (
                <li key={row.id}>
                  <b>
                    {crew.find((c) => c.id === row.by)?.name.split(' ')[0] ?? 'Crew'} · {clock(row.at)}
                  </b>
                  <span>{row.text}</span>
                </li>
              ))}
            </ul>
            <form onSubmit={onNote}>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write a note for today’s routine"
                rows={3}
              />
              <button type="submit" disabled={!note.trim()}>
                Save note
              </button>
            </form>
          </section>

          <form className="routine-sign" onSubmit={onSign}>
            <h2>Sign and file</h2>
            <p>
              Filing signs today’s {routineLabel(position).toLowerCase()} checklist for {romeDayLong(day)}. The report
              cannot be changed afterwards.
            </p>
            <SignaturePad onInk={setInk} />
            <button type="submit" disabled={!ink}>
              Sign and file
            </button>
          </form>
        </>
      )}
    </div>
  )
}
