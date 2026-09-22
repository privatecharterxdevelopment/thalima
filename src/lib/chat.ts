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
  return list
    .filter((m) => Boolean(m?.id && m.channelId && m.text) && !/^m\d+$/.test(m.id) && !JUNK_ROOMS.has(m.channelId))
    .sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
}

export function channelsFor(user: CrewMember): Channel[] {
  return [
    { id: 'all', name: 'All crew', kind: 'all' },
    ...crew
      .filter((c) => c.id !== user.id && c.active !== false)
      .map((c) => ({
        id: dmChannelId(user.id, c.id),
        name: c.name,
        kind: 'dm' as const,
        memberIds: [user.id, c.id],
      })),
  ]
}

export function canSeeChannel(user: CrewMember, channelId: string) {
  return channelsFor(user).some((c) => c.id === channelId)
}

export function chatRecipients(channelId: string, fromId: string): string[] {
  if (channelId === 'all') {
    return crew.filter((c) => c.id !== fromId && c.active !== false).map((c) => c.id)
  }
  for (const c of crew) {
    if (c.id === fromId || c.active === false) continue
    if (dmChannelId(fromId, c.id) === channelId) return [c.id]
  }
  return []
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
