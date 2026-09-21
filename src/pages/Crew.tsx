import { crew, deptLabel } from '../data/crew'
import { Avatar } from '../components/Avatar'

export function Crew() {
  return (
    <div className="pad inv crew-page">
      <div className="inv-head">
        <div>
          <p className="inv-kicker">Onboard</p>
          <p className="inv-copy">Five seats. Name, position, and how to reach them.</p>
        </div>
      </div>
      <ul className="crew-grid">
        {crew.map((person) => (
          <li key={person.id} className="glass-card crew-profile">
            <Avatar person={person} size="xl" />
            <h2>{person.name}</h2>
            <p className="crew-role">
              {person.title} · {deptLabel[person.department]}
            </p>
            <dl className="crew-facts">
              <div>
                <dt>Position</dt>
                <dd>
                  {person.title}
                  <span>{person.watch}</span>
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${person.email}`}>{person.email}</a>
                </dd>
              </div>
              <div>
                <dt>Tel</dt>
                <dd>
                  <a href={`tel:${person.phone.replace(/\s/g, '')}`}>{person.phone}</a>
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  )
}
