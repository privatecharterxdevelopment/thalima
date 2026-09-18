import { crew } from '../data/crew'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'

const bill = [
  { time: '00–04', who: 'luca', note: 'Anchor. Transits every 15 min. Call Eddy if she walks.' },
  { time: '04–08', who: 'eddy', note: 'Anchor + dawn. Engine room walk with coffee.' },
  { time: '08–12', who: 'sofia', note: 'Cabins after breakfast. Luca on deck wash after guests aft.' },
  { time: '12–16', who: 'marco', note: 'Plant. Watermaker if we run. Hydraulic mark.' },
  { time: '16–20', who: 'luca', note: 'Anchor watch. Tender 18:30. Recover before dark.' },
  { time: '20–24', who: 'eddy', note: 'Command. Dinner service support. Night orders.' },
]

export function Watch() {
  const { user } = useStore()
  const hour = new Date().toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Europe/Rome' })
  const h = Number(hour)

  function active(slot: string) {
    const start = Number(slot.slice(0, 2))
    const end = Number(slot.slice(3, 5))
    if (end === 0) return h >= start
    return h >= start && h < end
  }

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">At anchor · Marinella</p>
          <h1>Watch</h1>
          <p>
            Five souls, no extra dayworker. Anchor watches are real. Interior and galley keep guest hours
            rather than a sea rota.
          </p>
        </div>
      </div>
      <div className="watch">
        {bill.map((row) => {
          const who = crew.find((c) => c.id === row.who)
          if (!who) return null
          const on = active(row.time)
          return (
            <article key={row.time} className={`watch-row ${on ? 'now' : ''}`}>
              <strong style={{ fontFamily: 'var(--mono)' }}>{row.time}</strong>
              <span>
                {row.note}
                {on && user?.id === who.id ? ' · this is you' : ''}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar person={who} size="sm" />
                {who.name}
              </span>
            </article>
          )
        })}
        <p style={{ color: 'var(--muted)', marginTop: '1rem', maxWidth: '48ch', lineHeight: 1.65 }}>
          Julien is day-working the galley. Sofia covers interior through turndown, then on call. Marco
          sleeps in the engineer cabin unless the weep grows.
        </p>
      </div>
    </>
  )
}
