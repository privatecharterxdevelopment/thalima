import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SectionTabs } from '../components/SectionTabs'
import { hoursToService, liveHours } from '../lib/alerts'
import { dayClock } from '../lib/format'
import { crew, deptLabel } from '../data/crew'
import { useStore } from '../store'

const tabs = [
  { id: 'equipment', label: 'Equipment' },
  { id: 'schedule', label: 'Service schedule' },
  { id: 'hours', label: 'Hours / tanks' },
  { id: 'defects', label: 'Defects' },
  { id: 'spares', label: 'Spare parts' },
] as const

type Tab = (typeof tabs)[number]['id']

function dueLabel(left: number | null) {
  if (left === null) return 'Calendar'
  if (left <= 0) return `${Math.abs(Math.round(left))} h overdue`
  return `Due in ${Math.round(left)} h`
}

export function Maintenance() {
  const { user, ops, systems } = useStore()
  const [params, setParams] = useSearchParams()
  const tab = (tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'equipment') as Tab
  if (!user) return null

  const schedule = useMemo(
    () =>
      [...ops.equipment]
        .map((eq) => ({ eq, hours: liveHours(eq, systems), left: hoursToService(eq, systems) }))
        .filter((row) => row.left !== null)
        .sort((a, b) => (a.left ?? 0) - (b.left ?? 0)),
    [ops.equipment, systems],
  )

  return (
    <div className="pad inv">
      <div className="inv-head">
        <div>
          <p className="inv-kicker">Plant</p>
          <p className="inv-copy">Hours, service, defects, and the spares that keep her running.</p>
        </div>
        <SectionTabs value={tab} onChange={(id) => setParams({ tab: id })} tabs={[...tabs]} />
      </div>

      {tab === 'equipment' && (
        <table className="table inv-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Hours</th>
              <th>Last service</th>
              <th>Next</th>
              <th>Where</th>
            </tr>
          </thead>
          <tbody>
            {ops.equipment.map((eq) => {
              const hours = liveHours(eq, systems)
              const left = hoursToService(eq, systems)
              return (
                <tr key={eq.id}>
                  <td>
                    {eq.name}
                    <div className="muted">{eq.notes}</div>
                  </td>
                  <td>{hours ? `${hours.toLocaleString()} h` : '—'}</td>
                  <td>
                    {dayClock(eq.lastServiceAt)}
                    {eq.lastServiceH ? ` · ${eq.lastServiceH} h` : ''}
                  </td>
                  <td className={left !== null && left <= 50 ? 'low' : ''}>{dueLabel(left)}</td>
                  <td className="muted">
                    {eq.location} · {deptLabel[eq.department]}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {tab === 'schedule' && (
        <table className="table inv-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Interval</th>
              <th>Hours now</th>
              <th>Service at</th>
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map(({ eq, hours, left }) => (
              <tr key={eq.id}>
                <td>{eq.name}</td>
                <td>{eq.intervalH} h</td>
                <td>{hours.toLocaleString()} h</td>
                <td>{eq.nextServiceH.toLocaleString()} h</td>
                <td className={left !== null && left <= 50 ? 'low' : ''}>{dueLabel(left)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'hours' && (
        <div className="tanks">
          <section className="panel">
            <div className="stats" style={{ marginBottom: 22 }}>
              <div className="stat">
                <span>Main engine</span>
                <b>{systems.engineHours.toLocaleString()} h</b>
              </div>
              <div className="stat">
                <span>Generator</span>
                <b>
                  {systems.gensetHours.toLocaleString()} h · {systems.genset}
                </b>
              </div>
              <div className="stat">
                <span>Watermaker</span>
                <b>{systems.watermaker}</b>
              </div>
            </div>
            <div className="systems">
              <Bar label={`Diesel · ${systems.fuelPct}%`} pct={systems.fuelPct} />
              <Bar label={`Fresh water · ${systems.waterPct}%`} pct={systems.waterPct} />
              <Bar label={`Grey · ${systems.greyPct}%`} pct={systems.greyPct} />
              <Bar label={`Black · ${systems.blackPct}%`} pct={systems.blackPct} warn={systems.blackPct > 60} />
            </div>
          </section>
          <section className="panel">
            <p className="inv-copy" style={{ marginTop: 0 }}>
              House bank {systems.batteryV.toFixed(1)} V. Hydraulics {systems.hydraulics === 'watch' ? 'on watch' : 'clear'}.
              Generator service {dueLabel(hoursToService(ops.equipment.find((e) => e.id === 'genset') ?? ops.equipment[0], systems))}.
            </p>
            <ul className="facts">
              {ops.services.slice(0, 4).map((sv) => {
                const eq = ops.equipment.find((e) => e.id === sv.assetId)
                const who = crew.find((c) => c.id === sv.by)
                return (
                  <li key={sv.id}>
                    <span>{eq?.name ?? sv.assetId}</span>
                    {dayClock(sv.at)} · {who?.name.split(' ')[0]} · {sv.text}
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      )}

      {tab === 'defects' && (
        <table className="table inv-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Defect</th>
              <th>Asset</th>
              <th>Opened</th>
            </tr>
          </thead>
          <tbody>
            {ops.defects.map((d) => (
              <tr key={d.id}>
                <td className={d.status !== 'closed' ? 'low' : ''}>{d.status}</td>
                <td>
                  {d.title}
                  <div className="muted">{d.body}</div>
                </td>
                <td>{ops.equipment.find((e) => e.id === d.assetId)?.name ?? '—'}</td>
                <td className="muted">
                  {dayClock(d.at)} · {crew.find((c) => c.id === d.by)?.name.split(' ')[0]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'spares' && (
        <table className="table inv-table">
          <thead>
            <tr>
              <th>Part</th>
              <th>Stock</th>
              <th>Min</th>
              <th>For</th>
              <th>Where</th>
            </tr>
          </thead>
          <tbody>
            {ops.spares.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td className={s.stock < s.min ? 'low' : ''}>
                  {s.stock} {s.unit}
                </td>
                <td>
                  {s.min} {s.unit}
                </td>
                <td>{ops.equipment.find((e) => e.id === s.assetId)?.name ?? '—'}</td>
                <td className="muted">{s.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function Bar({ label, pct, warn }: { label: string; pct: number; warn?: boolean }) {
  return (
    <div className={`meter ${warn ? 'alert' : ''}`}>
      <span>
        {label}
        <b>{pct}%</b>
      </span>
      <i>
        <em style={{ width: `${pct}%` }} />
      </i>
    </div>
  )
}
