import { cabins } from '../data/crew'
import { useStore } from '../store'

export function Interior() {
  const { user } = useStore()
  if (!user) return null

  return (
    <div className="pad">
      <div className="mother">
        {cabins.map((c) => (
          <article key={c.id} className="panel cabin">
            <p className="eyebrow">{c.beds}</p>
            <h3>{c.name}</h3>
            <p>{c.guests.length ? c.guests.join(' · ') : 'Empty'}</p>
            <p>{c.notes}</p>
            <p className="eyebrow">{c.service}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
