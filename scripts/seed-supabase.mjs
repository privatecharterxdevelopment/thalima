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
  console.error('Missing Supabase env')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

const seats = [
  {
    id: 'eddy',
    name: 'Max Guzman',
    title: 'Captain',
    role: 'captain',
    department: 'bridge',
    level: 1,
    accounting: 'captain',
    initials: 'MG',
    watch: 'Command',
    email: 'max@thalima.com',
    phone: '+44 7700 900622',
    photo: '/crew/crew-eddy.png',
    access: 'crew',
  },
  {
    id: 'marco',
    name: 'Marco Bellini',
    title: 'Chief Engineer',
    role: 'engineer',
    department: 'engineering',
    level: 2,
    accounting: 'submitter',
    initials: 'MB',
    watch: 'Day worker',
    email: 'marco@thalima.com',
    phone: '+39 333 124 8891',
    photo: '/crew/crew-marco.png',
    access: 'crew',
  },
  {
    id: 'sofia',
    name: 'Sofia Reyes',
    title: 'Chief Stewardess',
    role: 'stewardess',
    department: 'interior',
    level: 2,
    accounting: 'accountant',
    initials: 'SR',
    watch: 'Interior',
    email: 'sofia@thalima.com',
    phone: '+34 612 448 201',
    photo: '/crew/crew-sofia.png',
    access: 'crew',
  },
  {
    id: 'julien',
    name: 'Julien Moreau',
    title: 'Chef',
    role: 'chef',
    department: 'galley',
    level: 2,
    accounting: 'submitter',
    initials: 'JM',
    watch: 'Galley',
    email: 'julien@thalima.com',
    phone: '+33 6 12 44 80 19',
    photo: '/crew/crew-julien.png',
    access: 'crew',
  },
  {
    id: 'luca',
    name: 'Luca Ferrante',
    title: 'Bosun',
    role: 'bosun',
    department: 'deck',
    level: 2,
    accounting: 'submitter',
    initials: 'LF',
    watch: 'Anchor watch 16–20',
    email: 'luca@thalima.com',
    phone: '+39 347 221 0944',
    photo: '/crew/crew-luca.png',
    access: 'crew',
  },
  {
    id: 'owner',
    name: 'Owner',
    title: 'Owner',
    role: 'captain',
    department: 'bridge',
    level: 1,
    accounting: 'captain',
    initials: 'OW',
    watch: 'Owner',
    email: 'owner@thalima.com',
    phone: '',
    photo: '',
    access: 'owner',
  },
]

function passwordFor(person) {
  if (person.id === 'owner') return 'thalima'
  let pw = person.name.split(' ')[0].toLowerCase()
  while (pw.length < 6) pw += '1'
  return pw
}

const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 })
const byEmail = new Map((list?.users ?? []).map((u) => [u.email, u.id]))

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
    departments: [person.department],
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
  else console.log('ok', person.id)
}
