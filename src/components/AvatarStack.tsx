import type { CrewMember } from '../types'
import { Avatar } from './Avatar'

export function AvatarStack({
  people,
  size = 'md',
  max = 3,
}: {
  people: CrewMember[]
  size?: 'sm' | 'md' | 'lg'
  max?: number
}) {
  if (!people.length) return null
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  return (
    <ul className={`avatar-stack size-${size}`} aria-label={people.map((p) => p.name).join(', ')}>
      {shown.map((who) => (
        <li key={who.id}>
          <Avatar person={who} size={size} />
        </li>
      ))}
      {extra > 0 && (
        <li>
          <span className="avatar-stack-more" title={people.slice(max).map((p) => p.name).join(', ')}>
            +{extra}
          </span>
        </li>
      )}
    </ul>
  )
}
