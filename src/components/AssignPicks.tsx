import { crew } from '../data/crew'
import { Avatar } from './Avatar'
import { formatDayLong, unavailableOn } from '../lib/roster'
import { romeDay } from '../lib/opsTasks'
import { useStore } from '../store'

export function AssignPicks({
  value,
  onChange,
  variant = 'pills',
  date,
}: {
  value: string[]
  onChange: (ids: string[]) => void
  variant?: 'pills' | 'chips'
  date?: string
}) {
  const { roster } = useStore()
  const day = date ? romeDay(date) : romeDay()
  const warnings = value
    .map((id) => {
      const person = crew.find((c) => c.id === id)
      const hit = unavailableOn(id, day, roster)
      if (!person || !hit) return null
      return {
        id,
        name: person.name,
        until: hit.to,
        presence: hit.presence,
      }
    })
    .filter((row): row is { id: string; name: string; until: string; presence: 'onboard' | 'offboard' } => Boolean(row))

  return (
    <div className={`assign-picks ${variant === 'chips' ? 'is-chips' : ''}`}>
      {crew.map((c) => {
        const on = value.includes(c.id)
        return (
          <button
            key={c.id}
            type="button"
            className={on ? 'on' : ''}
            aria-pressed={on}
            onClick={() => {
              if (on) {
                if (value.length < 2) return
                onChange(value.filter((id) => id !== c.id))
                return
              }
              onChange([...value, c.id])
            }}
          >
            <Avatar person={c} size="sm" />
            <span>{c.name.split(' ')[0]}</span>
          </button>
        )
      })}
      {warnings.length ? (
        <ul className="assign-warn">
          {warnings.map((w) => (
            <li key={w.id}>
              {w.name}
              {w.presence === 'offboard' ? ` · Off board until ${formatDayLong(w.until)}` : ` · Unavailable until ${formatDayLong(w.until)}`}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
