import { NavLink, Outlet } from 'react-router-dom'
import {
  BookOpen,
  Compass,
  Kanban,
  LayoutDashboard,
  MessageSquare,
  MoonStar,
  ShipWheel,
  Wrench,
} from 'lucide-react'
import { Avatar } from './Avatar'
import { ThemeToggle } from './ThemeToggle'
import { useStore } from '../store'
import { position, yacht } from '../data/yacht'
import { beaufort, cardinal, formatLatLon } from '../lib/format'
import { useEffect, useState } from 'react'

export function Shell() {
  const { user, logout, weather, reset } = useStore()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  if (!user) return null

  const local = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Europe/Rome',
  })
  const utc = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
  const wind = weather ? `${weather.windKn.toFixed(0)} kn ${cardinal(weather.windDir)}` : '—'
  const b = weather ? beaufort(weather.windKn) : null

  const links = [
    { to: '/', end: true, icon: LayoutDashboard, label: 'Motherboard' },
    { to: '/board', icon: Kanban, label: 'Board' },
    { to: '/messages', icon: MessageSquare, label: 'Messages' },
    { to: '/position', icon: Compass, label: 'Position' },
    { to: '/engineering', icon: Wrench, label: 'Engineering' },
    { to: '/interior', icon: MoonStar, label: 'Interior' },
    { to: '/watch', icon: ShipWheel, label: 'Watch' },
    { to: '/log', icon: BookOpen, label: 'Log' },
  ]

  return (
    <div className="shell">
      <aside className="nav">
        <div className="nav-brand">
          <span className="eyebrow">SW 110 · Crew</span>
          <span className="wordmark">thalima</span>
        </div>
        <nav className="nav-list">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <l.icon size={17} strokeWidth={1.7} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-foot">
          <div className="who">
            <Avatar person={user} />
            <div>
              <strong>{user.name}</strong>
              <br />
              <small>
                {user.title} · L{user.level}
              </small>
            </div>
          </div>
          {user.level === 1 && (
            <button className="linkish" onClick={reset}>
              Reset the board
            </button>
          )}
          <button className="linkish" onClick={logout}>
            Leave the boat
          </button>
        </div>
      </aside>
      <div className="stage">
        <header className="instruments">
          <div className="inst-row">
            <div>
              Position
              <b>{formatLatLon(position.lat, position.lon)}</b>
            </div>
            <div>
              {position.status}
              <b>
                {position.place} · {position.sog} kn
              </b>
            </div>
            <div>
              Wind
              <b>
                {wind}
                {b ? ` · F${b.f}` : ''}
              </b>
            </div>
            <div>
              Rome / UTC
              <b>
                {local} · {utc}Z
              </b>
            </div>
          </div>
          <div className="row-btns">
            <span className="eyebrow" style={{ alignSelf: 'center' }}>
              {yacht.flag} · {yacht.callsign}
            </span>
            <ThemeToggle />
          </div>
        </header>
        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
