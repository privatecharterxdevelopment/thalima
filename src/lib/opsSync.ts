import type { AppSnapshot, OpsState } from '../types'
import { keepMessages } from './chat'

export type SharedOps = Pick<
  AppSnapshot,
  | 'tasks'
  | 'messages'
  | 'log'
  | 'events'
  | 'systems'
  | 'lastRead'
  | 'seenNotices'
  | 'dismissedEmergencies'
  | 'docs'
  | 'ops'
  | 'expenses'
  | 'roster'
>

export type DeletedIds = Partial<
  Record<
    | 'tasks'
    | 'messages'
    | 'log'
    | 'events'
    | 'docs'
    | 'expenses'
    | 'roster'
    | keyof OpsState,
    string[]
  >
>

export function pickOps(snap: SharedOps | AppSnapshot): SharedOps {
  return {
    tasks: snap.tasks,
    messages: snap.messages,
    log: snap.log,
    events: snap.events,
    systems: snap.systems,
    lastRead: snap.lastRead,
    seenNotices: snap.seenNotices,
    dismissedEmergencies: snap.dismissedEmergencies,
    docs: snap.docs,
    ops: snap.ops,
    expenses: snap.expenses,
    roster: snap.roster,
  }
}

export function opsFromUnknown(raw: Record<string, unknown>): SharedOps | null {
  if (!Array.isArray(raw.tasks) || !raw.ops || typeof raw.ops !== 'object') return null
  return {
    tasks: raw.tasks as SharedOps['tasks'],
    messages: (raw.messages as SharedOps['messages']) ?? [],
    log: (raw.log as SharedOps['log']) ?? [],
    events: (raw.events as SharedOps['events']) ?? [],
    systems: raw.systems as SharedOps['systems'],
    lastRead: (raw.lastRead as SharedOps['lastRead']) ?? {},
    seenNotices: (raw.seenNotices as SharedOps['seenNotices']) ?? {},
    dismissedEmergencies: (raw.dismissedEmergencies as SharedOps['dismissedEmergencies']) ?? {},
    docs: (raw.docs as SharedOps['docs']) ?? [],
    ops: raw.ops as OpsState,
    expenses: (raw.expenses as SharedOps['expenses']) ?? [],
    roster: (raw.roster as SharedOps['roster']) ?? [],
  }
}

type IdRow = { id: string }

function mergeList<T extends IdRow>(current: T[] | undefined, incoming: T[] | undefined, deleted?: string[]): T[] {
  const drop = new Set(deleted ?? [])
  if (!incoming) return (current ?? []).filter((row) => !drop.has(row.id))
  const have = new Set(incoming.map((row) => row.id))
  const extras = (current ?? []).filter((row) => !have.has(row.id) && !drop.has(row.id))
  return [...incoming.filter((row) => !drop.has(row.id)), ...extras]
}

function mergeMap(current: Record<string, string> | undefined, incoming: Record<string, string> | undefined) {
  return { ...(current ?? {}), ...(incoming ?? {}) }
}

function mergeOpsState(current: OpsState, incoming: OpsState | undefined, deleted: DeletedIds | undefined): OpsState {
  const src = incoming ?? current
  return {
    equipment: mergeList(current.equipment, src.equipment, deleted?.equipment),
    services: mergeList(current.services, src.services, deleted?.services),
    defects: mergeList(current.defects, src.defects, deleted?.defects),
    spares: mergeList(current.spares, src.spares, deleted?.spares),
    certificates: mergeList(current.certificates, src.certificates, deleted?.certificates),
    leave: mergeList(current.leave, src.leave, deleted?.leave),
    handovers: mergeList(current.handovers, src.handovers, deleted?.handovers),
    provisions: mergeList(current.provisions, src.provisions, deleted?.provisions),
    purchases: mergeList(current.purchases, src.purchases, deleted?.purchases),
    contacts: mergeList(current.contacts, src.contacts, deleted?.contacts),
    drills: mergeList(current.drills, src.drills, deleted?.drills),
    trips: mergeList(current.trips, src.trips, deleted?.trips),
    stock: mergeList(current.stock, src.stock, deleted?.stock),
  }
}

export function mergeShared(current: SharedOps, incoming: SharedOps, deleted?: DeletedIds): SharedOps {
  return {
    tasks: mergeList(current.tasks, incoming.tasks, deleted?.tasks),
    messages: keepMessages(mergeList(current.messages, incoming.messages, deleted?.messages)),
    log: mergeList(current.log, incoming.log, deleted?.log),
    events: mergeList(current.events, incoming.events, deleted?.events),
    systems: incoming.systems ?? current.systems,
    lastRead: mergeMap(current.lastRead, incoming.lastRead),
    seenNotices: mergeMap(current.seenNotices, incoming.seenNotices),
    dismissedEmergencies: mergeMap(current.dismissedEmergencies, incoming.dismissedEmergencies),
    docs: mergeList(current.docs, incoming.docs, deleted?.docs),
    ops: mergeOpsState(current.ops, incoming.ops, deleted),
    expenses: mergeList(current.expenses, incoming.expenses, deleted?.expenses),
    roster: mergeList(current.roster, incoming.roster, deleted?.roster),
  }
}
