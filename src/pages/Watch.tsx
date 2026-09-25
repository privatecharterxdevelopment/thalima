import { crew } from '../data/crew'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'

const bill = [
  { time: '00–04', who: 'mate', note: 'Anchor. Transits every 15 min. Call Captain if she walks.' },
  { time: '04–08', who: 'captain', note: 'Anchor + dawn. Engine room walk.' },
  { time: '08–12', who: 'stew', note: 'Cabins after breakfast. Mate on deck wash after guests aft.' },
  { time: '12–16', who: 'engineer', note: 'Plant. Watermaker if we run. Hydraulic mark.' },
  { time: '16–20', who: 'mate', note: 'Anchor watch. Tender runs. Recover before dark.' },
  { time: '20–24', who: 'captain', note: 'Command. Dinner service support. Night orders.' },
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
    <div className="pad">
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
      </div>
      <table className="table" style={{ marginTop: 8 }}>
        <thead>
          <tr>
            <th>Crew</th>
            <th>Work</th>
            <th>Rest</th>
            <th>MLC</th>
          </tr>
        </thead>
        <tbody>
          {crew
            .filter((c) => c.access !== 'owner')
            .map((who) => (
              <tr key={who.id}>
                <td>{who.name}</td>
                <td>—</td>
                <td>—</td>
                <td>Clear</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
