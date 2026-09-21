import { crew } from '../data/crew'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'

const bill = [
  { time: '00–04', who: 'luca', note: 'Anchor. Transits every 15 min. Call Max if she walks.' },
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
          {[
            { id: 'eddy', work: '11 h 20', rest: '12 h 40', ok: true },
            { id: 'marco', work: '9 h 00', rest: '15 h 00', ok: true },
            { id: 'sofia', work: '12 h 30', rest: '11 h 30', ok: true },
            { id: 'julien', work: '12 h 00', rest: '12 h 00', ok: true },
            { id: 'luca', work: '10 h 45', rest: '13 h 15', ok: true },
          ].map((r) => {
            const who = crew.find((c) => c.id === r.id)
            if (!who) return null
            return (
              <tr key={r.id}>
                <td>{who.name}</td>
                <td>{r.work}</td>
                <td>{r.rest}</td>
                <td>{r.ok ? 'Clear' : 'Short'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
