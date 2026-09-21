import type { Channel, CrewMember, GuestCabin, Systems } from '../types'

export const crew: CrewMember[] = [
  {
    id: 'eddy',
    name: 'Max Guzman',
    title: 'Captain',
    role: 'captain',
    department: 'bridge',
    level: 1,
    initials: 'MG',
    watch: 'Command',
    online: true,
    email: 'max@thalima.com',
    phone: '+44 7700 900622',
    photo: '/crew/crew-eddy.png',
  },
  {
    id: 'marco',
    name: 'Marco Bellini',
    title: 'Chief Engineer',
    role: 'engineer',
    department: 'engineering',
    level: 2,
    initials: 'MB',
    watch: 'Day worker',
    online: true,
    email: 'marco@thalima.com',
    phone: '+39 333 124 8891',
    photo: '/crew/crew-marco.png',
  },
  {
    id: 'sofia',
    name: 'Sofia Reyes',
    title: 'Chief Stewardess',
    role: 'stewardess',
    department: 'interior',
    level: 2,
    initials: 'SR',
    watch: 'Interior',
    online: true,
    email: 'sofia@thalima.com',
    phone: '+34 612 448 201',
    photo: '/crew/crew-sofia.png',
  },
  {
    id: 'julien',
    name: 'Julien Moreau',
    title: 'Chef',
    role: 'chef',
    department: 'galley',
    level: 2,
    initials: 'JM',
    watch: 'Galley',
    online: true,
    email: 'julien@thalima.com',
    phone: '+33 6 12 44 80 19',
    photo: '/crew/crew-julien.png',
  },
  {
    id: 'luca',
    name: 'Luca Ferrante',
    title: 'Bosun',
    role: 'bosun',
    department: 'deck',
    level: 2,
    initials: 'LF',
    watch: 'Anchor watch 16–20',
    online: true,
    email: 'luca@thalima.com',
    phone: '+39 347 221 0944',
    photo: '/crew/crew-luca.png',
  },
]

/** Full LY2 / 30–50 m complement. Who is actually on Thalima this season. */
export const roster = [
  {
    department: 'bridge',
    rank: 'Captain / Master',
    level: 1 as const,
    who: 'eddy',
    note: 'MCA Master (Yachts). Command, ISM, owner’s representative, OOW.',
  },
  {
    department: 'bridge',
    rank: 'First Officer / Chief Mate',
    level: 2 as const,
    who: null,
    note: 'Rarely carried under 40 m. Captain covers safety, watches, crew docs.',
  },
  {
    department: 'bridge',
    rank: 'Second Officer / OOW',
    level: 2 as const,
    who: null,
    note: 'Not carried. Passage watches split Captain / Bosun.',
  },
  {
    department: 'deck',
    rank: 'Bosun',
    level: 2 as const,
    who: 'luca',
    note: 'Head of deck. Exterior, tenders, toys, lines, guest watersports.',
  },
  {
    department: 'deck',
    rank: 'Lead Deckhand',
    level: 3 as const,
    who: null,
    note: 'Vacant this season. Bosun covers the deck alone.',
  },
  {
    department: 'deck',
    rank: 'Deckhand',
    level: 3 as const,
    who: null,
    note: 'Not carried at five crew.',
  },
  {
    department: 'engineering',
    rank: 'Chief Engineer',
    level: 2 as const,
    who: 'marco',
    note: 'Sole engineer. Main, genset, watermaker, hydraulics, PMS.',
  },
  {
    department: 'engineering',
    rank: 'Second Engineer',
    level: 3 as const,
    who: null,
    note: 'Not carried at 33 m.',
  },
  {
    department: 'engineering',
    rank: 'ETO',
    level: 2 as const,
    who: null,
    note: 'AV / IT / nav electronics. Shore support; Chief covers daily.',
  },
  {
    department: 'interior',
    rank: 'Purser',
    level: 2 as const,
    who: null,
    note: 'Accounts, crew contracts, cash. Split between Captain and Chief Stew.',
  },
  {
    department: 'interior',
    rank: 'Chief Stewardess',
    level: 2 as const,
    who: 'sofia',
    note: 'Guest house, service, laundry, interior inventory, allergies.',
  },
  {
    department: 'interior',
    rank: '2nd Stewardess',
    level: 3 as const,
    who: null,
    note: 'Vacant. Chief stew covers service and cabins.',
  },
  {
    department: 'interior',
    rank: 'Junior Stewardess',
    level: 3 as const,
    who: null,
    note: 'Not carried.',
  },
  {
    department: 'galley',
    rank: 'Head Chef',
    level: 2 as const,
    who: 'julien',
    note: 'Guest and crew menus, provisioning, dietary.',
  },
  {
    department: 'galley',
    rank: 'Sous / Crew Chef',
    level: 3 as const,
    who: null,
    note: 'Not carried. Head chef does crew meals.',
  },
]

export const inventory = [
  { id: 'i1', dept: 'deck', item: 'Williams Sportjet 435', stock: 1, min: 1, unit: 'tender', note: 'Fuelled. 130 hp.' },
  { id: 'i2', dept: 'deck', item: 'Fenders, large', stock: 8, min: 6, unit: 'pcs', note: 'Cockpit locker stbd' },
  { id: 'i3', dept: 'deck', item: 'Paddle boards', stock: 2, min: 2, unit: 'pcs', note: 'Forepeak' },
  { id: 'i4', dept: 'deck', item: 'Kayak', stock: 1, min: 1, unit: 'pcs', note: '—' },
  { id: 'i5', dept: 'engineering', item: 'Cummins raw-water impeller', stock: 0, min: 2, unit: 'pcs', note: 'Last used Genoa — order' },
  { id: 'i6', dept: 'engineering', item: 'Watermaker 20 μm filter', stock: 4, min: 2, unit: 'pcs', note: 'Workshop, under bench' },
  { id: 'i7', dept: 'engineering', item: 'Watermaker 5 μm filter', stock: 3, min: 2, unit: 'pcs', note: 'Workshop' },
  { id: 'i8', dept: 'engineering', item: 'Vang manifold O-ring set', stock: 0, min: 1, unit: 'set', note: 'Weep — waiting parts' },
  { id: 'i9', dept: 'galley', item: 'Still water 1 L', stock: 36, min: 24, unit: 'btl', note: 'Crew stores' },
  { id: 'i10', dept: 'galley', item: 'Oat ice cream', stock: 2, min: 1, unit: 'tubs', note: 'Crew freezer · Nina' },
  { id: 'i11', dept: 'interior', item: 'Hypoallergenic linen sets', stock: 6, min: 4, unit: 'sets', note: 'Owner suite' },
  { id: 'i12', dept: 'interior', item: 'Guest towels', stock: 18, min: 12, unit: 'pcs', note: 'Linen locker' },
  { id: 'i13', dept: 'bridge', item: 'Handheld VHF', stock: 4, min: 4, unit: 'pcs', note: 'Chart table, charged' },
  { id: 'i14', dept: 'bridge', item: 'Binoculars 7×50', stock: 2, min: 1, unit: 'pcs', note: 'Helm' },
  { id: 'i15', dept: 'deck', item: 'Lifejackets, adult', stock: 12, min: 12, unit: 'pcs', note: 'Lazarette, serviced 2026' },
  { id: 'i16', dept: 'galley', item: 'Dentex / fish freeze', stock: 3, min: 2, unit: 'kg', note: 'Owner dinner window' },
]

export const channels: Channel[] = [
  { id: 'all', name: 'All crew', kind: 'all' },
  { id: 'bridge', name: 'Bridge', kind: 'department', department: 'bridge' },
  { id: 'engineering', name: 'Engineering', kind: 'department', department: 'engineering' },
  { id: 'interior', name: 'Interior', kind: 'department', department: 'interior' },
  { id: 'galley', name: 'Galley', kind: 'department', department: 'galley' },
  { id: 'deck', name: 'Deck', kind: 'department', department: 'deck' },
  { id: 'dm-eddy-marco', name: 'Max · Marco', kind: 'dm', memberIds: ['eddy', 'marco'] },
  { id: 'dm-eddy-sofia', name: 'Max · Sofia', kind: 'dm', memberIds: ['eddy', 'sofia'] },
  { id: 'dm-eddy-julien', name: 'Max · Julien', kind: 'dm', memberIds: ['eddy', 'julien'] },
  { id: 'dm-eddy-luca', name: 'Max · Luca', kind: 'dm', memberIds: ['eddy', 'luca'] },
  { id: 'dm-sofia-julien', name: 'Sofia · Julien', kind: 'dm', memberIds: ['sofia', 'julien'] },
  { id: 'dm-marco-luca', name: 'Marco · Luca', kind: 'dm', memberIds: ['marco', 'luca'] },
]

export const cabins: GuestCabin[] = [
  {
    id: 'master',
    name: 'Owner suite',
    beds: 'King · study · walk-in',
    guests: ['Mr Adler', 'Mrs Adler'],
    notes: 'Soft wake 08:00. Still water, no ice in spirit. Hypoallergenic linen.',
    service: 'Turndown 21:30',
  },
  {
    id: 'vip',
    name: 'VIP',
    beds: 'King, both sides',
    guests: ['Clara Vogel', 'Tom Vogel'],
    notes: 'Clara — shellfish allergy. Espresso at 07:15 on deck if fair.',
    service: 'Turndown 21:45',
  },
  {
    id: 'twin-p',
    name: 'Twin port',
    beds: 'Two singles, en-suite',
    guests: ['Nina Adler', 'Otto Adler'],
    notes: 'Teens. Snorkel after lunch. No dairy in Nina’s breakfast.',
    service: 'Cabins after breakfast',
  },
  {
    id: 'twin-s',
    name: 'Twin starboard',
    beds: 'Two singles, en-suite',
    guests: [],
    notes: 'Empty this week. Keep made-up as spare.',
    service: 'Dust only',
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

export const deptLabel: Record<string, string> = {
  bridge: 'Bridge',
  engineering: 'Engineering',
  interior: 'Interior',
  galley: 'Galley',
  deck: 'Deck',
}

export const calRoles = ['captain', 'engineer', 'stewardess', 'chef', 'bosun'] as const

export const calRoleLabel: Record<(typeof calRoles)[number], string> = {
  captain: 'Master',
  engineer: 'Engineer',
  stewardess: 'Interior',
  chef: 'Galley',
  bosun: 'Deck',
}

export const urgencyLabel: Record<string, string> = {
  routine: 'Routine',
  soon: 'Soon',
  now: 'Now',
  emergency: 'Emergency',
}

export const statusLabel: Record<string, string> = {
  backlog: 'Backlog',
  ready: 'Ready',
  doing: 'On it',
  waiting: 'Waiting',
  done: 'Done',
}

export const statusOrder = ['backlog', 'ready', 'doing', 'waiting', 'done'] as const
