import type { CrewMember } from './types'
import { hello } from './lib/format'

export type AppLink = {
  to: string
  end?: boolean
  label: string
}

/** Surfaces the crew actually uses. Poster pages stay off the rail. */
export const appLinks: AppLink[] = [
  { to: '/app', end: true, label: 'Home' },
  { to: '/board', label: 'Tasks' },
  { to: '/calendar', label: 'Diary' },
  { to: '/position', label: 'Location' },
  { to: '/messages', label: 'Chat' },
  { to: '/notifications', label: 'Notifications' },
  { to: '/crew', label: 'Crew' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/maintenance', label: 'Maintenance' },
  { to: '/accounting', label: 'Accounting' },
  { to: '/cloud', label: 'Cloud' },
  { to: '/log', label: 'Log' },
]

export function menuFor(user: CrewMember) {
  if (user.access === 'owner' || user.level === 1) return [...appLinks, { to: '/admin', label: 'Admin' }]
  return appLinks
}

export function titleFor(pathname: string, first: string) {
  if (pathname === '/app') return hello(first)
  if (pathname.startsWith('/admin')) return 'Admin'
  const match = [...appLinks]
    .filter((l) => l.to !== '/')
    .sort((a, b) => b.to.length - a.to.length)
    .find((l) => pathname === l.to || pathname.startsWith(`${l.to}/`))
  if (match) return match.label
  if (pathname.startsWith('/new')) return 'New task'
  if (pathname.startsWith('/weather')) return 'Weather'
  return first
}
