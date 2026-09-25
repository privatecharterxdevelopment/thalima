import { systemsSeed } from './crew'
import { opsSeed } from './ops'
import { expensesSeed } from './accounting'
import { rosterSeed } from './roster'
import type { AppSnapshot } from '../types'

/** Empty live board — no demo tasks, chat, or example guests. */
export function seed(): AppSnapshot {
  return {
    userId: null,
    theme: 'light',
    tasks: [],
    messages: [],
    log: [],
    events: [],
    docs: [],
    ops: opsSeed(),
    systems: { ...systemsSeed },
    lastRead: {},
    seenNotices: {},
    dismissedEmergencies: {},
    weather: null,
    expenses: expensesSeed(),
    roster: rosterSeed(),
  }
}
