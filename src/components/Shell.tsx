import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  CalendarDays,
  Cloud,
  CloudSun,
  Compass,
  House,
  ListChecks,
  MessageCircle,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Avatar } from './Avatar'
import { ThemeToggle } from './ThemeToggle'
import { Notices } from './Notices'
import { TaskSheet } from './TaskSheet'
import { canSeeTask, helloParts, isFreshTask } from '../lib/format'
import { channels } from '../data/crew'
import { menuFor, titleFor } from '../nav'
import { visibleChannels } from '../lib/permissions'
import { useStore } from '../store'
import { useUi } from '../ui'
import { useEffect, useState } from 'react'

const RAIL_KEY = 'thalima.rail.open'

const railIcon: Record<string, LucideIcon> = {
  '/app': House,
  '/board': ListChecks,
  '/calendar': CalendarDays,
  '/position': Compass,
  '/messages': MessageCircle,
  '/crew': Users,
  '/inventory': Package,
  '/cloud': Cloud,
  '/log': BookOpen,
}

function loadRailOpen() {
  try {
    return sessionStorage.getItem(RAIL_KEY) === '1'
  } catch {
    return false
  }
}

export function Bezel({ children, navFull }: { children: React.ReactNode; navFull?: boolean }) {
  return (
    <div className={`bezel ${navFull ? 'is-nav-full' : ''}`}>
      <div className="screen">{children}</div>
    </div>
  )
}

export function Shell() {
  const { user, logout, tasks, lastRead, messages } = useStore()
  const { taskId, navFull, setNavFull } = useUi()
  const loc = useLocation()
  const go = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const [railOpen, setRailOpen] = useState(loadRailOpen)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setNavFull(false)
  }, [loc.pathname, setNavFull])

  useEffect(() => {
    try {
      sessionStorage.setItem(RAIL_KEY, railOpen ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [railOpen])

  if (!user) return null

  const local = now.toLocaleTimeString('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Europe/Rome',
  })
  const weekday = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    timeZone: 'Europe/Rome',
  })
  const canCreate = user.level <= 2
  const first = user.name.split(' ')[0]
  const heading = titleFor(loc.pathname, first)
  const fresh = tasks.filter((t) => canSeeTask(user, t) && isFreshTask(t, user.id, lastRead)).length
  const unreadChat = visibleChannels(user, channels).reduce((n, ch) => {
    const read = lastRead[`${user.id}:${ch.id}`]
    return (
      n +
      messages.filter((m) => m.channelId === ch.id && m.authorId !== user.id && (!read || m.at > read)).length
    )
  }, 0)
  const dash = loc.pathname === '/app' && !navFull
  const chromeOff = navFull
  const links = menuFor(user)

  return (
    <Bezel navFull={chromeOff}>
      <div className={`app ${chromeOff ? 'is-nav-full' : ''}`}>
        {!chromeOff && (
          <aside className={`rail ${railOpen ? 'is-open' : ''}`}>
            <span className="rail-mark" aria-label="Thalima">
              T
            </span>
            <nav>
              {links.map((l) => {
                const Icon = railIcon[l.to]
                const n = l.to === '/board' ? fresh : l.to === '/messages' ? unreadChat : 0
                return (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    title={l.label}
                    aria-label={n > 0 ? `${l.label} ${n}` : l.label}
                    className={({ isActive }) => (isActive ? 'on' : '')}
                  >
                    {Icon && <Icon size={20} strokeWidth={1.75} />}
                    <span>{l.label}</span>
                    {n > 0 && <em>{n > 9 ? '9+' : n}</em>}
                  </NavLink>
                )
              })}
            </nav>
            <button
              className="rail-toggle"
              type="button"
              onClick={() => setRailOpen((v) => !v)}
              aria-label={railOpen ? 'Collapse menu' : 'Expand menu'}
              aria-expanded={railOpen}
            >
              {railOpen ? <PanelLeftClose size={18} strokeWidth={1.75} /> : <PanelLeftOpen size={18} strokeWidth={1.75} />}
            </button>
          </aside>
        )}
        <div className="app-col">
          <header className="top">
            <h1 className="top-greet">
              {loc.pathname === '/app' ? (
                <>
                  <span className="top-hi">{helloParts(first).greet},</span> {first}
                </>
              ) : (
                heading
              )}
            </h1>
            <div className="ahoy">
              <span>
                {weekday}, {local}
              </span>
              <button
                className={`ghost-icon ${loc.pathname === '/weather' ? 'on' : ''}`}
                onClick={() => go('/weather')}
                aria-label="Weather"
              >
                <CloudSun size={16} strokeWidth={2} />
              </button>
              {canCreate && (
                <button
                  className={`ghost-icon ${loc.pathname === '/new' ? 'on' : ''}`}
                  onClick={() => go('/new')}
                  aria-label="New task"
                >
                  <Plus size={16} strokeWidth={2} />
                </button>
              )}
              <Notices />
              <ThemeToggle />
              <button className="ahoy-who" onClick={logout} title="Sign out">
                <Avatar person={user} />
              </button>
            </div>
          </header>
          <main className={`page ${dash ? 'dash' : 'fill'}`}>
            <Outlet />
          </main>
        </div>
      </div>
      {taskId && <TaskSheet />}
    </Bezel>
  )
}
