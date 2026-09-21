import { eventsOnDay, monthDays, sameDay } from '../lib/cal'
import type { CalEvent } from '../types'

export function MonthGrid({ events }: { events: CalEvent[] }) {
  const cursor = new Date()
  const cells = monthDays(cursor)
  const monthName = cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Europe/Rome' })

  return (
    <div className="cal-mini">
      <p className="cal-mini-month">{monthName}</p>
      <div className="cal-week">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>
      <div className="cal-grid">
        {cells.map((day, i) => {
          if (!day) return <span key={`e-${i}`} />
          const dots = eventsOnDay(events, day).length
          const today = sameDay(day, new Date())
          return (
            <span key={day.toISOString()} className={`cal-day ${today ? 'today' : ''}`}>
              {day.getDate()}
              {dots > 0 && <i />}
            </span>
          )
        })}
      </div>
    </div>
  )
}
