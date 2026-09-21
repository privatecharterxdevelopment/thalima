import { yacht } from '../data/yacht'
import { useStore } from '../store'

export function Engineering() {
  const { systems, user } = useStore()
  if (!user) return null

  return (
    <div className="pad">
      <div className="stats">
        <div className="stat">
          <span>Main engine</span>
          <b>{systems.engineHours} h</b>
        </div>
        <div className="stat">
          <span>Genset</span>
          <b>
            {systems.gensetHours} h · {systems.genset}
          </b>
        </div>
        <div className="stat">
          <span>Watermaker</span>
          <b>{systems.watermaker}</b>
        </div>
      </div>

      <div className="tanks">
        <section className="panel">
          <div className="systems">
            <Bar label={`Fuel · ${yacht.fuelL.toLocaleString()} L`} pct={systems.fuelPct} />
            <Bar label={`Fresh water · ${yacht.waterL.toLocaleString()} L`} pct={systems.waterPct} />
            <Bar label="Grey" pct={systems.greyPct} />
            <Bar label="Black" pct={systems.blackPct} warn={systems.blackPct > 60} />
          </div>
        </section>
        <section className="panel">
          <p style={{ color: 'var(--muted)', lineHeight: 1.65, maxWidth: '48ch' }}>
            House bank {systems.batteryV.toFixed(1)} V. Hydraulics:{' '}
            {systems.hydraulics === 'watch' ? 'boom-vang manifold weep, level marked 08:00, no drop yet' : 'clear'}.
            Impeller spare not onboard — no passage under power until two are in the workshop.
          </p>
          <ul className="facts">
            <li>
              <span>Engine</span>
              {yacht.engine}
            </li>
            <li>
              <span>Range</span>
              {yacht.rangeNm.toLocaleString()} nm
            </li>
            <li>
              <span>Draft</span>
              {yacht.draftM} m — stay off the inner Marinella shelf
            </li>
          </ul>
        </section>
      </div>
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
