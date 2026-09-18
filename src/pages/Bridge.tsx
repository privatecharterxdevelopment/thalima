import { Link } from 'react-router-dom'
import { cabins } from '../data/crew'
import { yacht } from '../data/yacht'
import { canSeeTask, sortTasks } from '../lib/format'
import { useStore } from '../store'
import { TaskCard } from '../components/TaskCard'
import { MapCanvas } from '../components/MapCanvas'
import { WindRose } from '../components/WindRose'
import { Avatar } from '../components/Avatar'
import { crew } from '../data/crew'
import { beaufort, cardinal, clock } from '../lib/format'

export function Bridge() {
  const { user, tasks, messages, systems, weather } = useStore()
  if (!user) return null

  const live = tasks.filter((t) => canSeeTask(user, t) && t.status !== 'done' && t.status !== 'backlog').sort(sortTasks)
  const latest = [...messages].filter((m) => m.channelId === 'all').reverse().slice(0, 4)
  const guests = cabins.reduce((n, c) => n + c.guests.length, 0)
  const b = weather ? beaufort(weather.windKn) : null

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Mother board</p>
          <h1>On watch</h1>
          <p>
            Charter day 5 of 7. Six guests in three cabins. We stay in Marinella unless engineering clears
            a hop.
          </p>
        </div>
        <Link className="btn" to="/board">
          Open the board
        </Link>
      </div>

      <div className="stats">
        <div className="stat">
          <span>Open jobs you can see</span>
          <b>{live.length}</b>
        </div>
        <div className="stat">
          <span>Guests / crew</span>
          <b>
            {guests} / {yacht.crew}
          </b>
        </div>
        <div className="stat">
          <span>Fuel · water</span>
          <b>
            {systems.fuelPct}% · {systems.waterPct}%
          </b>
        </div>
      </div>

      <div className="board-grid">
        <section className="panel">
          <h2>Live work · text, time, urgency</h2>
          <div className="mother">
            {live.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </section>

        <div className="side-stack">
          <section className="panel">
            <h2>Wind & sea</h2>
            <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
              <WindRose weather={weather} />
              <div>
                {weather ? (
                  <>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '1.05rem' }}>
                      {weather.windKn.toFixed(1)} kn {cardinal(weather.windDir)}
                      <br />
                      gust {weather.gustKn.toFixed(0)} kn
                    </p>
                    <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: '0.92rem' }}>
                      {b ? `Beaufort ${b.f} · ${b.name}` : ''}
                      <br />
                      {weather.tempC.toFixed(0)}°C air
                      {weather.sst != null ? ` · ${weather.sst.toFixed(1)}°C sea` : ''}
                      <br />
                      {weather.waveM != null
                        ? `waves ${weather.waveM.toFixed(1)} m / ${weather.wavePeriod?.toFixed(0)} s`
                        : 'sea state from GFS'}
                      <br />
                      {weather.pressure.toFixed(0)} hPa · cloud {weather.cloud}%
                    </p>
                  </>
                ) : (
                  <p style={{ color: 'var(--muted)' }}>Fetching Open-Meteo…</p>
                )}
              </div>
            </div>
          </section>

          <section className="panel">
            <h2>Hotel load</h2>
            <div className="systems">
              <Meter label="Fuel" pct={systems.fuelPct} note={`${Math.round((systems.fuelPct / 100) * yacht.fuelL)} L`} />
              <Meter label="Fresh water" pct={systems.waterPct} note={`${Math.round((systems.waterPct / 100) * yacht.waterL)} L`} />
              <Meter label="Grey" pct={systems.greyPct} />
              <Meter label="Black" pct={systems.blackPct} alert={systems.blackPct > 70} />
              <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
                House bank {systems.batteryV.toFixed(1)} V · Cummins {systems.engineHours} h · hydraulics{' '}
                {systems.hydraulics === 'watch' ? 'on watch' : 'ok'}
              </p>
            </div>
          </section>

          <section className="panel">
            <h2>Where she lies</h2>
            <MapCanvas heightClass="map-mini" />
          </section>

          <section className="panel">
            <h2>Last from the crew</h2>
            <div className="msg-snip">
              {latest.map((m) => {
                const who = crew.find((c) => c.id === m.authorId)
                if (!who) return null
                return (
                  <article key={m.id}>
                    <Avatar person={who} size="sm" />
                    <div>
                      <small>
                        {who.name} · {clock(m.at)}
                      </small>
                      <p>{m.text}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

function Meter({
  label,
  pct,
  note,
  alert,
}: {
  label: string
  pct: number
  note?: string
  alert?: boolean
}) {
  return (
    <div className={`meter ${alert ? 'alert' : ''}`}>
      <span>
        {label}
        <b>
          {pct}%{note ? ` · ${note}` : ''}
        </b>
      </span>
      <i>
        <em style={{ width: `${pct}%` }} />
      </i>
    </div>
  )
}
