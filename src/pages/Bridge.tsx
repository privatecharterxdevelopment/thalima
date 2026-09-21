import { useNavigate } from 'react-router-dom'
import { NavWidget } from '../components/NavWidget'
import { Avatar } from '../components/Avatar'
import { useUi } from '../ui'
import { useStore } from '../store'
import { clock, isMarkedOn, taskAssignees } from '../lib/format'
import { eventsOnDay, sameDay } from '../lib/cal'
import { crew, deptLabel, statusLabel } from '../data/crew'
import { buildAlerts } from '../lib/alerts'

function weekDays() {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  monday.setHours(12, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function Bridge() {
  const { user, tasks, events, systems, ops } = useStore()
  const { navFull } = useUi()
  const nav = useNavigate()
  if (!user) return null

  if (navFull) {
    return (
      <div className="oveo">
        <NavWidget variant="page" />
      </div>
    )
  }

  const assigned = tasks
    .filter((t) => t.status !== 'done' && isMarkedOn(t, user.id))
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
  const live =
    assigned.filter((t) => t.status === 'doing').sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())[0] ??
    assigned[0]
  const people = live
    ? taskAssignees(live)
        .map((id) => crew.find((c) => c.id === id))
        .filter(Boolean)
    : []
  const days = weekDays()
  const today = new Date()
  const upcomingEvent = [...events]
    .filter((e) => new Date(e.end).getTime() >= Date.now())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())[0]
  const alerts = buildAlerts({ tasks, ops, systems })

  return (
    <div className="home">
      <div className="home-stage">
        <section className="home-nav">
          <NavWidget variant="window" />
        </section>

        <button
          className="glass-card apple-widget home-live"
          type="button"
          onClick={() => (live ? nav(`/board/${live.id}`) : nav('/board'))}
        >
          <div className="apple-kicker">
            <span>{live ? statusLabel[live.status] : 'Now'}</span>
            {live ? <em>{clock(live.due)}</em> : null}
          </div>
          {live ? (
            <div className="live-body">
              <h2>{live.title}</h2>
              <p>{live.body}</p>
              <small>
                {deptLabel[live.department]}
                {new Date(live.due).getTime() < Date.now() ? ' · Overdue' : ''}
              </small>
              <ul className="live-who">
                {people.map((who) => (
                  <li key={who!.id}>
                    <Avatar person={who!} />
                    <div>
                      <b>{who!.name}</b>
                      <span>{who!.title}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="apple-empty">Nothing on the board.</p>
          )}
        </button>

        <button className="glass-card apple-widget" type="button" onClick={() => nav('/calendar')}>
          <div className="apple-kicker">
            <span>Diary</span>
          </div>
          <div className="week-strip">
            {days.map((d) => {
              const on = sameDay(d, today)
              const has = eventsOnDay(events, d).length > 0
              return (
                <span key={d.toISOString()} className={`week-day ${on ? 'is-today' : ''} ${has ? 'has-event' : ''}`}>
                  {d.toLocaleDateString('en-GB', { weekday: 'narrow', timeZone: 'Europe/Rome' })}
                  <b>{d.getDate()}</b>
                  {has ? <i /> : <i className="is-blank" />}
                </span>
              )
            })}
          </div>
          {upcomingEvent ? (
            <p className="week-next">
              <time>{clock(upcomingEvent.start)}</time>
              {upcomingEvent.title}
            </p>
          ) : (
            <p className="apple-empty">Nothing in the diary.</p>
          )}
        </button>

        <button
          className={`glass-card apple-widget home-tasks ${assigned.length ? 'is-pending' : 'is-clear'}`}
          type="button"
          onClick={() => nav('/board')}
        >
          <div className="apple-kicker">
            <span>Tasks</span>
            <em>{assigned.length}</em>
          </div>
          {assigned.length === 0 ? (
            <p className="apple-empty">No pending tasks</p>
          ) : (
            <ul className="apple-tasks">
              {assigned.map((t) => (
                <li key={t.id}>
                  <i className={`apple-ring is-${t.urgency}`} />
                  <span>{t.title}</span>
                </li>
              ))}
            </ul>
          )}
        </button>

        <section className="glass-card apple-widget apple-alerts">
          <div className="apple-kicker">
            <span>Alerts</span>
          </div>
          <div className="alert-list">
            {alerts.map((a) => (
              <button
                key={a.id}
                type="button"
                className={`alert-row ${a.tone === 'hot' ? 'is-hot' : a.tone === 'soon' ? 'is-soon' : ''}`}
                onClick={() => nav(a.to)}
              >
                <b>{a.count}</b>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
