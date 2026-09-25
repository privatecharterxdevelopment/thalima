import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useSearchParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { SectionTabs } from '../components/SectionTabs'
import { crew, deptLabel } from '../data/crew'
import { certOverdue, certSoon } from '../lib/alerts'
import { dayClock, stationsOf } from '../lib/format'
import {
  currentPresence,
  formatDayLong,
  formatSpan,
  presenceLabel,
  rosterKindLabel,
  upcomingAbsence,
  untilOffboard,
} from '../lib/roster'
import { useStore } from '../store'

const memberTabs = [
  { id: 'list', label: 'Crew list' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'leave', label: 'Leave / rotation' },
  { id: 'handover', label: 'Handover' },
] as const

type MemberTab = (typeof memberTabs)[number]['id']

export function CrewLayout() {
  const { roster } = useStore()
  const pending = roster.filter((e) => e.status === 'pending').length
  return (
    <div className="crew-mod">
      <nav className="ops-views crew-mod-head">
        <NavLink to="/crew" end className={({ isActive }) => (isActive ? 'on' : '')}>
          Members
        </NavLink>
        <NavLink to="/crew/schedule" className={({ isActive }) => (isActive ? 'on' : '')}>
          Schedule
          {pending ? <em>{pending}</em> : null}
        </NavLink>
      </nav>
      <Outlet />
    </div>
  )
}

export function CrewMembers() {
  const { user, ops, addHandover, roster } = useStore()
  const [params, setParams] = useSearchParams()
  const tab = (memberTabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'list') as MemberTab
  const people = crew.filter((c) => c.active !== false)
  const selectedId = people.some((c) => c.id === params.get('who'))
    ? (params.get('who') as string)
    : (people[0]?.id ?? '')
  const person = people.find((c) => c.id === selectedId) ?? people[0]
  const [toId, setToId] = useState('')
  const [body, setBody] = useState('')

  useEffect(() => {
    if (toId && people.some((c) => c.id === toId)) return
    const fallback = people.find((c) => c.id !== user?.id)?.id ?? people[0]?.id ?? ''
    if (fallback) setToId(fallback)
  }, [people, toId, user?.id])

  const certs = ops.certificates.filter((c) => c.kind === 'crew')
  const leave = roster
    .filter((e) => e.status === 'approved' && (e.duty === 'leave' || e.presence === 'offboard'))
    .sort((a, b) => a.from.localeCompare(b.from))

  function selectWho(id: string) {
    const next = new URLSearchParams(params)
    if (tab !== 'list') next.set('tab', tab)
    else next.delete('tab')
    next.set('who', id)
    setParams(next)
  }

  return (
    <div className="crew-mod-body">
      <SectionTabs
        variant="pills"
        value={tab}
        onChange={(id) => {
          const next = new URLSearchParams()
          if (id !== 'list') next.set('tab', id)
          if (selectedId) next.set('who', selectedId)
          setParams(next)
        }}
        tabs={[...memberTabs]}
      />

      {tab === 'list' && person && (
        <div className="crew-tabs-panel">
          <SectionTabs
            value={selectedId}
            onChange={selectWho}
            tabs={people.map((c) => ({ id: c.id, label: c.name }))}
          />
          <article className="crew-profile crew-profile-pane">
            <div className="crew-profile-head">
              <Avatar person={person} size="xl" />
              <div>
                <h2>{person.name}</h2>
                <p className="crew-role">
                  {person.title} · {stationsOf(person).map((d) => deptLabel[d]).join(' · ')}
                </p>
                <p className="crew-email">
                  <a href={`mailto:${person.email}`}>{person.email}</a>
                </p>
              </div>
            </div>
            {(() => {
              const presence = currentPresence(person.id, roster)
              const upcoming = upcomingAbsence(person.id, roster)
              const until = presence === 'offboard' ? untilOffboard(person.id, roster) : undefined
              return (
                <>
                  <p className={`crew-now is-${presence}`}>
                    <span>Current status</span>
                    <strong>{presenceLabel[presence]}</strong>
                    {until ? <em>Until {formatDayLong(until)}</em> : null}
                  </p>
                  {upcoming ? (
                    <p className="crew-next">
                      Upcoming absence
                      <b>
                        {formatSpan(upcoming.from, upcoming.to)} · {rosterKindLabel[upcoming.kind]}
                      </b>
                      <em>{upcoming.status === 'approved' ? 'Approved' : 'Pending'}</em>
                    </p>
                  ) : null}
                </>
              )
            })()}
            <Link className="btn ghost crew-sched-link" to="/crew/schedule">
              View schedule
            </Link>
            <dl className="crew-facts">
              <div>
                <dt>Position</dt>
                <dd>
                  {person.title}
                  <span>{person.watch}</span>
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${person.email}`}>{person.email}</a>
                </dd>
              </div>
              {person.phone ? (
                <div>
                  <dt>Tel</dt>
                  <dd>
                    <a href={`tel:${person.phone.replace(/\s/g, '')}`}>{person.phone}</a>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Access</dt>
                <dd>{person.access === 'owner' ? 'Owner / office' : 'Crew'}</dd>
              </div>
            </dl>
          </article>
        </div>
      )}

      {tab === 'certificates' && (
        <table className="table inv-table">
          <thead>
            <tr>
              <th>Crew</th>
              <th>Paper</th>
              <th>Expires</th>
              <th>Issuer</th>
            </tr>
          </thead>
          <tbody>
            {certs.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No crew certificates yet.
                </td>
              </tr>
            ) : (
              certs.map((c) => {
                const who = crew.find((p) => p.id === c.holderId)
                const hot = certOverdue(c.expiresAt) || certSoon(c.expiresAt)
                return (
                  <tr key={c.id}>
                    <td>{who?.name ?? '—'}</td>
                    <td>
                      {c.title}
                      {c.notes ? <div className="muted">{c.notes}</div> : null}
                    </td>
                    <td className={hot ? 'low' : ''}>{dayClock(c.expiresAt)}</td>
                    <td className="muted">{c.issuer}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      )}

      {tab === 'leave' && (
        <table className="table inv-table">
          <thead>
            <tr>
              <th>Crew</th>
              <th>Kind</th>
              <th>From</th>
              <th>To</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {leave.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  No leave on the board.
                </td>
              </tr>
            ) : (
              leave.map((row) => {
                const who = crew.find((p) => p.id === row.crewId)
                return (
                  <tr key={row.id}>
                    <td>{who?.name}</td>
                    <td>{rosterKindLabel[row.kind]}</td>
                    <td>{formatDayLong(row.from)}</td>
                    <td>{formatDayLong(row.to)}</td>
                    <td className="muted">{row.comment || '—'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      )}

      {tab === 'handover' && (
        <div className="ops-stack">
          {user && (
            <form
              className="log-form"
              onSubmit={(e) => {
                e.preventDefault()
                addHandover({ toId, body })
                setBody('')
              }}
            >
              <p className="inv-copy" style={{ marginTop: 0 }}>
                Off-signing: write the open problems so the next seat is not guessing.
              </p>
              <label className="muted" style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                To
                <select value={toId} onChange={(e) => setToId(e.target.value)}>
                  {people
                    .filter((c) => c.id !== user.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.email}
                      </option>
                    ))}
                </select>
              </label>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Open tasks, defects, keys, standing orders."
              />
              <button className="btn" disabled={!body.trim()}>
                Hand over
              </button>
            </form>
          )}
          <ul className="cloud-list">
            {ops.handovers.length === 0 ? (
              <li className="cloud-row muted">No handovers yet.</li>
            ) : (
              ops.handovers.map((h) => {
                const from = crew.find((c) => c.id === h.fromId)
                const to = crew.find((c) => c.id === h.toId)
                return (
                  <li key={h.id} className="cloud-row">
                    <div>
                      <strong>
                        {from?.name ?? '—'} → {to?.name ?? '—'}
                      </strong>
                      <span>{h.body}</span>
                    </div>
                    <small>{dayClock(h.at)}</small>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
