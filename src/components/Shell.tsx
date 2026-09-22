import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BookOpen,
  CalendarDays,
  Cloud,
  Compass,
  House,
  ListChecks,
  MessageCircle,
  Bell,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Users,
  Wrench,
  Shield,
  type LucideIcon,
} from 'lucide-react'
import { AccountRail } from './AccountRail'
import { Avatar } from './Avatar'
import { CreateMenu } from './CreateMenu'
import { EmergencyAlert } from './EmergencyAlert'
import { helloParts, isFreshTask, isMarkedOn } from '../lib/format'
import { useBoatFix } from '../lib/ais'
import { yacht } from '../data/yacht'
import { buildNotices, isNoticeSeen } from '../lib/notices'
import { menuFor, titleFor } from '../nav'
import { visibleChannels } from '../lib/permissions'
import { useStore } from '../store'
import { useUi } from '../ui'
import { Fragment, useEffect, useState } from 'react'

const RAIL_KEY = 'thalima.rail.open'
const ACCOUNT_KEY = 'thalima.account.open'

const railIcon: Record<string, LucideIcon> = {
  '/app': House,
  '/board': ListChecks,
  '/calendar': CalendarDays,
  '/position': Compass,
  '/messages': MessageCircle,
  '/notifications': Bell,
  '/crew': Users,
  '/inventory': Package,
  '/maintenance': Wrench,
  '/accounting': Receipt,
  '/cloud': Cloud,
  '/log': BookOpen,
  '/admin': Shield,
}

function loadFlag(key: string) {
  try {
    return sessionStorage.getItem(key) === '1'
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
  const { user, tasks, lastRead, messages, seenNotices, roster, expenses } = useStore()
  const { navFull, setNavFull } = useUi()
  const loc = useLocation()
  const fix = useBoatFix()
  const [now, setNow] = useState(() => new Date())
  const [railOpen, setRailOpen] = useState(() => loadFlag(RAIL_KEY))
  const [accountOpen, setAccountOpen] = useState(() => loadFlag(ACCOUNT_KEY))

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

  useEffect(() => {
    try {
      sessionStorage.setItem(ACCOUNT_KEY, accountOpen ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [accountOpen])

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
  const first = user.name.split(' ')[0]
  const heading = titleFor(loc.pathname, first)
  const fresh = tasks.filter((t) => isMarkedOn(t, user.id) && isFreshTask(t, user.id, lastRead)).length
  const unreadChat = visibleChannels(user).reduce((n, ch) => {
    const read = lastRead[`${user.id}:${ch.id}`]
    return (
      n +
      messages.filter((m) => m.channelId === ch.id && m.authorId !== user.id && (!read || m.at > read)).length
    )
  }, 0)
  const unreadNotes = buildNotices({ user, tasks, lastRead, roster, expenses, messages }).filter(
    (n) => !isNoticeSeen(user.id, n.id, seenNotices),
  ).length
  const dash = loc.pathname === '/app' && !navFull
  const chromeOff = navFull
  const links = menuFor(user)
  const mainLinks = links.filter((l) => l.to !== '/admin')
  const footLinks = links.filter((l) => l.to === '/admin')

  return (
    <Bezel navFull={chromeOff}>
      <div className={`app ${chromeOff ? 'is-nav-full' : ''}`}>
        {!chromeOff && (
          <aside className={`rail ${railOpen ? 'is-open' : ''}`}>
            <span className="rail-mark" aria-label="Thalima">
              <img src="/mark.png" alt="" />
            </span>
            <nav>
              {mainLinks.map((l) => {
                const Icon = railIcon[l.to]
                const n =
                  l.to === '/board' ? fresh : l.to === '/messages' ? unreadChat : l.to === '/notifications' ? unreadNotes : 0
                return (
                  <Fragment key={l.to}>
                    <NavLink
                      to={l.to}
                      end={l.end}
                      data-tip={l.label}
                      aria-label={n > 0 ? `${l.label} ${n}` : l.label}
                      className={({ isActive }) => (isActive ? 'on' : '')}
                    >
                      {Icon && <Icon size={19} strokeWidth={1.75} />}
                      <span>{l.label}</span>
                      {n > 0 && <em>{n > 9 ? '9+' : n}</em>}
                    </NavLink>
                    {l.to === '/position' || l.to === '/notifications' ? <i className="rail-sep" aria-hidden="true" /> : null}
                  </Fragment>
                )
              })}
            </nav>
            <div className="rail-foot">
              {footLinks.map((l) => {
                const Icon = railIcon[l.to]
                return (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    data-tip={l.label}
                    aria-label={l.label}
                    className={({ isActive }) => (isActive ? 'on' : '')}
                  >
                    {Icon && <Icon size={19} strokeWidth={1.75} />}
                    <span>{l.label}</span>
                  </NavLink>
                )
              })}
            </div>
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
            <div className="top-hello">
              <h1 className="top-greet">
                {loc.pathname === '/app' ? (
                  <>
                    <span className="top-hi">{helloParts(first).greet},</span> {first}
                  </>
                ) : (
                  heading
                )}
              </h1>
              {loc.pathname === '/app' && fix.city ? (
                <p className="top-vessel">
                  {yacht.name.toUpperCase()} · {fix.city}
                </p>
              ) : null}
            </div>
            <div className="ahoy">
              {user.level <= 2 ? (
                <>
                  <CreateMenu />
                  <span className="ahoy-sep" aria-hidden="true" />
                </>
              ) : null}
              <button
                className={`ahoy-who ${accountOpen ? 'on' : ''}`}
                type="button"
                onClick={() => setAccountOpen((v) => !v)}
                aria-label={unreadNotes > 0 ? `Account, ${unreadNotes} notifications` : 'Account'}
                aria-expanded={accountOpen}
                aria-controls="account-rail"
              >
                <Avatar person={user} />
                {unreadNotes > 0 && !accountOpen ? <span className="ahoy-dot" aria-hidden="true" /> : null}
              </button>
            </div>
          </header>
          <div className="app-work">
            <main className={`page ${dash ? 'dash' : 'fill'}`}>
              <Outlet />
            </main>
            {!chromeOff ? (
              <AccountRail
                open={accountOpen}
                onClose={() => setAccountOpen(false)}
                unreadChat={unreadChat}
                unreadNotes={unreadNotes}
                localTime={`${weekday}, ${local}`}
              />
            ) : null}
          </div>
        </div>
      </div>
      <EmergencyAlert />
    </Bezel>
  )
}
