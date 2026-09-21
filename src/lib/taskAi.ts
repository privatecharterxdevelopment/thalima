import { crew } from '../data/crew'
import type { CrewMember, Department, Urgency } from '../types'

export type TaskDraft = {
  title: string
  body: string
  department: Department
  assigneeId: string
  assigneeIds: string[]
  urgency: Urgency
  due: string
}

const roleWords: { match: RegExp; id: string }[] = [
  { match: /\b(eddy|max|captain|master|command)\b/i, id: 'eddy' },
  { match: /\b(marco|engineer|engineering|plant)\b/i, id: 'marco' },
  { match: /\b(sofia|stew|stewardess|interior|house|cabin)\b/i, id: 'sofia' },
  { match: /\b(julien|chef|galley|cook|provision)\b/i, id: 'julien' },
  { match: /\b(luca|bosun|deck|tender)\b/i, id: 'luca' },
]

function todayAt(hour: number, minute = 0) {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  if (d.getTime() < Date.now() - 60_000) d.setDate(d.getDate() + 1)
  return d.toISOString()
}

function parseDue(text: string) {
  const ampm = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i)
  if (ampm) {
    let hour = Number(ampm[1])
    const minute = Number(ampm[2] ?? 0)
    const ap = ampm[3].toLowerCase()
    if (ap === 'pm' && hour < 12) hour += 12
    if (ap === 'am' && hour === 12) hour = 0
    return todayAt(hour, minute)
  }
  const clock = text.match(/\b(\d{1,2})[:.](\d{2})\b/)
  if (clock) return todayAt(Number(clock[1]), Number(clock[2]))
  if (/\bemergency|asap|immediately|now\b/i.test(text)) return new Date(Date.now() + 20 * 60_000).toISOString()
  if (/\blunch\b/i.test(text)) return todayAt(13, 0)
  if (/\bmorning|brief\b/i.test(text)) return todayAt(8, 0)
  if (/\btonight|turndown|dinner\b/i.test(text)) return todayAt(20, 30)
  if (/\bafternoon\b/i.test(text)) return todayAt(16, 0)
  return new Date(Date.now() + 3 * 3600_000).toISOString()
}

function parseUrgency(text: string): Urgency {
  if (/\bemergency|mayday|flood|fire|abandon\b/i.test(text)) return 'emergency'
  if (/\basap|immediately|now|urgent|today\b/i.test(text)) return 'now'
  if (/\bsoon|before|by \d|tonight|this afternoon\b/i.test(text)) return 'soon'
  return 'soon'
}

function parseAssignees(text: string, user: CrewMember): CrewMember[] {
  if (/\b(all crew|everyone|whole crew|all hands)\b/i.test(text)) return [...crew]
  const found: CrewMember[] = []
  const lower = text.toLowerCase()
  for (const c of crew) {
    if (lower.includes(c.name.split(' ')[0].toLowerCase()) && !found.some((f) => f.id === c.id)) found.push(c)
  }
  for (const row of roleWords) {
    if (!row.match.test(text)) continue
    const who = crew.find((c) => c.id === row.id)
    if (who && !found.some((f) => f.id === who.id)) found.push(who)
  }
  if (found.length) return found
  if (user.level === 1) return [crew.find((c) => c.id === 'luca') ?? user]
  return [user]
}

function parseTitle(text: string) {
  const cut = text.split(/[.!\n]/)[0]?.trim() ?? text.trim()
  const names = crew.map((c) => c.name.split(' ')[0]).join('|')
  const cleaned = cut
    .replace(/^(please|can you|need to|ask|tell)\s+/i, '')
    .replace(new RegExp(`^(${names})(,\\s*|\\s+and\\s+|\\s+&\\s+)*`, 'i'), '')
    .replace(new RegExp(`^(${names})[,:]?\\s+`, 'i'), '')
  return cleaned.slice(0, 72) || 'New task'
}

export function draftFromPrompt(text: string, user: CrewMember): TaskDraft {
  const people = parseAssignees(text, user)
  const due = parseDue(text)
  const title = parseTitle(text)
  const ids = people.map((p) => p.id)
  return {
    title,
    body: text.trim(),
    department: people[0]?.department ?? user.department,
    assigneeId: ids[0] ?? user.id,
    assigneeIds: ids,
    urgency: parseUrgency(text),
    due,
  }
}

export function dueInputValue(iso: string) {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}
