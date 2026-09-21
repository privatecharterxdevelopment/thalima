import { crew } from '../data/crew'
import type { Channel, ChatMessage, CrewMember } from '../types'

const JUNK_ROOMS = new Set(['bridge', 'engineering', 'interior', 'galley', 'deck'])

export function firstName(name: string) {
  return name.split(' ')[0]
}

export function dmChannelId(a: string, b: string) {
  return `dm-${[a, b].sort().join('-')}`
}

export function keepMessages(list: ChatMessage[] | undefined) {
  if (!list?.length) return []
  return list.filter((m) => !/^m\d+$/.test(m.id) && !JUNK_ROOMS.has(m.channelId))
}

export function channelsFor(user: CrewMember): Channel[] {
  return [
    { id: 'all', name: 'All crew', kind: 'all' },
    ...crew
      .filter((c) => c.id !== user.id)
      .map((c) => ({
        id: dmChannelId(user.id, c.id),
        name: c.name,
        kind: 'dm' as const,
        memberIds: [user.id, c.id],
      })),
  ]
}

export function otherInChannel(channel: Channel, me: string) {
  if (channel.kind !== 'dm') return null
  const id = channel.memberIds?.find((x) => x !== me)
  return crew.find((c) => c.id === id) ?? null
}

export function lastInChannel(messages: ChatMessage[], channelId: string) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].channelId === channelId) return messages[i]
  }
  return null
}

export function sortChats(channels: Channel[], messages: ChatMessage[]) {
  const at = (id: string) => {
    const last = lastInChannel(messages, id)
    return last ? new Date(last.at).getTime() : 0
  }
  const group = channels.filter((c) => c.kind === 'all')
  const dms = channels.filter((c) => c.kind !== 'all').sort((a, b) => at(b.id) - at(a.id) || a.name.localeCompare(b.name))
  return [...group, ...dms]
}
