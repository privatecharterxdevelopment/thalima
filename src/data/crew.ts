import type { AccountingRole, Channel, CrewMember, GuestCabin, Systems } from '../types'

/** Live Thalima seats — synced with Supabase auth profiles. */
export const crew: CrewMember[] = [
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
    online: true,
    email: 'captain@thalima.com',
    phone: '',
    photo: '',
    access: 'crew',
    active: true,
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
    online: true,
    email: 'mate@thalima.com',
    phone: '',
    photo: '',
    access: 'crew',
    active: true,
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
    online: true,
    email: 'stew@thalima.com',
    phone: '',
    photo: '',
    access: 'crew',
    active: true,
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
    online: true,
    email: 'engineer@thalima.com',
    phone: '',
    photo: '',
    access: 'crew',
    active: true,
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
    online: true,
    email: 'chef@thalima.com',
    phone: '',
    photo: '',
    access: 'crew',
    active: true,
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
    online: true,
    email: 'info@thalima.com',
    phone: '',
    photo: '',
    access: 'owner',
    active: true,
  },
]

const seedCrew = crew.map((c) => ({ ...c }))

export function setLiveCrew(list: CrewMember[]) {
  const next = list.filter((c) => c.active !== false)
  crew.splice(0, crew.length, ...next)
}

export function resetCrew() {
  crew.splice(0, crew.length, ...seedCrew.map((c) => ({ ...c })))
}

/** Full LY2 / 30–50 m complement. Who is actually on Thalima this season. */
export const roster = [
  {
    department: 'bridge',
    rank: 'Captain / Master',
    level: 1 as const,
    who: 'captain',
    note: 'MCA Master (Yachts). Command, ISM, owner’s representative, OOW.',
  },
  {
    department: 'bridge',
    rank: 'First Officer / Chief Mate',
    level: 2 as const,
    who: 'mate',
    note: 'Safety, watches, deck, crew docs.',
  },
  {
    department: 'deck',
    rank: 'Bosun / Deck lead',
    level: 2 as const,
    who: 'mate',
    note: 'Exterior, tenders, toys, lines — covered by Mate.',
  },
  {
    department: 'engineering',
    rank: 'Chief Engineer',
    level: 2 as const,
    who: 'engineer',
    note: 'Sole engineer. Main, genset, watermaker, hydraulics, PMS.',
  },
  {
    department: 'interior',
    rank: 'Chief Stewardess',
    level: 2 as const,
    who: 'stew',
    note: 'Guest house, service, laundry, interior inventory.',
  },
  {
    department: 'galley',
    rank: 'Head Chef',
    level: 2 as const,
    who: 'chef',
    note: 'Guest and crew menus, provisioning, dietary.',
  },
  {
    department: 'bridge',
    rank: 'Office / Owner seat',
    level: 1 as const,
    who: 'info',
    note: 'Shore office and owner admin access.',
  },
]

export const inventory = [
  { id: 'i1', dept: 'deck', item: 'Williams Sportjet 435', stock: 1, min: 1, unit: 'tender', note: 'Fuelled. 130 hp.' },
  { id: 'i2', dept: 'deck', item: 'Fenders, large', stock: 8, min: 6, unit: 'pcs', note: 'Cockpit locker stbd' },
  { id: 'i3', dept: 'deck', item: 'Paddle boards', stock: 2, min: 2, unit: 'pcs', note: 'Forepeak' },
  { id: 'i4', dept: 'deck', item: 'Kayak', stock: 1, min: 1, unit: 'pcs', note: '—' },
  { id: 'i5', dept: 'engineering', item: 'Cummins raw-water impeller', stock: 0, min: 2, unit: 'pcs', note: 'Order' },
  { id: 'i6', dept: 'engineering', item: 'Watermaker 20 μm filter', stock: 4, min: 2, unit: 'pcs', note: 'Workshop' },
  { id: 'i7', dept: 'engineering', item: 'Watermaker 5 μm filter', stock: 3, min: 2, unit: 'pcs', note: 'Workshop' },
  { id: 'i8', dept: 'engineering', item: 'Vang manifold O-ring set', stock: 0, min: 1, unit: 'set', note: 'Waiting parts' },
  { id: 'i9', dept: 'galley', item: 'Still water 1 L', stock: 36, min: 24, unit: 'btl', note: 'Crew stores' },
  { id: 'i10', dept: 'interior', item: 'Hypoallergenic linen sets', stock: 6, min: 4, unit: 'sets', note: 'Owner suite' },
  { id: 'i11', dept: 'interior', item: 'Guest towels', stock: 18, min: 12, unit: 'pcs', note: 'Linen locker' },
  { id: 'i12', dept: 'bridge', item: 'Handheld VHF', stock: 4, min: 4, unit: 'pcs', note: 'Chart table, charged' },
  { id: 'i13', dept: 'bridge', item: 'Binoculars 7×50', stock: 2, min: 1, unit: 'pcs', note: 'Helm' },
  { id: 'i14', dept: 'deck', item: 'Lifejackets, adult', stock: 12, min: 12, unit: 'pcs', note: 'Lazarette' },
]

export const channels: Channel[] = [{ id: 'all', name: 'All crew', kind: 'all' }]

export const cabins: GuestCabin[] = [
  {
    id: 'master',
    name: 'Owner suite',
    beds: 'King · study · walk-in',
    guests: [],
    notes: '',
    service: '',
  },
  {
    id: 'vip',
    name: 'VIP',
    beds: 'King, both sides',
    guests: [],
    notes: '',
    service: '',
  },
  {
    id: 'twin-p',
    name: 'Twin port',
    beds: 'Two singles, en-suite',
    guests: [],
    notes: '',
    service: '',
  },
  {
    id: 'twin-s',
    name: 'Twin starboard',
    beds: 'Two singles, en-suite',
    guests: [],
    notes: '',
    service: '',
  },
]

export const systemsSeed: Systems = {
  fuelPct: 72,
  waterPct: 64,
  blackPct: 31,
  greyPct: 44,
  batteryV: 26.4,
  engineHours: 4821,
  gensetHours: 3102,
  watermaker: 'standby',
  genset: 'standby',
  hydraulics: 'watch',
}

export const levelLabel: Record<1 | 2 | 3, string> = {
  1: 'Command',
  2: 'Head of department',
  3: 'Crew',
}

export const accountingRoleLabel: Record<AccountingRole, string> = {
  none: 'None',
  submitter: 'Submitter',
  accountant: 'Accountant',
  captain: 'Captain',
}

export const deptLabel: Record<string, string> = {
  bridge: 'Bridge',
  engineering: 'Engineering',
  interior: 'Interior',
  galley: 'Galley',
  deck: 'Deck',
}

export const calRoles = ['captain', 'first_officer', 'engineer', 'stewardess', 'chef'] as const

export const calRoleLabel: Record<(typeof calRoles)[number], string> = {
  captain: 'Master',
  first_officer: 'Mate',
  engineer: 'Engineer',
  stewardess: 'Interior',
  chef: 'Galley',
}

export const urgencyLabel: Record<string, string> = {
  routine: 'Routine',
  soon: 'Soon',
  now: 'Now',
  emergency: 'Emergency',
}

export const statusLabel: Record<string, string> = {
  open: 'Open',
  doing: 'In progress',
  waiting: 'Awaiting',
  done: 'Completed',
  backlog: 'Open',
  ready: 'Open',
}

export const statusOrder = ['open', 'doing', 'waiting', 'done'] as const
