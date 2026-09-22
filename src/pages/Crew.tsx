import { useState } from 'react'
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
  const [toId, setToId] = useState(crew.find((c) => c.id !== user?.id)?.id ?? crew[0].id)
  const [body, setBody] = useState('')

  const certs = ops.certificates.filter((c) => c.kind === 'crew')
  const leave = roster
    .filter((e) => e.status === 'approved' && (e.duty === 'leave' || e.presence === 'offboard'))
    .sort((a, b) => a.from.localeCompare(b.from))

  return (
    <div className="crew-mod-body">
      <SectionTabs
        variant="pills"
        value={tab}
        onChange={(id) => setParams(id === 'list' ? {} : { tab: id })}
        tabs={[...memberTabs]}
      />

      {tab === 'list' && (
        <ul className="crew-grid">
          {crew.map((person) => {
            const presence = currentPresence(person.id, roster)
            const upcoming = upcomingAbsence(person.id, roster)
            const until = presence === 'offboard' ? untilOffboard(person.id, roster) : undefined
            return (
              <li key={person.id} className="glass-card crew-profile">
                <Avatar person={person} size="xl" />
                <h2>{person.name}</h2>
                <p className="crew-role">
                  {person.title} · {stationsOf(person).map((d) => deptLabel[d]).join(' · ')}
                </p>
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
                  <div>
                    <dt>Tel</dt>
                    <dd>
                      <a href={`tel:${person.phone.replace(/\s/g, '')}`}>{person.phone}</a>
                    </dd>
                  </div>
                </dl>
              </li>
            )
          })}
        </ul>
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
            {certs.map((c) => {
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
            })}
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
            {leave.map((row) => {
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
            })}
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
                  {crew
                    .filter((c) => c.id !== user.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
              <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Open tasks, defects, keys, standing orders." />
              <button className="btn" disabled={!body.trim()}>
                Hand over
              </button>
            </form>
          )}
          <ul className="cloud-list">
            {ops.handovers.map((h) => {
              const from = crew.find((c) => c.id === h.fromId)
              const to = crew.find((c) => c.id === h.toId)
              return (
                <li key={h.id} className="cloud-row">
                  <div>
                    <strong>
                      {from?.name.split(' ')[0]} → {to?.name.split(' ')[0]}
                    </strong>
                    <span>{h.body}</span>
                  </div>
                  <small>{dayClock(h.at)}</small>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
