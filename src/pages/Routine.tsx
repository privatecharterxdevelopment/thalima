import { useState, type FormEvent } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import { routineKey, routineLabel, routineSeeds } from '../data/routines'
import { romeDay } from '../lib/opsTasks'
import { useStore } from '../store'
import { crew } from '../data/crew'

function dayLine(day: string) {
  const [year, month, date] = day.split('-').map(Number)
  const stamp = new Date(Date.UTC(year, month - 1, date, 12))
  return stamp.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
}

export function Routine() {
  const { user, ops, toggleRoutine, noteRoutine, addRoutineItem, removeRoutineItem, addRoutineNote } = useStore()
  const [entry, setEntry] = useState('')
  const [note, setNote] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  if (!user) return null

  const position = routineKey(user)
  const day = romeDay()
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
    addRoutineItem(entry)
    setEntry('')
  }

  const onNote = (e: FormEvent) => {
    e.preventDefault()
    addRoutineNote(note)
    setNote('')
  }

  return (
    <div className="routine">
      <p className="routine-kicker">Daily routine</p>
      <h1>{routineLabel(position)}</h1>
      <p className="routine-lead">
        {dayLine(day)}. {done} of {items.length} done. Checks start again tomorrow morning.
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
                onClick={() => toggleRoutine(item.id)}
              >
                {tick?.done ? <Check size={14} strokeWidth={2.4} /> : null}
              </button>
              <div>
                <div className="routine-title">
                  <strong>{item.title}</strong>
                  {item.custom ? (
                    <button type="button" className="routine-drop" onClick={() => removeRoutineItem(item.id)} aria-label="Remove entry">
                      <Trash2 size={14} strokeWidth={1.7} />
                    </button>
                  ) : null}
                </div>
                <input
                  className="routine-item-note"
                  value={value}
                  placeholder="Add a note"
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  onBlur={() => {
                    if (value !== saved) noteRoutine(item.id, value)
                  }}
                />
              </div>
            </li>
          )
        })}
      </ul>

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
              <b>{crew.find((c) => c.id === row.by)?.name.split(' ')[0] ?? 'Crew'}</b>
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
    </div>
  )
}
