import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { crew, deptLabel } from '../data/crew'
import { romeDay } from '../lib/opsTasks'
import {
  absenceReasonLabel,
  absenceReasons,
  addDays,
  canApproveRoster,
  canManageRoster,
  covering,
  currentPresence,
  eachDay,
  entriesForCrew,
  formatDay,
  formatSpan,
  rosterKindLabel,
  rosterKinds,
  rosterSummary,
  weekdayShort,
} from '../lib/roster'
import { useStore } from '../store'
import type { AbsenceReason, Department, RosterEntry, RosterKind } from '../types'

type Span = 7 | 14 | 28
type Filter = 'all' | 'onboard' | 'offboard' | 'pending' | Department

const depts: Department[] = ['bridge', 'engineering', 'interior', 'galley', 'deck']

export function CrewSchedule() {
  const { user, roster, addRosterRequest, decideRoster, cancelRoster } = useStore()
  const [params, setParams] = useSearchParams()
  const today = romeDay()
  const [span, setSpan] = useState<Span>(14)
  const [start, setStart] = useState(today)
  const [filter, setFilter] = useState<Filter>('all')
  const [draft, setDraft] = useState<{
    crewId: string
    from: string
    to: string
    kind: RosterKind
    reason: AbsenceReason
    comment: string
  } | null>(null)
  const [picking, setPicking] = useState<{ crewId: string; from: string } | null>(null)
  const focus = params.get('request')

  const end = addDays(start, span - 1)
  const days = eachDay(start, end)
  const admin = user ? canManageRoster(user) : false

  const summary = useMemo(() => rosterSummary(roster, today), [roster, today])

  const rows = crew.filter((person) => {
    if (!admin && filter === 'all') return true
    if (filter === 'onboard') return currentPresence(person.id, roster, today) === 'onboard'
    if (filter === 'offboard') return currentPresence(person.id, roster, today) === 'offboard'
    if (filter === 'pending') return roster.some((e) => e.crewId === person.id && e.status === 'pending')
    if (depts.includes(filter as Department)) return person.department === filter
    return true
  })

  const focused = focus ? roster.find((e) => e.id === focus) : null
  const queue = roster.filter((e) => user && canApproveRoster(user, e))

  if (!user) return null

  function openDraft(crewId: string, from: string, to: string) {
    const a = from <= to ? from : to
    const b = from <= to ? to : from
    setDraft({ crewId, from: a, to: b, kind: 'offboard', reason: 'personal', comment: '' })
    setPicking(null)
  }

  function onDayClick(crewId: string, day: string) {
    const canAsk = crewId === user!.id || admin
    if (!canAsk) return
    if (picking && picking.crewId === crewId) {
      openDraft(crewId, picking.from, day)
      return
    }
    setPicking({ crewId, from: day })
  }

  return (
    <div className="roster">
      <div className="roster-nav">
        <button type="button" className="ghost-icon" onClick={() => setStart(addDays(start, -span))} aria-label="Previous">
          ‹
        </button>
        <strong>{formatSpan(start, end)}</strong>
        <button type="button" className="ghost-icon" onClick={() => setStart(addDays(start, span))} aria-label="Next">
          ›
        </button>
        <div className="filters">
          {([7, 14, 28] as Span[]).map((n) => (
            <button key={n} type="button" className={span === n ? 'on' : ''} onClick={() => setSpan(n)}>
              {n === 7 ? 'Week' : n === 14 ? '2 Weeks' : 'Month'}
            </button>
          ))}
        </div>
        <button className="btn" type="button" onClick={() => openDraft(user.id, today, today)}>
          Request time
        </button>
      </div>

      {admin ? (
        <section className="roster-kpis">
          <article>
            <span>On board</span>
            <b>{summary.onboard}</b>
          </article>
          <article>
            <span>Off board</span>
            <b>{summary.offboard}</b>
          </article>
          <article>
            <span>On leave</span>
            <b>{summary.onLeave}</b>
          </article>
          <article>
            <span>Pending</span>
            <b>{summary.pending}</b>
          </article>
        </section>
      ) : null}

      {admin ? (
        <div className="filters roster-filters">
          <button type="button" className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>
            All crew
          </button>
          {depts.map((d) => (
            <button key={d} type="button" className={filter === d ? 'on' : ''} onClick={() => setFilter(d)}>
              {deptLabel[d]}
            </button>
          ))}
          <button type="button" className={filter === 'onboard' ? 'on' : ''} onClick={() => setFilter('onboard')}>
            On board
          </button>
          <button type="button" className={filter === 'offboard' ? 'on' : ''} onClick={() => setFilter('offboard')}>
            Off board
          </button>
          <button type="button" className={filter === 'pending' ? 'on' : ''} onClick={() => setFilter('pending')}>
            Pending requests
          </button>
        </div>
      ) : (
        <p className="roster-hint">Click a day on your row, then a second day, to request time away. Pending blocks wait on the captain.</p>
      )}

      <div className={`roster-board ${admin ? 'is-admin' : ''}`}>
        <div className="roster-head" style={{ gridTemplateColumns: `220px repeat(${days.length}, minmax(36px, 1fr))` }}>
          <span>Crew</span>
          {days.map((day) => (
            <span key={day} className={day === today ? 'is-today' : ''}>
              <small>{weekdayShort(day)}</small>
              {formatDay(day)}
            </span>
          ))}
        </div>
        {rows.map((person) => {
          const mine = person.id === user.id
          const blocks = entriesForCrew(roster, person.id).filter((e) => e.from <= end && e.to >= start)
          return (
            <div
              key={person.id}
              className={`roster-row ${mine ? 'is-self' : ''} ${admin || mine ? '' : 'is-locked'}`}
              style={{ gridTemplateColumns: `220px repeat(${days.length}, minmax(36px, 1fr))` }}
            >
              <div className="roster-who">
                <Avatar person={person} size="sm" />
                <div>
                  <strong>{person.name}</strong>
                  <small>{person.title}</small>
                </div>
              </div>
              {days.map((day, i) => {
                const on = covering(roster, person.id, day)
                const pending = on.some((e) => e.status === 'pending')
                const approved = on.find((e) => e.status === 'approved')
                return (
                  <button
                    key={day}
                    type="button"
                    style={{ gridColumn: i + 2 }}
                    className={`roster-cell ${day === today ? 'is-today' : ''} ${pending ? 'is-pending' : ''} ${approved ? `is-${approved.duty}` : 'is-working'} ${picking?.crewId === person.id && picking.from === day ? 'is-pick' : ''}`}
                    onClick={() => onDayClick(person.id, day)}
                    aria-label={`${person.name} ${day}`}
                  />
                )
              })}
              {blocks.map((block) => {
                const from = block.from < start ? start : block.from
                const to = block.to > end ? end : block.to
                const i0 = days.indexOf(from)
                const i1 = days.indexOf(to)
                if (i0 < 0 || i1 < 0) return null
                return (
                  <button
                    key={block.id}
                    type="button"
                    className={`roster-bar is-${block.duty} ${block.status === 'pending' ? 'is-pending' : ''} ${block.presence === 'offboard' ? 'is-away' : ''}`}
                    style={{ gridColumn: `${i0 + 2} / ${i1 + 3}` }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setParams({ request: block.id })
                    }}
                  >
                    <span>
                      {block.presence === 'offboard' ? 'Off board' : rosterKindLabel[block.kind]}
                      {block.status === 'pending' ? ' · Pending' : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>

      {admin && queue.length ? (
        <section className="roster-queue">
          <h2>Pending requests</h2>
          <ul>
            {queue.map((row) => {
              const who = crew.find((c) => c.id === row.crewId)
              return (
                <li key={row.id}>
                  <Avatar person={who ?? crew[0]} size="sm" />
                  <div>
                    <strong>{who?.name}</strong>
                    <p>
                      {rosterKindLabel[row.kind]} · {formatSpan(row.from, row.to)}
                    </p>
                    <small>{row.comment || absenceReasonLabel[row.reason]}</small>
                  </div>
                  <div className="roster-queue-actions">
                    <button className="btn ghost" type="button" onClick={() => decideRoster(row.id, 'rejected')}>
                      Reject
                    </button>
                    <button className="btn" type="button" onClick={() => decideRoster(row.id, 'approved')}>
                      Approve
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {draft ? (
        <div className="roster-back" onClick={() => setDraft(null)}>
          <form
            className="roster-panel"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault()
              addRosterRequest(draft)
              setDraft(null)
            }}
          >
            <h2>Request time</h2>
            <p className="roster-panel-who">{crew.find((c) => c.id === draft.crewId)?.name}</p>
            <div className="roster-panel-grid">
              <label>
                From
                <input type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
              </label>
              <label>
                To
                <input type="date" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
              </label>
            </div>
            <label>
              Status
              <select
                value={draft.kind}
                onChange={(e) => setDraft({ ...draft, kind: e.target.value as RosterKind })}
              >
                {rosterKinds.map((k) => (
                  <option key={k} value={k}>
                    {rosterKindLabel[k]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Reason
              <select
                value={draft.reason}
                onChange={(e) => setDraft({ ...draft, reason: e.target.value as AbsenceReason })}
              >
                {absenceReasons.map((k) => (
                  <option key={k} value={k}>
                    {absenceReasonLabel[k]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Comment
              <textarea
                rows={3}
                value={draft.comment}
                onChange={(e) => setDraft({ ...draft, comment: e.target.value })}
                placeholder="Optional"
              />
            </label>
            <p className="roster-hint">
              {draft.crewId === user.id && !admin
                ? 'Submits as pending. The captain must approve before the roster changes.'
                : admin && draft.crewId !== user.id
                  ? 'Saved as an approved admin change.'
                  : 'You cannot approve your own request.'}
            </p>
            <div className="roster-panel-actions">
              <button className="btn ghost" type="button" onClick={() => setDraft(null)}>
                Cancel
              </button>
              <button className="btn" type="submit">
                Submit request
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {focused ? (
        <RequestPanel
          row={focused}
          canDecide={canApproveRoster(user, focused)}
          canCancel={focused.status === 'pending' && (focused.requestedBy === user.id || focused.crewId === user.id)}
          onClose={() => setParams({})}
          onReject={() => {
            decideRoster(focused.id, 'rejected')
            setParams({})
          }}
          onApprove={() => {
            decideRoster(focused.id, 'approved')
            setParams({})
          }}
          onCancel={() => {
            cancelRoster(focused.id)
            setParams({})
          }}
        />
      ) : null}
    </div>
  )
}

function stamp(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { timeZone: 'Europe/Rome' })
}

function RequestPanel({
  row,
  canDecide,
  canCancel,
  onClose,
  onReject,
  onApprove,
  onCancel,
}: {
  row: RosterEntry
  canDecide: boolean
  canCancel: boolean
  onClose: () => void
  onReject: () => void
  onApprove: () => void
  onCancel: () => void
}) {
  const who = crew.find((c) => c.id === row.crewId)
  const ask = crew.find((c) => c.id === row.requestedBy)
  const decider = row.decidedBy ? crew.find((c) => c.id === row.decidedBy) : null
  return (
    <div className="roster-back" onClick={onClose}>
      <div className="roster-panel" onClick={(e) => e.stopPropagation()}>
        <h2>{row.status === 'pending' ? 'Absence request' : 'Roster record'}</h2>
        <p className="roster-panel-who">{who?.name}</p>
        {row.status === 'pending' ? (
          <p className="roster-hint">Pending approval. Not yet treated as leave.</p>
        ) : null}
        <dl className="roster-meta">
          <div>
            <dt>Status</dt>
            <dd>{rosterKindLabel[row.kind]}</dd>
          </div>
          <div>
            <dt>Dates</dt>
            <dd>{formatSpan(row.from, row.to)}</dd>
          </div>
          <div>
            <dt>Reason</dt>
            <dd>{row.comment || absenceReasonLabel[row.reason]}</dd>
          </div>
          <div>
            <dt>Requested by</dt>
            <dd>
              {ask?.name} · {stamp(row.requestedAt)}
            </dd>
          </div>
          {decider && row.decidedAt ? (
            <div>
              <dt>{row.status === 'rejected' ? 'Rejected by' : 'Approved by'}</dt>
              <dd>
                {decider.name} · {stamp(row.decidedAt)}
              </dd>
            </div>
          ) : null}
        </dl>
        <ol className="roster-log">
          {row.notes.map((n) => {
            const actor = crew.find((c) => c.id === n.authorId)
            return (
              <li key={n.id}>
                {n.text}
                {actor ? ` · ${actor.name.split(' ')[0]}` : ''}
                <time>{stamp(n.at)}</time>
              </li>
            )
          })}
        </ol>
        <div className="roster-panel-actions">
          {canCancel ? (
            <button className="btn ghost" type="button" onClick={onCancel}>
              Cancel request
            </button>
          ) : null}
          {canDecide ? (
            <>
              <button className="btn ghost" type="button" onClick={onReject}>
                Reject
              </button>
              <button className="btn" type="button" onClick={onApprove}>
                Approve
              </button>
            </>
          ) : (
            <button className="btn ghost" type="button" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
