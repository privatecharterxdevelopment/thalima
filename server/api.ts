import './env'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { IncomingMessage, ServerResponse } from 'node:http'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { crew as seedCrew } from '../src/data/crew'
import { parseStations } from '../src/lib/format'
import { opsFromUnknown } from '../src/lib/opsSync'
import { ensureOps, MAX_UPLOAD, putShared, readShared, readUpload, saveUpload } from './ops'
import { ownerFromBearer, publicProfile, supabaseAdmin, supabaseAdminReady } from './supabaseAdmin'
import { chatJobs, expenseJobs, sendJobs, taskJobs, type NotifyPayload } from './mail'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'data')
const DB_FILE = join(DATA, 'thalima.db')
const COOKIE = 'thalima_sid'

type UserRow = {
  id: string
  name: string
  title: string
  role: string
  department: string
  departments?: string
  level: number
  accounting: string
  initials: string
  watch: string
  email: string
  phone: string
  photo: string
  access: string
  active: number
  password_salt: string
  password_hash: string
  created_at: string
  updated_at: string
}

let db: DatabaseSync | null = null

function now() {
  return new Date().toISOString()
}

function uid(prefix: string) {
  return `${prefix}_${randomBytes(5).toString('hex')}`
}

function hashPassword(password: string, saltHex?: string) {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : randomBytes(16)
  const hash = scryptSync(password, salt, 32)
  return { salt: salt.toString('hex'), hash: hash.toString('hex') }
}

function checkPassword(password: string, saltHex: string, hashHex: string) {
  const got = hashPassword(password, saltHex)
  const a = Buffer.from(got.hash, 'hex')
  const b = Buffer.from(hashHex, 'hex')
  return a.length === b.length && timingSafeEqual(a, b)
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function publicUser(row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    role: row.role,
    department: row.department,
    departments: parseStations(row.departments, row.department as 'bridge'),
    level: row.level as 1 | 2 | 3,
    accounting: row.accounting,
    initials: row.initials,
    watch: row.watch,
    online: Boolean(row.active),
    email: row.email,
    phone: row.phone,
    photo: row.photo,
    access: row.access as 'owner' | 'crew',
    active: Boolean(row.active),
  }
}

function openDb() {
  if (db) return db
  mkdirSync(DATA, { recursive: true })
  db = new DatabaseSync(DB_FILE)
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;')
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      level INTEGER NOT NULL,
      accounting TEXT NOT NULL,
      initials TEXT NOT NULL,
      watch TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      photo TEXT NOT NULL,
      access TEXT NOT NULL DEFAULT 'crew',
      active INTEGER NOT NULL DEFAULT 1,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS activity (
      id TEXT PRIMARY KEY,
      at TEXT NOT NULL,
      actor_id TEXT,
      action TEXT NOT NULL,
      detail TEXT NOT NULL
    );
  `)
  seedIfEmpty(db)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN departments TEXT NOT NULL DEFAULT '[]'`)
  } catch {
    /* already present */
  }
  ensureOps(db)
  return db
}

function seedIfEmpty(database: DatabaseSync) {
  const count = database.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }
  if (count.n) return
  const at = now()
  const insert = database.prepare(`
    INSERT INTO users (
      id, name, title, role, department, level, accounting, initials, watch,
      email, phone, photo, access, active, password_salt, password_hash, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
  `)
  for (const person of seedCrew) {
    const password = person.name.split(' ')[0].toLowerCase()
    const { salt, hash } = hashPassword(password)
    insert.run(
      person.id,
      person.name,
      person.title,
      person.role,
      person.department,
      person.level,
      person.accounting,
      person.initials,
      person.watch,
      person.email,
      person.phone,
      person.photo,
      'crew',
      salt,
      hash,
      at,
      at,
    )
  }
  const owner = hashPassword('thalima')
  insert.run(
    'owner',
    'Owner',
    'Owner',
    'captain',
    'bridge',
    1,
    'captain',
    'OW',
    'Owner',
    'owner@thalima.com',
    '',
    '',
    'owner',
    owner.salt,
    owner.hash,
    at,
    at,
  )
  writeLog(database, null, 'seed', 'Database seeded with crew seats and owner.')
}

function writeLog(database: DatabaseSync, actorId: string | null, action: string, detail: string) {
  database
    .prepare('INSERT INTO activity (id, at, actor_id, action, detail) VALUES (?, ?, ?, ?, ?)')
    .run(uid('log'), now(), actorId, action, detail)
}

function cookie(req: IncomingMessage, name: string) {
  const raw = req.headers.cookie ?? ''
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('='))
  }
  return ''
}

function setCookie(res: ServerResponse, token: string, maxAge?: number) {
  const parts = [`${COOKIE}=${token}`, 'Path=/', 'HttpOnly', 'SameSite=Lax']
  if (maxAge != null) parts.push(`Max-Age=${maxAge}`)
  res.setHeader('Set-Cookie', parts.join('; '))
}

function clearCookie(res: ServerResponse) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
}

async function readJson(req: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) return {}
  return JSON.parse(raw) as Record<string, unknown>
}

function send(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(json)
}

function sessionUser(database: DatabaseSync, req: IncomingMessage) {
  const token = cookie(req, COOKIE)
  if (!token) return null
  const row = database.prepare(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > ?`,
  ).get(token, now()) as UserRow | undefined
  return row ?? null
}

function requireUser(database: DatabaseSync, req: IncomingMessage, res: ServerResponse) {
  const user = sessionUser(database, req)
  if (!user || !user.active) {
    send(res, 401, { error: 'Sign in required.' })
    return null
  }
  return user
}

function requireOwner(database: DatabaseSync, req: IncomingMessage, res: ServerResponse) {
  const user = requireUser(database, req, res)
  if (!user) return null
  if (user.access !== 'owner' && user.level !== 1) {
    send(res, 403, { error: 'Admin access only.' })
    return null
  }
  return user
}

export async function handleApi(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const path = url.pathname
  const method = req.method ?? 'GET'
  try {
    const database = openDb()

    if (method === 'POST' && path === '/api/notify') {
      const header = String(req.headers.authorization ?? '')
      const token = header.startsWith('Bearer ') ? header.slice(7) : ''
      let signedIn = Boolean(sessionUser(database, req))
      if (!signedIn && supabaseAdminReady() && token) {
        const { data } = await supabaseAdmin().auth.getUser(token)
        signedIn = Boolean(data.user)
      }
      if (!signedIn) {
        send(res, 401, { error: 'Sign in required.' })
        return
      }
      const body = (await readJson(req)) as NotifyPayload
      if (!body || (body.kind !== 'task' && body.kind !== 'expense' && body.kind !== 'chat')) {
        send(res, 400, { error: 'Invalid notification.' })
        return
      }
      const jobs =
        body.kind === 'expense' ? await expenseJobs(body) : body.kind === 'chat' ? await chatJobs(body) : await taskJobs(body)
      const sent = await sendJobs(jobs)
      send(res, 200, { ok: true, sent: sent.length })
      return
    }

    if (supabaseAdminReady() && method === 'POST' && path === '/api/users') {
      const actor = await ownerFromBearer(req)
      if (!actor) {
        send(res, 403, { error: 'Admin access only.' })
        return
      }
      const body = await readJson(req)
      const name = String(body.name ?? '').trim()
      const email = String(body.email ?? '').trim().toLowerCase()
      const password = String(body.password ?? '')
      const title = String(body.title ?? '').trim()
      if (!name || !email || password.length < 6 || !title) {
        send(res, 400, { error: 'Name, email, title and a password of at least 6 characters are required.' })
        return
      }
      const stations = parseStations(body.departments ?? body.department, 'deck')
      const admin = supabaseAdmin()
      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
      if (error || !created.user) {
        send(res, 400, { error: error?.message || 'Could not create user.' })
        return
      }
      const id = uid('u')
      const row = {
        id,
        auth_id: created.user.id,
        name,
        title,
        role: String(body.role ?? 'deckhand'),
        department: stations[0],
        departments: stations,
        level: body.level === 1 || body.level === 2 ? body.level : 3,
        accounting: String(body.accounting ?? 'none'),
        initials: initialsOf(name),
        watch: String(body.watch ?? '').trim(),
        email,
        phone: String(body.phone ?? '').trim(),
        photo: '',
        access: actor.profile.access === 'owner' && body.access === 'owner' ? 'owner' : 'crew',
        active: true,
        updated_at: now(),
      }
      let { error: insertErr } = await admin.from('profiles').insert(row)
      if (insertErr && /departments/i.test(insertErr.message)) {
        const { departments: _drop, ...rest } = row
        const retry = await admin.from('profiles').insert(rest)
        insertErr = retry.error
      }
      if (insertErr) {
        send(res, 400, { error: insertErr.message })
        return
      }
      await admin.from('activity').insert({
        id: uid('log'),
        at: now(),
        actor_id: actor.profile.id,
        action: 'user_create',
        detail: `Created ${name} <${email}> as ${title}`,
      })
      send(res, 201, { user: publicProfile(row) })
      return
    }

    const cloudPatch = path.match(/^\/api\/users\/([^/]+)$/)
    if (supabaseAdminReady() && method === 'PATCH' && cloudPatch) {
      const actor = await ownerFromBearer(req)
      if (!actor) {
        send(res, 403, { error: 'Admin access only.' })
        return
      }
      const id = decodeURIComponent(cloudPatch[1])
      const admin = supabaseAdmin()
      const { data: target } = await admin.from('profiles').select('*').eq('id', id).maybeSingle()
      if (!target) {
        send(res, 404, { error: 'User not found.' })
        return
      }
      if (actor.profile.access !== 'owner' && target.access === 'owner') {
        send(res, 403, { error: 'Only the master admin can edit that seat.' })
        return
      }
      const body = await readJson(req)
      const next = { ...target }
      if (typeof body.name === 'string' && body.name.trim()) {
        next.name = body.name.trim()
        next.initials = initialsOf(next.name)
      }
      if (typeof body.title === 'string') next.title = body.title.trim()
      if (typeof body.role === 'string') next.role = body.role
      if (body.departments != null || typeof body.department === 'string') {
        const stations = parseStations(body.departments ?? body.department, next.department)
        next.department = stations[0]
        next.departments = stations
      }
      if (body.level === 1 || body.level === 2 || body.level === 3) next.level = body.level
      if (typeof body.accounting === 'string') next.accounting = body.accounting
      if (typeof body.phone === 'string') next.phone = body.phone.trim()
      if (typeof body.watch === 'string') next.watch = body.watch.trim()
      if (actor.profile.access === 'owner' && (body.access === 'owner' || body.access === 'crew')) {
        next.access = body.access
      }
      if (typeof body.active === 'boolean') {
        if (id === actor.profile.id && body.active === false) {
          send(res, 400, { error: 'You cannot deactivate your own seat.' })
          return
        }
        next.active = body.active
      }
      next.updated_at = now()
      if (typeof body.password === 'string' && body.password) {
        if (body.password.length < 6) {
          send(res, 400, { error: 'Password must be at least 6 characters.' })
          return
        }
        if (target.auth_id) {
          const { error } = await admin.auth.admin.updateUserById(target.auth_id, { password: body.password })
          if (error) {
            send(res, 400, { error: error.message })
            return
          }
        }
      }
      if (target.auth_id && next.active === false) {
        await admin.auth.admin.updateUserById(target.auth_id, { ban_duration: '876000h' })
      }
      let { error } = await admin.from('profiles').update(next).eq('id', id)
      if (error && /departments/i.test(error.message)) {
        const { departments: _drop, ...rest } = next
        const retry = await admin.from('profiles').update(rest).eq('id', id)
        error = retry.error
      }
      if (error) {
        send(res, 400, { error: error.message })
        return
      }
      await admin.from('activity').insert({
        id: uid('log'),
        at: now(),
        actor_id: actor.profile.id,
        action: next.active !== target.active ? (next.active ? 'user_activate' : 'user_deactivate') : 'user_update',
        detail: next.active !== target.active
          ? `${next.active ? 'Activated' : 'Deactivated'} ${next.name}`
          : body.password
            ? `Reset password for ${next.name}`
            : `Updated ${next.name}`,
      })
      send(res, 200, { user: publicProfile(next) })
      return
    }

    if (method === 'POST' && path === '/api/auth/login') {
      const body = await readJson(req)
      const email = String(body.email ?? '').trim().toLowerCase()
      const password = String(body.password ?? '')
      const remember = Boolean(body.remember)
      const user = database.prepare('SELECT * FROM users WHERE lower(email) = ?').get(email) as UserRow | undefined
      if (!user || !user.active || !checkPassword(password, user.password_salt, user.password_hash)) {
        writeLog(database, user?.id ?? null, 'login_failed', `Failed sign-in for ${email || 'unknown'}`)
        send(res, 401, { error: 'Wrong email or password.' })
        return
      }
      const token = randomBytes(24).toString('hex')
      const days = remember ? 30 : 1
      const expires = new Date(Date.now() + days * 86400_000).toISOString()
      database.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
        token,
        user.id,
        now(),
        expires,
      )
      setCookie(res, token, remember ? 30 * 86400 : undefined)
      writeLog(database, user.id, 'login', `Signed in as ${user.name}`)
      send(res, 200, { user: publicUser(user) })
      return
    }

    if (method === 'POST' && path === '/api/auth/logout') {
      const token = cookie(req, COOKIE)
      const user = sessionUser(database, req)
      if (token) database.prepare('DELETE FROM sessions WHERE token = ?').run(token)
      if (user) writeLog(database, user.id, 'logout', `Signed out ${user.name}`)
      clearCookie(res)
      send(res, 200, { ok: true })
      return
    }

    if (method === 'GET' && path === '/api/auth/me') {
      const user = sessionUser(database, req)
      if (!user || !user.active) {
        send(res, 401, { error: 'Sign in required.' })
        return
      }
      send(res, 200, { user: publicUser(user) })
      return
    }

    if (method === 'GET' && path === '/api/users') {
      const user = requireUser(database, req, res)
      if (!user) return
      const all = (user.access === 'owner' || user.level === 1) && url.searchParams.get('all') === '1'
      const rows = (
        all
          ? database.prepare('SELECT * FROM users ORDER BY level ASC, name ASC').all()
          : database.prepare('SELECT * FROM users WHERE active = 1 ORDER BY level ASC, name ASC').all()
      ) as UserRow[]
      send(res, 200, { users: rows.map(publicUser) })
      return
    }

    if (method === 'POST' && path === '/api/users') {
      const actor = requireOwner(database, req, res)
      if (!actor) return
      const body = await readJson(req)
      const name = String(body.name ?? '').trim()
      const email = String(body.email ?? '').trim().toLowerCase()
      const password = String(body.password ?? '')
      const title = String(body.title ?? '').trim()
      const role = String(body.role ?? 'deckhand')
      const stations = parseStations(body.departments ?? body.department, 'deck')
      const department = stations[0]
      const level = Number(body.level ?? 3)
      const accounting = String(body.accounting ?? 'none')
      const phone = String(body.phone ?? '').trim()
      const watch = String(body.watch ?? '').trim()
      const access = actor.access === 'owner' && body.access === 'owner' ? 'owner' : 'crew'
      if (!name || !email || password.length < 6 || !title) {
        send(res, 400, { error: 'Name, email, title and a password of at least 6 characters are required.' })
        return
      }
      const exists = database.prepare('SELECT id FROM users WHERE lower(email) = ?').get(email)
      if (exists) {
        send(res, 409, { error: 'That email is already on board.' })
        return
      }
      const id = uid('u')
      const { salt, hash } = hashPassword(password)
      const at = now()
      database.prepare(`
        INSERT INTO users (
          id, name, title, role, department, departments, level, accounting, initials, watch,
          email, phone, photo, access, active, password_salt, password_hash, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, 1, ?, ?, ?, ?)
      `).run(
        id,
        name,
        title,
        role,
        department,
        JSON.stringify(stations),
        level === 1 || level === 2 ? level : 3,
        accounting,
        initialsOf(name),
        watch,
        email,
        phone,
        access,
        salt,
        hash,
        at,
        at,
      )
      writeLog(database, actor.id, 'user_create', `Created ${name} <${email}> as ${title}`)
      const row = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow
      send(res, 201, { user: publicUser(row) })
      return
    }

    const patch = path.match(/^\/api\/users\/([^/]+)$/)
    if (method === 'PATCH' && patch) {
      const actor = requireOwner(database, req, res)
      if (!actor) return
      const id = decodeURIComponent(patch[1])
      const target = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
      if (!target) {
        send(res, 404, { error: 'User not found.' })
        return
      }
      if (actor.access !== 'owner' && target.access === 'owner') {
        send(res, 403, { error: 'Only the master admin can edit that seat.' })
        return
      }
      const body = await readJson(req)
      const next = { ...target }
      if (typeof body.name === 'string' && body.name.trim()) {
        next.name = body.name.trim()
        next.initials = initialsOf(next.name)
      }
      if (typeof body.title === 'string') next.title = body.title.trim()
      if (typeof body.role === 'string') next.role = body.role
      if (body.departments != null || typeof body.department === 'string') {
        const stations = parseStations(body.departments ?? body.department, next.department as 'deck')
        next.department = stations[0]
        next.departments = JSON.stringify(stations)
      }
      if (body.level === 1 || body.level === 2 || body.level === 3) next.level = body.level
      if (typeof body.accounting === 'string') next.accounting = body.accounting
      if (typeof body.phone === 'string') next.phone = body.phone.trim()
      if (typeof body.watch === 'string') next.watch = body.watch.trim()
      if (actor.access === 'owner' && (body.access === 'owner' || body.access === 'crew')) {
        next.access = body.access
      }
      if (typeof body.active === 'boolean') {
        if (id === actor.id && body.active === false) {
          send(res, 400, { error: 'You cannot deactivate your own seat.' })
          return
        }
        next.active = body.active ? 1 : 0
      }
      if (typeof body.password === 'string' && body.password) {
        if (body.password.length < 6) {
          send(res, 400, { error: 'Password must be at least 6 characters.' })
          return
        }
        const { salt, hash } = hashPassword(body.password)
        next.password_salt = salt
        next.password_hash = hash
      }
      next.updated_at = now()
      database.prepare(`
        UPDATE users SET
          name = ?, title = ?, role = ?, department = ?, departments = ?, level = ?, accounting = ?,
          initials = ?, watch = ?, phone = ?, access = ?, active = ?,
          password_salt = ?, password_hash = ?, updated_at = ?
        WHERE id = ?
      `).run(
        next.name,
        next.title,
        next.role,
        next.department,
        next.departments ?? JSON.stringify(parseStations(undefined, next.department as 'deck')),
        next.level,
        next.accounting,
        next.initials,
        next.watch,
        next.phone,
        next.access,
        next.active,
        next.password_salt,
        next.password_hash,
        next.updated_at,
        id,
      )
      if (!next.active) database.prepare('DELETE FROM sessions WHERE user_id = ?').run(id)
      const detail = next.active !== target.active
        ? `${next.active ? 'Activated' : 'Deactivated'} ${next.name}`
        : body.password
          ? `Reset password for ${next.name}`
          : `Updated ${next.name}`
      writeLog(database, actor.id, next.active !== target.active ? (next.active ? 'user_activate' : 'user_deactivate') : 'user_update', detail)
      const row = database.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow
      send(res, 200, { user: publicUser(row) })
      return
    }

    if (method === 'GET' && path === '/api/activity') {
      const actor = requireOwner(database, req, res)
      if (!actor) return
      const action = url.searchParams.get('action') ?? ''
      const rows = (
        action
          ? database.prepare('SELECT * FROM activity WHERE action = ? ORDER BY at DESC LIMIT 300').all(action)
          : database.prepare('SELECT * FROM activity ORDER BY at DESC LIMIT 300').all()
      ) as { id: string; at: string; actor_id: string | null; action: string; detail: string }[]
      const names = new Map(
        (database.prepare('SELECT id, name FROM users').all() as { id: string; name: string }[]).map((u) => [u.id, u.name]),
      )
      send(
        res,
        200,
        {
          logs: rows.map((row) => ({
            ...row,
            actor: row.actor_id ? names.get(row.actor_id) ?? row.actor_id : 'System',
          })),
        },
      )
      return
    }

    if (method === 'GET' && path === '/api/ops') {
      const actor = requireUser(database, req, res)
      if (!actor) return
      const current = readShared(database)
      const since = Number(url.searchParams.get('rev') ?? 0)
      if (since && since === current.revision) {
        send(res, 200, { unchanged: true, revision: current.revision, updatedAt: current.updatedAt })
        return
      }
      send(res, 200, { revision: current.revision, updatedAt: current.updatedAt, ...current.state })
      return
    }

    if (method === 'PUT' && path === '/api/ops') {
      const actor = requireUser(database, req, res)
      if (!actor) return
      const body = await readJson(req)
      const incoming = opsFromUnknown(body)
      if (!incoming) {
        send(res, 400, { error: 'Invalid ops payload.' })
        return
      }
      const deleted = body.deleted && typeof body.deleted === 'object' ? (body.deleted as Record<string, string[]>) : undefined
      const saved = putShared(database, incoming, deleted, body.replace === true)
      send(res, 200, { revision: saved.revision, updatedAt: saved.updatedAt, ...saved.state })
      return
    }

    if (method === 'POST' && path === '/api/files') {
      const actor = requireUser(database, req, res)
      if (!actor) return
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of req) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        size += buf.length
        if (size > MAX_UPLOAD) {
          send(res, 413, { error: 'File is too large. Max 12 MB.' })
          return
        }
        chunks.push(buf)
      }
      const nameHeader = String(req.headers['x-file-name'] ?? '')
      const typeHeader = String(req.headers['x-file-type'] ?? req.headers['content-type'] ?? '')
      const name = decodeURIComponent(nameHeader).replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 180) || 'file'
      const type = typeHeader.split(';')[0].trim() || 'application/octet-stream'
      if (!chunks.length) {
        send(res, 400, { error: 'Empty file.' })
        return
      }
      const file = saveUpload(database, {
        id: uid('f'),
        name,
        type,
        body: Buffer.concat(chunks),
        createdBy: actor.id,
      })
      send(res, 201, { file })
      return
    }

    const fileGet = path.match(/^\/api\/files\/([^/]+)$/)
    if (method === 'GET' && fileGet) {
      const actor = requireUser(database, req, res)
      if (!actor) return
      const file = readUpload(database, decodeURIComponent(fileGet[1]))
      if (!file) {
        send(res, 404, { error: 'File not found.' })
        return
      }
      res.statusCode = 200
      res.setHeader('Content-Type', file.type || 'application/octet-stream')
      res.setHeader('Content-Length', String(file.body.length))
      res.setHeader('Cache-Control', 'private, max-age=31536000')
      res.setHeader(
        'Content-Disposition',
        `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      )
      res.end(file.body)
      return
    }

    if (method === 'POST' && path === '/api/activity') {
      const actor = requireUser(database, req, res)
      if (!actor) return
      const body = await readJson(req)
      const action = String(body.action ?? '').trim().slice(0, 40)
      const detail = String(body.detail ?? '').trim().slice(0, 400)
      if (!action || !detail) {
        send(res, 400, { error: 'Action and detail are required.' })
        return
      }
      const allowed = new Set([
        'task_create',
        'expense_submit',
        'expense_approve',
        'expense_reject',
        'deck_log',
        'roster_decide',
      ])
      if (!allowed.has(action)) {
        send(res, 400, { error: 'Unknown activity.' })
        return
      }
      writeLog(database, actor.id, action, detail)
      send(res, 201, { ok: true })
      return
    }

    send(res, 404, { error: 'Not found.' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Server error'
    send(res, 500, { error: message })
  }
}
