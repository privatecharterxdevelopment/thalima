import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Check, Plus, Trash2 } from 'lucide-react'
import { SignaturePad } from '../components/SignaturePad'
import { crew } from '../data/crew'
import { routineKey, routineSeeds } from '../data/routines'
import { clock, relative } from '../lib/format'
import { romeDay, romeDayLong } from '../lib/opsTasks'
import { useStore } from '../store'

type Point = { id: string; title: string; unit?: string; custom: boolean }

export function Routine() {
  const {
    user,
    ops,
    toggleRoutine,
    setRoutineValue,
    addRoutineItem,
    removeRoutineItem,
    signRoutine,
    addTask,
  } = useStore()
  const [entry, setEntry] = useState('')
  const [unit, setUnit] = useState('')
  const [readings, setReadings] = useState<Record<string, string>>({})
  const [ink, setInk] = useState('')
  const [raise, setRaise] = useState<string | null>(null)
  const [colleague, setColleague] = useState('')
  const [flag, setFlag] = useState('')
  const [sent, setSent] = useState<Record<string, { id: string; name: string }>>({})
  if (!user) return null

  const position = routineKey(user)
  const day = romeDay()
  const filed = (ops.routineReports ?? []).find((row) => row.userId === user.id && row.day === day)
  const seeds = routineSeeds(position)
  const custom = (ops.routineItems ?? []).filter((row) => row.position === position)
  const items: Point[] = [
    ...seeds.map((row) => ({ ...row, custom: false })),
    ...custom.map((row) => ({ id: row.id, title: row.title, unit: row.unit, custom: true })),
  ]
  const ticks = (ops.routineTicks ?? []).filter((tick) => tick.day === day)
  const done = items.filter((item) => ticks.find((tick) => tick.itemId === item.id)?.done).length
  const others = crew.filter((person) => person.id !== user.id && person.active !== false)

  const onAdd = (e: FormEvent) => {
    e.preventDefault()
    if (filed || !entry.trim()) return
    addRoutineItem(entry, unit)
    setEntry('')
    setUnit('')
  }

  const onSign = (e: FormEvent) => {
    e.preventDefault()
    if (!ink) return
    signRoutine(ink)
    setInk('')
  }

  const notify = (item: Point) => {
    const who = others.find((person) => person.id === colleague)
    if (!who) return
    const tick = ticks.find((row) => row.itemId === item.id)
    const reading = (readings[item.id] ?? tick?.value ?? '').trim()
    const detail = flag.trim() || 'Flagged from the routine check.'
    const body = reading ? `${detail}\nReading: ${reading}${item.unit ? ` ${item.unit}` : ''}` : detail
    const id = addTask({
      title: item.title,
      body,
      department: who.department,
      assigneeId: who.id,
      urgency: 'soon',
      due: new Date(Date.now() + 4 * 3600_000).toISOString(),
      kind: 'routine',
    })
    setSent((prev) => ({ ...prev, [item.id]: { id, name: who.name.split(' ')[0] } }))
    setRaise(null)
    setFlag('')
  }

  const history = ticks
    .filter((tick) => tick.done && items.some((item) => item.id === tick.itemId))
    .slice()
    .sort((a, b) => b.at.localeCompare(a.at))

  return (
    <div className="rx">
      <div className="rx-grid">
        <div className="rx-col">
      <header className="rx-head">
        <div>
          <h1>Routine check</h1>
          <p>
            {romeDayLong(day)} · {done} of {items.length}
            {filed ? ` · filed ${clock(filed.signedAt)}` : ''}
          </p>
        </div>
      </header>

      <ul className="rx-list">
        {items.map((item) => {
          const tick = ticks.find((row) => row.itemId === item.id)
          const checked = Boolean(tick?.done)
          const reading = readings[item.id] ?? tick?.value ?? ''
          const open = raise === item.id
          const posted = sent[item.id]
          return (
            <li key={item.id} className={checked ? 'is-done' : ''}>
              <button
                type="button"
                className={`rx-tick${checked ? ' on' : ''}`}
                aria-pressed={checked}
                aria-label={checked ? `Mark ${item.title} open` : `Mark ${item.title} done`}
                disabled={Boolean(filed)}
                onClick={() => toggleRoutine(item.id)}
              >
                {checked ? <Check size={15} strokeWidth={2.6} /> : null}
              </button>
              <div className="rx-body">
                <div className="rx-line">
                  <strong>{item.title}</strong>
                  <span className="rx-meta">
                    {item.unit ? (
                      <label className="rx-read">
                        <input
                          inputMode="decimal"
                          value={reading}
                          placeholder="—"
                          aria-label={`${item.title} reading`}
                          disabled={Boolean(filed)}
                          onChange={(e) => setReadings((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        onBlur={() => {
                          if (!filed && reading !== (tick?.value ?? '')) setRoutineValue(item.id, reading)
                        }}
                        />
                        <span>{item.unit}</span>
                      </label>
                    ) : null}
                    {checked && tick?.at ? <time>{clock(tick.at)}</time> : null}
                    {item.custom && !filed ? (
                      <button type="button" className="rx-drop" onClick={() => removeRoutineItem(item.id)} aria-label="Remove point">
                        <Trash2 size={14} strokeWidth={1.7} />
                      </button>
                    ) : null}
                    {filed || posted ? null : (
                      <button
                        type="button"
                        className="rx-flag"
                        aria-expanded={open}
                        onClick={() => {
                          setRaise(open ? null : item.id)
                          setColleague('')
                          setFlag('')
                        }}
                      >
                        Notify
                      </button>
                    )}
                  </span>
                </div>
                {posted ? (
                  <p className="rx-sent">
                    Task sent to {posted.name}. <Link to={`/board/${posted.id}`}>Open task</Link>
                  </p>
                ) : null}
                {open && !filed ? (
                  <form
                    className="rx-raise"
                    onSubmit={(e) => {
                      e.preventDefault()
                      notify(item)
                    }}
                  >
                    <textarea
                      rows={2}
                      value={flag}
                      onChange={(e) => setFlag(e.target.value)}
                      placeholder="What is missing, or what they need to know"
                    />
                    <div>
                      <select
                        value={colleague}
                        aria-label="Colleague"
                        onChange={(e) => setColleague(e.target.value)}
                      >
                        <option value="">Choose a colleague</option>
                        {others.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.name} · {person.title}
                          </option>
                        ))}
                      </select>
                      <button type="submit" disabled={!colleague}>
                        Create task
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>

      {filed ? (
        <p className="rx-locked">This day’s check is signed and locked.</p>
      ) : (
        <>
          <form className="rx-add" onSubmit={onAdd}>
            <input
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="Add a point"
              aria-label="New routine point"
            />
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Unit"
              aria-label="Unit, optional"
            />
            <button type="submit" disabled={!entry.trim()}>
              <Plus size={15} strokeWidth={2} />
              Add
            </button>
          </form>

          <form className="rx-sign" onSubmit={onSign}>
            <h2>Sign and file</h2>
            <p>Filing locks today’s routine check for {romeDayLong(day)}. The report keeps each tick and each reading.</p>
            <SignaturePad onInk={setInk} />
            <button type="submit" disabled={!ink}>
              Sign and file
            </button>
          </form>
        </>
      )}
        </div>
        <aside className="rx-side" aria-label="Routine history">
          <section className="task-log">
            <p className="eyebrow">Log</p>
            {history.length === 0 && !filed ? <p className="task-log-empty">Nothing checked yet.</p> : null}
            {filed ? (
              <article className="task-log-item is-sys">
                <span className="task-log-dot" />
                <div>
                  <p>
                    <b>{filed.userName.split(' ')[0]}</b>
                    <time>{relative(filed.signedAt)}</time>
                  </p>
                  <p className="task-log-sys">Routine task</p>
                  <p>Signed</p>
                </div>
              </article>
            ) : null}
            {history.map((tick) => {
              const item = items.find((row) => row.id === tick.itemId)
              const who = crew.find((person) => person.id === tick.by)
              const reading = tick.value?.trim()
              return (
                <article key={tick.id} className="task-log-item is-sys">
                  <span className="task-log-dot" />
                  <div>
                    <p>
                      <b>{who?.name.split(' ')[0] ?? 'Crew'}</b>
                      <time>{relative(tick.at)}</time>
                    </p>
                    <p className="task-log-sys">Routine task</p>
                    <p>
                      Done
                      {item ? ` · ${item.title}` : ''}
                      {reading ? ` · ${reading}${item?.unit ? ` ${item.unit}` : ''}` : ''}
                    </p>
                  </div>
                </article>
              )
            })}
          </section>
        </aside>
      </div>
    </div>
  )
}
