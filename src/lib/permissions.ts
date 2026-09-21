import type { CalRole, Channel, CrewMember } from '../types'

export function canPlotRoute(user: CrewMember) {
  return user.level === 1 || user.role === 'captain'
}

export function visibleChannels(user: CrewMember, all: Channel[]) {
  return all.filter((ch) => {
    if (ch.kind === 'all') return true
    if (ch.kind === 'department') {
      if (user.level === 1) return true
      return ch.department === user.department || ch.department === 'bridge'
    }
    return ch.memberIds?.includes(user.id) ?? false
  })
}

export function canPost(user: CrewMember, channel: Channel) {
  if (channel.kind === 'all') return true
  if (channel.kind === 'department') {
    if (user.level === 1) return true
    return channel.department === user.department
  }
  return channel.memberIds?.includes(user.id) ?? false
}

export function canAdminCalendar(user: CrewMember) {
  return user.level === 1 || user.role === 'captain'
}

export function canEditCalendar(user: CrewMember, role: CalRole) {
  if (canAdminCalendar(user)) return true
  return user.role === role
}
