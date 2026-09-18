import { Navigate } from 'react-router-dom'
import { crew, levelLabel } from '../data/crew'
import { yacht, position } from '../data/yacht'
import { Avatar } from '../components/Avatar'
import { ThemeToggle } from '../components/ThemeToggle'
import { useStore } from '../store'

export function Login() {
  const { login, user } = useStore()
  if (user) return <Navigate to="/" replace />
  return (
    <div className="login">
      <section className="login-hero">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <p className="eyebrow">Southern Wind 110 RS · Hull no. 1</p>
            <ThemeToggle />
          </div>
          <h1 className="wordmark" style={{ marginTop: '1.4rem' }}>
            thalima
          </h1>
          <p className="lede">
            Crew system for the yacht. Captain, engineer, interior, galley and deck work the same board,
            each at their own level.
          </p>
          <ul className="facts">
            <li>
              <span>Yacht</span>
              {yacht.loaM} m · {yacht.builder.split(',')[0]} · {yacht.year}/{yacht.refit}
            </li>
            <li>
              <span>Design</span>
              {yacht.naval} · {yacht.design}
            </li>
            <li>
              <span>Now</span>
              {position.status}, {position.place}
            </li>
            <li>
              <span>Class / flag</span>
              {yacht.class} · {yacht.flag}
            </li>
            <li>
              <span>Ship</span>
              MMSI {yacht.mmsi} · {yacht.callsign}
            </li>
            <li>
              <span>People</span>
              {yacht.guests} guests / {yacht.cabins} cabins · {yacht.crew} crew
            </li>
          </ul>
        </div>
        <p className="eyebrow">Working language English · MCA LY2</p>
      </section>
      <section className="login-panel">
        <p className="eyebrow">Step aboard</p>
        <h2>Choose your seat</h2>
        <div className="crew-pick">
          {crew.map((c) => (
            <button key={c.id} className="crew-card" onClick={() => login(c.id)}>
              <Avatar person={c} size="lg" />
              <div>
                <strong>{c.name}</strong>
                <small>
                  {c.title} · {c.watch}
                </small>
              </div>
              <span className="level-tag">L{c.level} · {levelLabel[c.level]}</span>
            </button>
          ))}
        </div>
        <p style={{ marginTop: '2rem', color: 'var(--muted)', maxWidth: '42ch', lineHeight: 1.65 }}>
          Level 1 sees everything. Heads of department assign inside their house. Deck works the jobs on
          their name. Open two windows to talk as two seats.
        </p>
      </section>
    </div>
  )
}
