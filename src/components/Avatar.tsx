import type { CrewMember } from '../types'

const hues: Record<string, string> = {
  captain: '#1f4a5c',
  mate: '#5a3a3a',
  stew: '#4a3f6b',
  engineer: '#6b4a2f',
  chef: '#2f5a45',
  info: '#3a4558',
}

export function Avatar({
  person,
  size = 'md',
}: {
  person: CrewMember
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  return (
    <span
      className={`avatar ${size}`}
      style={{ background: hues[person.id] ?? '#1f4a5c' }}
      title={person.name}
    >
      {person.photo ? <img src={person.photo} alt="" /> : person.initials}
    </span>
  )
}
