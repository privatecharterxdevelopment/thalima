import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { crew } from '../data/crew'
import { dayClock } from '../lib/format'
import { useStore } from '../store'
import { WhoLine } from '../components/WhoLine'
import { SectionTabs } from '../components/SectionTabs'
import type { DrillKind } from '../types'

const tabs = [
  { id: 'log', label: 'Log' },
  { id: 'drills', label: 'Drills / safety' },
] as const

const drillKinds: { id: DrillKind; label: string }[] = [
  { id: 'fire', label: 'Fire' },
  { id: 'mob', label: 'MOB' },
  { id: 'abandon', label: 'Abandon ship' },
  { id: 'first_aid', label: 'First aid' },
  { id: 'safety_check', label: 'Safety check' },
]

export function Logbook() {
  const { log, addLog, user, ops, addDrill } = useStore()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'drills' ? 'drills' : 'log'
  const [text, setText] = useState('')
  const [kind, setKind] = useState<DrillKind>('fire')
  const [note, setNote] = useState('')
  if (!user) return null
  const canWrite = user.level === 1 || user.department === 'deck' || user.department === 'engineering'

  return (
    <div className="pad">
      <div className="inv-head">
        <SectionTabs
          value={tab}
          onChange={(id) => setParams(id === 'log' ? {} : { tab: id })}
          tabs={[...tabs]}
        />
      </div>

      {tab === 'log' && (
        <>
          {canWrite && (
            <form
              className="log-form"
              onSubmit={(e) => {
                e.preventDefault()
                addLog(text)
                setText('')
              }}
            >
              <textarea
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Time, place, wind, what we did."
              />
              <button className="btn" disabled={!text.trim()}>
                Enter
              </button>
            </form>
          )}
          <div className="log-list">
            {log.map((e) => {
              const who = crew.find((c) => c.id === e.authorId)
              return (
                <article key={e.id}>
                  <small>{dayClock(e.at)}</small>
                  <p style={{ marginTop: 8, lineHeight: 1.65, maxWidth: '62ch' }}>{e.text}</p>
                  {who ? <WhoLine people={[who]} /> : null}
                </article>
              )
            })}
          </div>
        </>
      )}

      {tab === 'drills' && (
        <div className="ops-stack">
          {canWrite && (
            <form
              className="log-form"
              onSubmit={(e) => {
                e.preventDefault()
                addDrill({ kind, note })
                setNote('')
              }}
            >
              <label className="muted" style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
                Drill
                <select value={kind} onChange={(e) => setKind(e.target.value as DrillKind)}>
                  {drillKinds.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </label>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Who, how long, what we learned." />
              <button className="btn">Log drill</button>
            </form>
          )}
          <table className="table inv-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Drill</th>
                <th>By</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {ops.drills.map((d) => (
                <tr key={d.id}>
                  <td>{dayClock(d.at)}</td>
                  <td>{drillKinds.find((k) => k.id === d.kind)?.label ?? d.kind}</td>
                  <td>{crew.find((c) => c.id === d.by)?.name}</td>
                  <td className="muted">{d.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
