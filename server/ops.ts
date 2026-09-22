import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { seed } from '../src/data/seed'
import { keepMessages } from '../src/lib/chat'
import { opsFromUnknown, pickOps, type DeletedIds, type SharedOps } from '../src/lib/opsSync'
import type { OpsState } from '../src/types'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const UPLOADS = join(ROOT, 'data', 'uploads')

export const MAX_UPLOAD = 12 * 1024 * 1024

type IdRow = { id: string }

function now() {
  return new Date().toISOString()
}

function emptyOps(): SharedOps {
  const base = seed()
  return {
    ...pickOps(base),
    messages: keepMessages(base.messages),
  }
}

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

function mergeShared(current: SharedOps, incoming: SharedOps, deleted?: DeletedIds): SharedOps {
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

export function ensureOps(db: DatabaseSync) {
  mkdirSync(UPLOADS, { recursive: true })
  db.exec(`
    CREATE TABLE IF NOT EXISTS ops (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      revision INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      size INTEGER NOT NULL,
      path TEXT NOT NULL,
      created_by TEXT,
      created_at TEXT NOT NULL
    );
  `)
  const row = db.prepare('SELECT id FROM ops WHERE id = 1').get()
  if (!row) {
    db.prepare('INSERT INTO ops (id, payload, revision, updated_at) VALUES (1, ?, 1, ?)').run(
      JSON.stringify(emptyOps()),
      now(),
    )
  }
}

export function readShared(db: DatabaseSync): { revision: number; updatedAt: string; state: SharedOps } {
  const row = db.prepare('SELECT payload, revision, updated_at FROM ops WHERE id = 1').get() as
    | { payload: string; revision: number; updated_at: string }
    | undefined
  if (!row) {
    ensureOps(db)
    return readShared(db)
  }
  const parsed = opsFromUnknown(JSON.parse(row.payload) as Record<string, unknown>)
  return {
    revision: row.revision,
    updatedAt: row.updated_at,
    state: parsed ?? emptyOps(),
  }
}

export function putShared(
  db: DatabaseSync,
  incoming: SharedOps,
  deleted: DeletedIds | undefined,
  replace: boolean,
) {
  db.exec('BEGIN')
  try {
    const current = readShared(db)
    const state = replace ? incoming : mergeShared(current.state, incoming, deleted)
    const revision = current.revision + 1
    const updatedAt = now()
    db.prepare('UPDATE ops SET payload = ?, revision = ?, updated_at = ? WHERE id = 1').run(
      JSON.stringify(state),
      revision,
      updatedAt,
    )
    db.exec('COMMIT')
    return { revision, updatedAt, state }
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

export function saveUpload(
  db: DatabaseSync,
  input: { id: string; name: string; type: string; body: Buffer; createdBy: string },
) {
  mkdirSync(UPLOADS, { recursive: true })
  const path = join(UPLOADS, input.id)
  writeFileSync(path, input.body)
  db.prepare(
    'INSERT INTO files (id, name, type, size, path, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(input.id, input.name, input.type, input.body.length, path, input.createdBy, now())
  return {
    id: input.id,
    name: input.name,
    type: input.type,
    size: input.body.length,
    dataUrl: `/api/files/${input.id}`,
  }
}

export function readUpload(db: DatabaseSync, id: string) {
  const row = db.prepare('SELECT id, name, type, size, path FROM files WHERE id = ?').get(id) as
    | { id: string; name: string; type: string; size: number; path: string }
    | undefined
  if (!row) return null
  return { ...row, body: readFileSync(row.path) }
}
