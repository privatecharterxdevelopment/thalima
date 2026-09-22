import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  ChevronRight,
  CloudSun,
  LogOut,
  MessageCircle,
  Moon,
  PanelRightClose,
  Plus,
  Receipt,
  Sun,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Avatar } from './Avatar'
import { ShipBadge } from './ShipBadge'
import { deptLabel } from '../data/crew'
import { canSubmitAccounting } from '../lib/accounting'
import { currentSelfStatus, selfStatusLabel, selfStatuses } from '../lib/roster'
import { useStore } from '../store'

type Row = { to: string; label: string; icon: LucideIcon; count?: number }

export function AccountRail({
  open,
  onClose,
  unreadChat,
  unreadNotes,
  localTime,
}: {
  open: boolean
  onClose: () => void
  unreadChat: number
  unreadNotes: number
  localTime: string
}) {
  const { user, logout, roster, theme, setTheme, setMyStatus } = useStore()
  const nav = useNavigate()
  const loc = useLocation()

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !user) return null

  const status = currentSelfStatus(user.id, roster)
  const rows: Row[] = [
    ...(user.level <= 2 ? [{ to: '/new', label: 'Create task', icon: Plus }] : []),
    { to: '/notifications', label: 'Notifications', icon: Bell, count: unreadNotes },
    { to: '/messages', label: 'Open chat', icon: MessageCircle, count: unreadChat },
    { to: '/calendar', label: 'Diary', icon: CalendarDays },
    { to: '/crew/schedule', label: 'My schedule', icon: Users },
    { to: '/weather', label: 'Weather', icon: CloudSun },
    ...(canSubmitAccounting(user) ? [{ to: '/accounting/upload', label: 'Scan receipt', icon: Receipt }] : []),
  ]

  return (
    <aside className="account-rail" id="account-rail" aria-label="Account">
      <header className="account-rail-head">
        <Avatar person={user} size="lg" />
        <div>
          <strong>{user.name}</strong>
          <span>{user.title}</span>
        </div>
        <button type="button" className="ghost-icon" onClick={onClose} aria-label="Close account">
          <PanelRightClose size={17} strokeWidth={1.75} />
        </button>
      </header>

      <section className="acc-sec">
        <h3>Profile</h3>
        <dl className="account-rail-facts">
          <div>
            <dt>Station</dt>
            <dd>{deptLabel[user.department]}</dd>
          </div>
          <div>
            <dt>Watch</dt>
            <dd>{user.watch}</dd>
          </div>
          <div>
            <dt>Mail</dt>
            <dd>
              <a href={`mailto:${user.email}`}>{user.email}</a>
            </dd>
          </div>
        </dl>
      </section>

      <section className="acc-sec">
        <h3>My status · today</h3>
        <div className="acc-status" role="radiogroup" aria-label="My status">
          {selfStatuses.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={status === s}
              className={`is-${s} ${status === s ? 'on' : ''}`}
              onClick={() => status !== s && setMyStatus(s)}
            >
              <i aria-hidden="true" />
              {selfStatusLabel[s]}
            </button>
          ))}
        </div>
      </section>

      <section className="acc-sec">
        <h3>Vessel</h3>
        <div className="acc-vessel">
          <ShipBadge />
          <span>{localTime}</span>
        </div>
      </section>

      <section className="acc-sec">
        <h3>Quick control</h3>
        <ul className="acc-list">
          {rows.map(({ to, label, icon: Icon, count }) => (
            <li key={to}>
              <button
                type="button"
                className={loc.pathname === to ? 'on' : ''}
                onClick={() => nav(to)}
              >
                <Icon size={16} strokeWidth={1.75} />
                <span>{label}</span>
                {count ? <em>{count > 9 ? '9+' : count}</em> : null}
                <ChevronRight size={14} strokeWidth={1.75} className="acc-go" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="acc-sec">
        <h3>Appearance</h3>
        <div className="acc-seg" role="radiogroup" aria-label="Theme">
          <button type="button" role="radio" aria-checked={theme === 'light'} className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>
            <Sun size={14} strokeWidth={1.75} />
            Light
          </button>
          <button type="button" role="radio" aria-checked={theme === 'dark'} className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>
            <Moon size={14} strokeWidth={1.75} />
            Dark
          </button>
        </div>
      </section>

      <button type="button" className="account-rail-out" onClick={logout}>
        <LogOut size={15} strokeWidth={1.75} />
        Sign out
      </button>
    </aside>
  )
}
