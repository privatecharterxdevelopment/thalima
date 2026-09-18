import type { Channel, CrewMember, GuestCabin, Systems } from '../types'

export const crew: CrewMember[] = [
  {
    id: 'eddy',
    name: 'Eddy Guzman',
    title: 'Captain',
    role: 'captain',
    department: 'bridge',
    level: 1,
    initials: 'EG',
    watch: 'Command',
    online: true,
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
  },
  {
    id: 'luca',
    name: 'Luca Ferrante',
    title: 'Lead Deckhand',
    role: 'deck',
    department: 'deck',
    level: 3,
    initials: 'LF',
    watch: 'Anchor watch 16–20',
    online: true,
  },
]

export const channels: Channel[] = [
  { id: 'all', name: 'All crew', kind: 'all' },
  { id: 'bridge', name: 'Bridge', kind: 'department', department: 'bridge' },
  { id: 'engineering', name: 'Engineering', kind: 'department', department: 'engineering' },
  { id: 'interior', name: 'Interior', kind: 'department', department: 'interior' },
  { id: 'galley', name: 'Galley', kind: 'department', department: 'galley' },
  { id: 'deck', name: 'Deck', kind: 'department', department: 'deck' },
  { id: 'dm-eddy-marco', name: 'Eddy · Marco', kind: 'dm', memberIds: ['eddy', 'marco'] },
  { id: 'dm-eddy-sofia', name: 'Eddy · Sofia', kind: 'dm', memberIds: ['eddy', 'sofia'] },
  { id: 'dm-eddy-julien', name: 'Eddy · Julien', kind: 'dm', memberIds: ['eddy', 'julien'] },
  { id: 'dm-eddy-luca', name: 'Eddy · Luca', kind: 'dm', memberIds: ['eddy', 'luca'] },
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
