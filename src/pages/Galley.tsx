import { cabins, inventory } from '../data/crew'
import { useStore } from '../store'

const menu = [
  { when: '19:30', who: 'Kids', dish: 'Pasta, no dairy for Nina' },
  { when: '20:30', who: 'Adults', dish: 'Grilled dentex · no shellfish on the pass' },
]

export function Galley() {
  const { user } = useStore()
  if (!user) return null
  const stock = inventory.filter((i) => i.dept === 'galley')
  const allergies = cabins
    .filter((c) => /\ballerg(?:y|ies)\b|\bdairy\b|\bshellfish\b/i.test(c.notes))
    .map((c) => `${c.name}: ${c.notes}`)

  return (
    <div className="pad">
      <div className="stats">
        {menu.map((m) => (
          <div key={m.when} className="stat">
            <span>
              {m.when} · {m.who}
            </span>
            <b style={{ fontSize: 18 }}>{m.dish}</b>
          </div>
        ))}
      </div>
      <div className="tanks" style={{ marginTop: 16 }}>
        <section className="panel">
          <p className="eyebrow">Pass</p>
          <p style={{ color: 'var(--muted)', lineHeight: 1.65, maxWidth: '48ch', marginTop: 10 }}>
            Clara — no shellfish anywhere. Nina — no dairy at breakfast. Otto will ask for ice cream; oat tub is in
            the crew freezer.
          </p>
          {allergies.map((a) => (
            <p key={a} className="hint" style={{ marginTop: 10, maxWidth: '52ch' }}>
              {a}
            </p>
          ))}
        </section>
        <section className="panel">
          <p className="eyebrow">Dry and cold</p>
          <ul className="facts" style={{ marginTop: 12 }}>
            {stock.map((i) => (
              <li key={i.id}>
                <span>{i.item}</span>
                {i.stock} {i.unit}
                {i.stock < i.min ? ' · low' : ''}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
