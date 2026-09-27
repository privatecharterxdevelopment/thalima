import { seed } from '../data/seed'
import { keepMessages } from './chat'
import { mergeShared, opsFromUnknown, pickOps, type DeletedIds, type SharedOps } from './opsSync'
import { parseStations } from './format'
import { supabase } from './supabase'
import type { CrewMember } from '../types'

export type LiveUser = CrewMember & {
  access: 'owner' | 'crew'
  active: boolean
}

export type ActivityRow = {
  id: string
  at: string
  actor_id: string | null
  actor: string
  action: string
  detail: string
}

type ProfileRow = {
  id: string
  auth_id: string | null
  name: string
  title: string
  role: string
  department: string
  departments?: string[] | string | null
  level: number
  accounting: string
  initials: string
  watch: string
  email: string
  phone: string
  photo: string
  access: 'owner' | 'crew'
  active: boolean
  created_at?: string | null
}

function asUser(row: ProfileRow): LiveUser {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    role: row.role as LiveUser['role'],
    department: row.department as LiveUser['department'],
    departments: parseStations(row.departments, row.department as LiveUser['department']),
    level: (row.level === 1 || row.level === 2 ? row.level : 3) as 1 | 2 | 3,
    accounting: row.accounting as LiveUser['accounting'],
    initials: row.initials,
    watch: row.watch,
    online: row.active,
    email: row.email,
    phone: row.phone,
    photo: row.photo,
    access: row.access,
    active: row.active,
    joinedAt: row.created_at || undefined,
  }
}

async function requireProfile() {
  const { data: session } = await supabase.auth.getSession()
  const authId = session.session?.user.id
  if (!authId) throw new Error('Sign in required.')
  const { data, error } = await supabase.from('profiles').select('*').eq('auth_id', authId).maybeSingle()
  if (error || !data) throw new Error('Sign in required.')
  const row = data as ProfileRow
  if (!row.active) throw new Error('Sign in required.')
  return row
}

function emptyBoard(): SharedOps {
  const base = seed()
  return { ...pickOps(base), messages: keepMessages(base.messages) }
}

async function readOps() {
  const { data, error } = await supabase.from('ops').select('payload, revision, updated_at').eq('id', 1).single()
  if (error) throw new Error(error.message)
  const parsed = opsFromUnknown((data.payload ?? {}) as Record<string, unknown>)
  return {
    revision: data.revision as number,
    updatedAt: data.updated_at as string,
    state: parsed ?? emptyBoard(),
  }
}

export const api = {
  async login(email: string, password: string, _remember: boolean) {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message)
    const user = asUser(await requireProfile())
    void api.record('login', `Signed in as ${user.name}`)
    return { user }
  },
  async logout() {
    try {
      const row = await requireProfile()
      void api.record('logout', `Signed out ${row.name}`)
    } catch {
      /* already out */
    }
    await supabase.auth.signOut()
    return { ok: true }
  },
  async me() {
    return { user: asUser(await requireProfile()) }
  },
  async users(all = false) {
    const me = await requireProfile()
    let q = supabase.from('profiles').select('*').order('level', { ascending: true }).order('name', { ascending: true })
    if (!(all && (me.access === 'owner' || me.level === 1))) q = q.eq('active', true)
    const { data, error } = await q
    if (error) throw new Error(error.message)
    return { users: (data as ProfileRow[]).map(asUser) }
  },
  async createUser(input: Record<string, unknown>) {
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    if (!token) throw new Error('Sign in required.')
    const res = await fetch('/api/users', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    })
    const data = (await res.json().catch(() => ({}))) as { user?: LiveUser; error?: string }
    if (!res.ok) throw new Error(data.error || 'Request failed.')
    return { user: data.user as LiveUser }
  },
  async patchUser(id: string, input: Record<string, unknown>) {
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    if (!token) throw new Error('Sign in required.')
    const res = await fetch(`/api/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    })
    const data = (await res.json().catch(() => ({}))) as { user?: LiveUser; error?: string }
    if (!res.ok) throw new Error(data.error || 'Request failed.')
    return { user: data.user as LiveUser }
  },
  async activity() {
    const { data, error } = await supabase
      .from('activity')
      .select('id, at, actor_id, action, detail')
      .order('at', { ascending: false })
      .limit(300)
    if (error) throw new Error(error.message)
    const { users } = await api.users(true)
    const names = new Map(users.map((u) => [u.id, u.name]))
    return {
      logs: (data ?? []).map((row) => ({
        ...row,
        actor: row.actor_id ? names.get(row.actor_id) ?? row.actor_id : 'System',
      })) as ActivityRow[],
    }
  },
  async record(action: string, detail: string) {
    let actorId: string | null = null
    try {
      actorId = (await requireProfile()).id
    } catch {
      actorId = null
    }
    const { error } = await supabase.from('activity').insert({
      id: `log_${crypto.randomUUID().slice(0, 10)}`,
      at: new Date().toISOString(),
      actor_id: actorId,
      action,
      detail: detail.slice(0, 400),
    })
    if (error) throw new Error(error.message)
    return { ok: true }
  },
  async getOps(rev?: number) {
    const current = await readOps()
    if (rev && rev === current.revision) {
      return { unchanged: true as const, revision: current.revision, updatedAt: current.updatedAt }
    }
    return { revision: current.revision, updatedAt: current.updatedAt, ...current.state }
  },
  async putOps(input: SharedOps & { revision: number; deleted?: DeletedIds; replace?: boolean }) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const current = await readOps()
      const incoming = opsFromUnknown(input as unknown as Record<string, unknown>)
      if (!incoming) throw new Error('Invalid ops payload.')
      const state = input.replace ? incoming : mergeShared(current.state, incoming, input.deleted)
      const revision = current.revision + 1
      const updatedAt = new Date().toISOString()
      const { data, error } = await supabase
        .from('ops')
        .update({ payload: state, revision, updated_at: updatedAt })
        .eq('id', 1)
        .eq('revision', current.revision)
        .select('revision')
      if (error) throw new Error(error.message)
      if (data?.length) return { revision, updatedAt, ...state }
    }
    throw new Error('Could not save. Try again.')
  },
  async pushBoatFix(
    fix: {
      lat: number
      lon: number
      sogKn: number | null
      cog: number | null
      status: string
      city: string
      region: string
      country: string
      provider?: string
      fetchedAt?: string
    },
    opts?: { track?: boolean },
  ) {
    const { data: session } = await supabase.auth.getSession()
    if (!session.session) return { ok: false as const }
    const fetchedAt = fix.fetchedAt ?? new Date().toISOString()
    const row = {
      id: 1,
      lat: fix.lat,
      lon: fix.lon,
      sog_kn: fix.sogKn,
      cog: fix.cog,
      status: fix.status,
      city: fix.city,
      region: fix.region,
      country: fix.country,
      provider: fix.provider ?? 'ais',
      fetched_at: fetchedAt,
      updated_at: new Date().toISOString(),
    }
    const { error: upErr } = await supabase.from('boat_fix').upsert(row)
    if (upErr) throw new Error(upErr.message)
    if (opts?.track !== false) {
      const { error: trErr } = await supabase.from('boat_track').insert({
        lat: fix.lat,
        lon: fix.lon,
        sog_kn: fix.sogKn,
        cog: fix.cog,
        status: fix.status,
        provider: fix.provider ?? 'ais',
        fetched_at: fetchedAt,
      })
      if (trErr) throw new Error(trErr.message)
    }
    return { ok: true as const }
  },
  async getBoatFix() {
    const { data, error } = await supabase.from('boat_fix').select('*').eq('id', 1).maybeSingle()
    if (error) throw new Error(error.message)
    return data
  },
  async getBoatTrack(limit = 200) {
    const { data, error } = await supabase
      .from('boat_track')
      .select('lat, lon, sog_kn, cog, fetched_at')
      .order('fetched_at', { ascending: true })
      .limit(limit)
    if (error) throw new Error(error.message)
    return data ?? []
  },
}

export function recordActivity(action: string, detail: string) {
  void api.record(action, detail).catch(() => {})
}
