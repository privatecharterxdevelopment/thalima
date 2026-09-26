import './env'
import { createClient, type User } from '@supabase/supabase-js'
import type { IncomingMessage } from 'node:http'
import { parseStations } from '../src/lib/format'

function url() {
  return process.env.VITE_SUPABASE_URL || ''
}

function serviceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

export function supabaseAdminReady() {
  return Boolean(url() && serviceKey())
}

export function supabaseAdmin() {
  return createClient(url(), serviceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function ownerFromBearer(req: IncomingMessage) {
  const header = String(req.headers.authorization ?? '')
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return null
  const admin = supabaseAdmin()
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) return null
  const { data: profile } = await admin.from('profiles').select('*').eq('auth_id', data.user.id).maybeSingle()
  if (!profile || !profile.active) return null
  if (profile.access !== 'owner' && Number(profile.level) !== 1) return null
  return { auth: data.user as User, profile }
}

export function publicProfile(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    role: row.role,
    department: row.department,
    departments: parseStations(row.departments, String(row.department) as 'deck'),
    level: row.level,
    accounting: row.accounting,
    initials: row.initials,
    watch: row.watch,
    online: Boolean(row.active),
    email: row.email,
    phone: row.phone,
    photo: row.photo,
    access: row.access,
    active: Boolean(row.active),
    joinedAt: typeof row.created_at === 'string' ? row.created_at : undefined,
  }
}
