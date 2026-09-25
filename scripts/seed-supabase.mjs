import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const i = line.indexOf('=')
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()]
    }),
)

const url = env.VITE_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

/** Live CRM seats — emails are the source of truth. */
const seats = [
  {
    id: 'captain',
    name: 'Captain',
    title: 'Captain',
    role: 'captain',
    department: 'bridge',
    departments: ['bridge'],
    level: 1,
    accounting: 'captain',
    initials: 'CA',
    watch: 'Command',
    email: 'captain@thalima.com',
    phone: '',
    photo: '',
    access: 'crew',
  },
  {
    id: 'mate',
    name: 'Mate',
    title: 'First Mate',
    role: 'first_officer',
    department: 'deck',
    departments: ['deck', 'bridge'],
    level: 2,
    accounting: 'submitter',
    initials: 'MA',
    watch: 'Deck / OOW',
    email: 'mate@thalima.com',
    phone: '',
    photo: '',
    access: 'crew',
  },
  {
    id: 'stew',
    name: 'Stew',
    title: 'Stewardess',
    role: 'stewardess',
    department: 'interior',
    departments: ['interior'],
    level: 2,
    accounting: 'accountant',
    initials: 'ST',
    watch: 'Interior',
    email: 'stew@thalima.com',
    phone: '',
    photo: '',
    access: 'crew',
  },
  {
    id: 'engineer',
    name: 'Engineer',
    title: 'Engineer',
    role: 'engineer',
    department: 'engineering',
    departments: ['engineering'],
    level: 2,
    accounting: 'submitter',
    initials: 'EN',
    watch: 'Engineering',
    email: 'engineer@thalima.com',
    phone: '',
    photo: '',
    access: 'crew',
  },
  {
    id: 'chef',
    name: 'Chef',
    title: 'Chef',
    role: 'chef',
    department: 'galley',
    departments: ['galley'],
    level: 2,
    accounting: 'submitter',
    initials: 'CH',
    watch: 'Galley',
    email: 'chef@thalima.com',
    phone: '',
    photo: '',
    access: 'crew',
  },
  {
    id: 'info',
    name: 'Info',
    title: 'Office',
    role: 'captain',
    department: 'bridge',
    departments: ['bridge'],
    level: 1,
    accounting: 'captain',
    initials: 'IN',
    watch: 'Office',
    email: 'info@thalima.com',
    phone: '',
    photo: '',
    access: 'owner',
  },
]

function passwordFor(person) {
  const local = person.email.split('@')[0]
  let pw = local.toLowerCase()
  while (pw.length < 6) pw += '1'
  return pw
}

const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 })
const byEmail = new Map((list?.users ?? []).map((u) => [String(u.email ?? '').toLowerCase(), u.id]))

for (const person of seats) {
  const email = person.email.toLowerCase()
  const password = passwordFor(person)
  let authId = byEmail.get(email)
  if (!authId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (error || !data.user) {
      console.error('auth', email, error?.message)
      continue
    }
    authId = data.user.id
    byEmail.set(email, authId)
  } else {
    const { error } = await admin.auth.admin.updateUserById(authId, { password, email_confirm: true })
    if (error) console.error('pw', email, error.message)
  }
  const row = {
    id: person.id,
    auth_id: authId,
    name: person.name,
    title: person.title,
    role: person.role,
    department: person.department,
    departments: person.departments,
    level: person.level,
    accounting: person.accounting,
    initials: person.initials,
    watch: person.watch,
    email,
    phone: person.phone,
    photo: person.photo,
    access: person.access,
    active: true,
    updated_at: new Date().toISOString(),
  }
  let { error } = await admin.from('profiles').upsert(row)
  if (error && /departments/i.test(error.message)) {
    const { departments: _drop, ...rest } = row
    ;({ error } = await admin.from('profiles').upsert(rest))
  }
  if (error) console.error('profile', email, error.message)
  else console.log('ok', person.id, email, 'pw=', password)
}

// Deactivate legacy demo seats if still present
const liveIds = new Set(seats.map((s) => s.id))
const { data: existing } = await admin.from('profiles').select('id, email')
for (const row of existing ?? []) {
  if (liveIds.has(row.id)) continue
  const { error } = await admin.from('profiles').update({ active: false, updated_at: new Date().toISOString() }).eq('id', row.id)
  if (error) console.error('deactivate', row.id, error.message)
  else console.log('deactivated', row.id, row.email)
}
