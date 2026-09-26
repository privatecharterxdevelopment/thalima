import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import { NavWidget } from '../components/NavWidget'
import { WhoLine } from '../components/WhoLine'
import { StatusPill, statusTone } from '../components/StatusPill'
import { useUi } from '../ui'
import { useStore } from '../store'
import { clock, dueLine, isMarkedOn, onStation, sortTasks, taskAssignees } from '../lib/format'
import { eventsOnDay, sameDay } from '../lib/cal'
import { calRoleLabel, crew, deptLabel } from '../data/crew'
import { isOpenStatus } from '../lib/opsTasks'
import type { CrewMember, Task } from '../types'

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

function onHomeBoard(user: CrewMember, task: Task) {
  return isMarkedOn(task, user.id) || onStation(user, task.department) || task.createdBy === user.id
}

function peopleOf(task: Task) {
  return taskAssignees(task)
    .map((id) => crew.find((c) => c.id === id))
    .filter((who): who is CrewMember => Boolean(who))
}

function tripCovers(trip: { from: string; to: string }, day: Date) {
  const from = new Date(trip.from)
  const to = new Date(trip.to)
  from.setHours(0, 0, 0, 0)
  to.setHours(23, 59, 59, 999)
  return day.getTime() >= from.getTime() && day.getTime() <= to.getTime()
}

export function Bridge() {
  const { user, tasks, events, ops } = useStore()
  const { navFull } = useUi()
  const nav = useNavigate()
  const [picked, setPicked] = useState(() => new Date())
  if (!user) return null

  if (navFull) {
    return (
      <div className="oveo">
        <NavWidget variant="page" />
      </div>
    )
  }

  const visible = tasks
    .filter((t) => isOpenStatus(t.status) && onHomeBoard(user, t))
    .sort(sortTasks)
  const mine = visible.filter((t) => isMarkedOn(t, user.id))
  const team = visible.filter((t) => !isMarkedOn(t, user.id))
  const overdue = visible.filter((t) => new Date(t.due).getTime() < Date.now()).length
  const trip = ops.trips.find((t) => tripCovers(t, new Date()))
  const days = weekDays()
  const dayEvents = eventsOnDay(events, picked).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  )
  const tripOnDay = ops.trips.find((t) => t.guests.length > 0 && tripCovers(t, picked))
  const pickedLabel = picked.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Rome',
  })

  return (
    <div className="home">
      <div className="home-stage">
        <div className="home-chips">
          <button type="button" onClick={() => nav('/board')}>
            <b>{mine.length}</b>
            Mine
          </button>
          <button type="button" onClick={() => nav('/board')}>
            <b>{visible.length}</b>
            On the board
          </button>
          <button type="button" className={overdue ? 'is-hot' : ''} onClick={() => nav('/board')}>
            <b>{overdue}</b>
            Overdue
          </button>
          {trip ? (
            <button type="button" onClick={() => nav(`/calendar/event/${trip.id}`)}>
              <b>{trip.guests.length}</b>
              Guests aboard
              <em>{trip.title}</em>
            </button>
          ) : null}
        </div>

        <section className="home-card home-board">
          <header className="home-card-head">
            <h2>Crew tasks</h2>
            <button type="button" className="home-see" onClick={() => nav('/board')}>
              See all
            </button>
          </header>
          {team.length === 0 ? (
            <EmptyState
              className="is-compact"
              title="Crew board is clear"
              body="No open tasks for the rest of the team right now."
              action={{ to: '/new', label: 'Create task' }}
            />
          ) : (
            <div className="home-table">
              <div className="home-thead">
                <span>Task</span>
                <span>Station</span>
                <span>Assign</span>
                <span>Status</span>
              </div>
              {team.slice(0, 12).map((t) => (
                <button key={t.id} type="button" className="home-trow" onClick={() => nav(`/board/${t.id}`)}>
                  <span className="home-tname">
                    {t.title}
                    <small>{dueLine(t.due)}</small>
                  </span>
                  <span className="home-tmeta">{deptLabel[t.department]}</span>
                  <span className="home-twho">
                    <WhoLine people={peopleOf(t)} />
                  </span>
                  <span className="home-tstatus">
                    <StatusPill status={t.status} tone={statusTone(t)} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="home-card home-mine">
          <header className="home-card-head">
            <h2>My tasks</h2>
            <em>{mine.length}</em>
          </header>
          {mine.length === 0 ? (
            <EmptyState
              className="is-compact"
              title="You're clear"
              body={`Nothing assigned to ${user.name.split(' ')[0]} right now.`}
              action={{ to: '/board', label: 'Open board' }}
            />
          ) : (
            <ul className="home-mine-list">
              {mine.map((t) => (
                <li key={t.id}>
                  <button type="button" onClick={() => nav(`/board/${t.id}`)}>
                    <span>
                      <strong>{t.title}</strong>
                      <small>
                        {dueLine(t.due)} · {deptLabel[t.department]}
                      </small>
                    </span>
                    <StatusPill status={t.status} tone={statusTone(t)} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="home-card home-diary">
          <header className="home-card-head">
            <h2>Schedule</h2>
            <button type="button" className="home-see" onClick={() => nav('/calendar')}>
              Open diary
            </button>
          </header>
          <div className="home-week">
            {days.map((d) => {
              const on = sameDay(d, picked)
              const has = eventsOnDay(events, d).length > 0
              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  className={`${on ? 'is-on' : ''} ${sameDay(d, new Date()) ? 'is-today' : ''}`}
                  onClick={() => setPicked(d)}
                >
                  <small>{d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Europe/Rome' })}</small>
                  <b>{d.toLocaleDateString('en-GB', { day: 'numeric', timeZone: 'Europe/Rome' })}</b>
                  <i className={has ? '' : 'is-blank'} />
                </button>
              )
            })}
          </div>
          <p className="home-day">{pickedLabel}</p>
          {dayEvents.length === 0 && !tripOnDay ? (
            <EmptyState
              className="is-compact"
              title="Diary is open"
              body={`No entries for ${pickedLabel}.`}
              action={{ to: '/calendar', label: 'Open calendar' }}
            />
          ) : (
            <ul className="home-events">
              {tripOnDay ? (
                <li className="is-guests">
                  <button type="button" onClick={() => nav(`/calendar/event/${tripOnDay.id}`)}>
                    <strong>{tripOnDay.title}</strong>
                    <small>{tripOnDay.guests.map((g) => g.name).join(' · ')}</small>
                  </button>
                </li>
              ) : null}
              {dayEvents.map((e) => (
                <li key={e.id} className={`is-${e.role}`}>
                  <button type="button" onClick={() => nav('/calendar')}>
                    <strong>{e.title}</strong>
                    <small>
                      {clock(e.start)} – {clock(e.end)} · {calRoleLabel[e.role]}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="home-nav">
          <NavWidget variant="window" />
        </section>
      </div>
    </div>
  )
}
