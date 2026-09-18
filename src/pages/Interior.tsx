import { cabins } from '../data/crew'
import { useStore } from '../store'

export function Interior() {
  const { user } = useStore()
  if (!user) return null
  const guests = cabins.reduce((n, c) => n + c.guests.length, 0)

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Guest house · Nauta layout</p>
          <h1>Interior</h1>
          <p>
            Four cabins aft of the crew alley and around the raised saloon. This week: {guests} guests.
            Twin starboard is spare.
          </p>
        </div>
      </div>
      <div className="mother">
        {cabins.map((c) => (
          <article key={c.id} className="panel cabin">
            <p className="eyebrow">{c.beds}</p>
            <h3>{c.name}</h3>
            <p>
              {c.guests.length ? c.guests.join(' · ') : 'Empty'}
            </p>
            <p>{c.notes}</p>
            <p className="eyebrow">{c.service}</p>
          </article>
        ))}
      </div>
    </>
  )
}
