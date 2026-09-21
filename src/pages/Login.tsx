import { Navigate } from 'react-router-dom'
import { crew, levelLabel } from '../data/crew'
import { yacht, position } from '../data/yacht'
import { Avatar } from '../components/Avatar'
import { ThemeToggle } from '../components/ThemeToggle'
import { useStore } from '../store'
import { Bezel } from '../components/Shell'

export function Login() {
  const { login, user } = useStore()
  if (user) return <Navigate to="/app" replace />
  return (
    <Bezel>
      <div className="login">
        <section className="login-hero">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <p className="eyebrow">Southern Wind 110 · MCA LY2</p>
              <ThemeToggle />
            </div>
            <h1 className="wordmark" style={{ marginTop: 14, fontSize: 42 }}>
              thalima
            </h1>
            <p className="lede">
              Crew ops for a five-person 33.65 m sailing yacht. Touch display — pick your seat.
            </p>
            <ul className="facts">
              <li>
                <span>Yacht</span>
                {yacht.loaM} m · {yacht.year}/{yacht.refit} · Farr / Nauta
              </li>
              <li>
                <span>Now</span>
                {position.status}, {position.place}
              </li>
              <li>
                <span>Ship</span>
                {yacht.mmsi} · {yacht.callsign}
              </li>
              <li>
                <span>People</span>
                {yacht.guests} guests · {yacht.crew} crew
              </li>
            </ul>
          </div>
          <p className="eyebrow">Working language English</p>
        </section>
        <section className="login-panel">
          <p className="eyebrow">Sign in</p>
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
                <span className="level-tag">
                  L{c.level} {levelLabel[c.level]}
                </span>
              </button>
            ))}
          </div>
          <p className="hint" style={{ marginTop: 18, maxWidth: '42ch', lineHeight: 1.5 }}>
            L1 command sees the whole ship. L2 heads run their house and can send jobs to any seat. Open two
            windows to talk as two people.
          </p>
        </section>
      </div>
    </Bezel>
  )
}
