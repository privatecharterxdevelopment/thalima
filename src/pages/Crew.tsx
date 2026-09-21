import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Avatar } from '../components/Avatar'
import { SectionTabs } from '../components/SectionTabs'
import { crew, deptLabel } from '../data/crew'
import { certOverdue, certSoon } from '../lib/alerts'
import { dayClock } from '../lib/format'
import { useStore } from '../store'

const tabs = [
  { id: 'list', label: 'Crew list' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'leave', label: 'Leave / rotation' },
  { id: 'handover', label: 'Handover' },
] as const

type Tab = (typeof tabs)[number]['id']

export function Crew() {
  const { user, ops, addHandover } = useStore()
  const [params, setParams] = useSearchParams()
  const tab = (tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'list') as Tab
  const [toId, setToId] = useState(crew.find((c) => c.id !== user?.id)?.id ?? crew[0].id)
  const [body, setBody] = useState('')

  const certs = ops.certificates.filter((c) => c.kind === 'crew')

  return (
    <div className="pad inv crew-page">
      <div className="inv-head">
        <div>
          <p className="inv-kicker">Onboard</p>
          <p className="inv-copy">Seats, papers, leave, and what you tell the person who comes after you.</p>
        </div>
        <SectionTabs value={tab} onChange={(id) => setParams({ tab: id })} tabs={[...tabs]} />
      </div>

      {tab === 'list' && (
        <ul className="crew-grid">
          {crew.map((person) => (
            <li key={person.id} className="glass-card crew-profile">
              <Avatar person={person} size="xl" />
              <h2>{person.name}</h2>
              <p className="crew-role">
                {person.title} · {deptLabel[person.department]}
              </p>
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
          ))}
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
            {ops.leave.map((row) => {
              const who = crew.find((p) => p.id === row.crewId)
              return (
                <tr key={row.id}>
                  <td>{who?.name}</td>
                  <td>{row.kind}</td>
                  <td>{dayClock(row.from)}</td>
                  <td>{dayClock(row.to)}</td>
                  <td className="muted">{row.note}</td>
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
