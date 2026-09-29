import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { crew } from '../data/crew'
import { clock } from '../lib/format'
import { romeDayLong } from '../lib/opsTasks'
import { useStore } from '../store'

export function Reports() {
  const { user, ops } = useStore()
  const mine = (ops.routineReports ?? [])
    .filter((row) => row.userId === user?.id)
    .sort((a, b) => b.signedAt.localeCompare(a.signedAt))
  const [openId, setOpenId] = useState(mine[0]?.id ?? '')
  if (!user) return null
  const open = mine.find((row) => row.id === openId) ?? mine[0]

  return (
    <div className="routine reports">
      <p className="routine-kicker">My reports</p>
      <h1>Signed routines</h1>
      <p className="routine-lead">
        Each report is the checklist as it stood when you signed it, with the clock time of every completed line.
      </p>

      {mine.length === 0 ? (
        <p className="routine-quiet">
          Nothing filed yet. <Link to="/routine">Open today’s routine</Link> and sign it to keep a report.
        </p>
      ) : (
        <div className="report-layout">
          <ul className="report-index">
            {mine.map((row) => {
              const done = row.lines.filter((line) => line.done).length
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    className={open?.id === row.id ? 'on' : ''}
                    onClick={() => setOpenId(row.id)}
                  >
                    <strong>{romeDayLong(row.day)}</strong>
                    <span>
                      {row.positionLabel} · {done} of {row.lines.length} · signed {clock(row.signedAt)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          {open ? (
            <article className="report-sheet">
              <header>
                <p className="routine-kicker">{open.positionLabel}</p>
                <h2>{romeDayLong(open.day)}</h2>
                <p>
                  Signed by {open.userName} at {clock(open.signedAt)}, Europe/Rome.
                </p>
              </header>
              <ul className="report-lines">
                {open.lines.map((line) => (
                  <li key={line.itemId} className={line.done ? 'is-done' : ''}>
                    <span className={`routine-check${line.done ? ' on' : ''}`} aria-hidden="true">
                      {line.done ? <Check size={14} strokeWidth={2.4} /> : null}
                    </span>
                    <div>
                      <strong>{line.title}</strong>
                      <em>{line.done && line.doneAt ? `Done ${clock(line.doneAt)}` : 'Not done'}</em>
                      {line.note ? <span>{line.note}</span> : null}
                    </div>
                  </li>
                ))}
              </ul>
              {open.notes.length > 0 ? (
                <section className="routine-notes">
                  <h2>Notes</h2>
                  <ul>
                    {open.notes.map((row, index) => (
                      <li key={`${row.at}-${index}`}>
                        <b>
                          {crew.find((c) => c.id === row.by)?.name.split(' ')[0] ?? 'Crew'} · {clock(row.at)}
                        </b>
                        <span>{row.text}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              <figure className="report-sign">
                <figcaption>Signature</figcaption>
                <img src={open.signature} alt={`Signature of ${open.userName}`} />
              </figure>
            </article>
          ) : null}
        </div>
      )}
    </div>
  )
}
