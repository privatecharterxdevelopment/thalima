import { useMemo } from 'react'
import { cabins } from '../data/crew'
import { EmptyState } from '../components/EmptyState'
import { useStore } from '../store'

function tripCovers(trip: { from: string; to: string }, day = new Date()) {
  const from = new Date(trip.from)
  const to = new Date(trip.to)
  from.setHours(0, 0, 0, 0)
  to.setHours(23, 59, 59, 999)
  return day.getTime() >= from.getTime() && day.getTime() <= to.getTime()
}

export function Galley() {
  const { user, ops } = useStore()
  const trip = useMemo(() => ops.trips.find((t) => tripCovers(t) && t.guests.length > 0), [ops.trips])
  const allergies = useMemo(() => {
    if (trip) {
      return trip.guests
        .filter((g) => g.allergy && g.allergy !== '—')
        .map((g) => `${g.name}: ${g.allergy}${g.diet ? ` · ${g.diet}` : ''}`)
    }
    return cabins
      .filter((c) => /\ballerg(?:y|ies)\b|\bdairy\b|\bshellfish\b/i.test(c.notes))
      .map((c) => `${c.name}: ${c.notes}`)
  }, [trip])

  if (!user) return null

  return (
    <div className="pad">
      <div className="tanks">
        <section className="panel">
          <p className="eyebrow">Pass</p>
          {trip ? (
            <>
              <p style={{ color: 'var(--muted)', lineHeight: 1.65, maxWidth: '48ch', marginTop: 10 }}>
                Active event · {trip.title}. Guest notes below drive the pass.
              </p>
              {allergies.length ? (
                <ul className="facts" style={{ marginTop: 12 }}>
                  {allergies.map((a) => (
                    <li key={a}>
                      <span>Allergy / diet</span>
                      {a}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  className="is-inline"
                  title="No diet notes yet"
                  body="Add allergies and meal preferences on the guest list for this event."
                  action={{ to: `/calendar/event/${trip.id}`, label: 'Open event' }}
                />
              )}
            </>
          ) : (
            <EmptyState
              className="is-inline"
              title="No guests on the pass"
              body="When an event with guests is aboard, diet and allergy notes show up here."
              action={{ to: '/calendar?tab=trips', label: 'Open events' }}
            />
          )}
        </section>
      </div>
    </div>
  )
}
