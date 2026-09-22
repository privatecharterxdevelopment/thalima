import type { CrewMember } from '../types'
import { Avatar } from './Avatar'

export function WhoLine({ people, hint }: { people: CrewMember[]; hint?: string }) {
  if (!people.length) return null
  return (
    <ul className="who-line">
      {people.map((person) => (
        <li key={person.id}>
          <Avatar person={person} />
          <span>
            {person.name.split(' ')[0]}
            {hint ? <small>{hint}</small> : null}
          </span>
        </li>
      ))}
    </ul>
  )
}
