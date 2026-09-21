import type { CalEvent } from '../types'

export function monthDays(cursor: Date) {
  const y = cursor.getFullYear()
  const m = cursor.getMonth()
  const first = new Date(y, m, 1)
  const start = (first.getDay() + 6) % 7
  const count = new Date(y, m + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < start; i++) cells.push(null)
  for (let d = 1; d <= count; d++) cells.push(new Date(y, m, d))
  while (cells.length % 7) cells.push(null)
  return cells
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function eventsOnDay(events: CalEvent[], day: Date) {
  return events.filter((e) => sameDay(new Date(e.start), day))
}
