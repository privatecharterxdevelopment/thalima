import type { CalRole, Channel, CrewMember } from '../types'
import { channelsFor } from './chat'

export function canPlotRoute(user: CrewMember) {
  return user.level === 1 || user.role === 'captain'
}

export function visibleChannels(user: CrewMember) {
  return channelsFor(user)
}

export function canPost(user: CrewMember, channel: Channel) {
  if (channel.kind === 'all') return true
  return channel.memberIds?.includes(user.id) ?? false
}

export function canAdminCalendar(user: CrewMember) {
  return user.level === 1 || user.role === 'captain'
}

export function canEditCalendar(user: CrewMember, role: CalRole) {
  if (canAdminCalendar(user)) return true
  return user.role === role
}
