import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useSearchParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { SectionTabs } from '../components/SectionTabs'
import { crew, deptLabel } from '../data/crew'
import { certOverdue, certSoon } from '../lib/alerts'
import { dmChannelId } from '../lib/chat'
import { dayClock, stationsOf } from '../lib/format'
import {
  formatDayLong,
  rosterKindLabel,
} from '../lib/roster'
import { useStore } from '../store'

const memberTabs = [
  { id: 'list', label: 'Crew list' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'leave', label: 'Leave / rotation' },
  { id: 'handover', label: 'Handover' },
] as const

type MemberTab = (typeof memberTabs)[number]['id']

function formatJoined(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Rome',
  })
}

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

  return (
    <div className="crew-mod-body">
      <SectionTabs
        variant="pills"
        value={tab}
        onChange={(id) => {
          const next = new URLSearchParams()
          if (id !== 'list') next.set('tab', id)
          setParams(next)
        }}
        tabs={[...memberTabs]}
      />

      {tab === 'list' && (
        <table className="table inv-table crew-list-table">
          <thead>
            <tr>
              <th>Crew</th>
              <th>Position</th>
              <th>Joined</th>
              <th>Contact</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted">
                  No crew on board.
                </td>
              </tr>
            ) : (
              people.map((person) => {
                const stations = stationsOf(person).map((d) => deptLabel[d]).join(' · ')
                const chatTo =
                  user && person.id !== user.id ? `/messages/${dmChannelId(user.id, person.id)}` : null
                return (
                  <tr key={person.id}>
                    <td>
                      <div className="crew-list-who">
                        <Avatar person={person} size="md" />
                        <div>
                          <strong>{person.name}</strong>
                          {stations ? <div className="muted">{stations}</div> : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      {person.title}
                      {person.watch ? <div className="muted">{person.watch}</div> : null}
                    </td>
                    <td>{formatJoined(person.joinedAt)}</td>
                    <td>
                      <div className="crew-list-contact">
                        <a href={`mailto:${person.email}`}>{person.email}</a>
                        {person.phone ? (
                          <a href={`tel:${person.phone.replace(/\s/g, '')}`}>{person.phone}</a>
                        ) : null}
                      </div>
                    </td>
                    <td className="crew-list-chat">
                      {chatTo ? (
                        <Link className="btn ghost" to={chatTo}>
                          Chat
                        </Link>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
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
