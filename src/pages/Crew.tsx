import { useEffect, useState } from 'react'
import { NavLink, Outlet, useSearchParams } from 'react-router-dom'
import { SectionTabs } from '../components/SectionTabs'
import { crew, deptLabel } from '../data/crew'
import { certOverdue, certSoon } from '../lib/alerts'
import { dayClock, stationsOf } from '../lib/format'
import {
  currentPresence,
  formatDayLong,
  presenceLabel,
  rosterKindLabel,
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
  const selectedId = people.some((c) => c.id === params.get('who')) ? (params.get('who') as string) : ''
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
      <div className="inv-head">
        <SectionTabs
          value={tab}
          onChange={(id) => {
            const next = new URLSearchParams()
            if (id !== 'list') next.set('tab', id)
            if (selectedId) next.set('who', selectedId)
            setParams(next)
          }}
          tabs={[...memberTabs]}
        />
      </div>

      {tab === 'list' && (
        <>
          <div className="crew-people">
            <SectionTabs
              value={selectedId}
              onChange={selectWho}
              tabs={people.map((c) => ({ id: c.id, label: c.name }))}
            />
          </div>
          <table className="table inv-table crew-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Title</th>
              <th>Station</th>
              <th>Email</th>
              <th>Status</th>
              <th>Access</th>
            </tr>
          </thead>
          <tbody>
            {people.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  No crew on board.
                </td>
              </tr>
            ) : (
              people.map((member) => {
                const presence = currentPresence(member.id, roster)
                const until = presence === 'offboard' ? untilOffboard(member.id, roster) : undefined
                return (
                  <tr key={member.id} className={member.id === selectedId ? 'is-on' : ''}>
                    <td>{member.name}</td>
                    <td>
                      {member.title}
                      {member.watch ? <div className="muted">{member.watch}</div> : null}
                    </td>
                    <td>{stationsOf(member).map((d) => deptLabel[d]).join(' · ')}</td>
                    <td>
                      <a href={`mailto:${member.email}`}>{member.email}</a>
                      {member.phone ? (
                        <div>
                          <a href={`tel:${member.phone.replace(/\s/g, '')}`}>{member.phone}</a>
                        </div>
                      ) : null}
                    </td>
                    <td>
                      {presenceLabel[presence]}
                      {until ? ` · until ${formatDayLong(until)}` : ''}
                    </td>
                    <td>{member.access === 'owner' ? 'Owner / office' : 'Crew'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </>
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
