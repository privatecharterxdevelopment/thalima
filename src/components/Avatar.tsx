import type { CrewMember } from '../types'

const hues: Record<string, string> = {
  eddy: '#1f4a5c',
  marco: '#6b4a2f',
  sofia: '#4a3f6b',
  julien: '#2f5a45',
  luca: '#5a3a3a',
}

export function Avatar({
  person,
  size = 'md',
}: {
  person: CrewMember
  size?: 'sm' | 'md' | 'lg'
}) {
  return (
    <span
      className={`avatar ${size}`}
      style={{ background: hues[person.id] ?? '#1f4a5c' }}
      title={person.name}
    >
      {person.initials}
    </span>
  )
}
