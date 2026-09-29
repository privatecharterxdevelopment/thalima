import type { CrewMember } from '../types'

export type RoutineSeed = { id: string; title: string; unit?: string }

const deckLead: RoutineSeed[] = [
  { id: 'deck-walk', title: 'Deck walk: lines, fenders, covers' },
  { id: 'deck-tender', title: 'Tender, toys and fuel' },
  { id: 'deck-radio', title: 'Radio with the bridge' },
  { id: 'deck-guest', title: 'Guest deck set for the day' },
  { id: 'deck-secure', title: 'Deck secured at the end of the watch' },
]

const interior: RoutineSeed[] = [
  { id: 'int-cabins', title: 'Cabins opened, turndown planned' },
  { id: 'int-laundry', title: 'Laundry sorted and turned' },
  { id: 'int-areas', title: 'Saloon and guest areas reset' },
  { id: 'int-stores', title: 'Linen and guest stores' },
  { id: 'int-radio', title: 'Radio with galley and bridge' },
]

const galley: RoutineSeed[] = [
  { id: 'gal-fridge-1', title: 'Fridge 1 temperature', unit: '°C' },
  { id: 'gal-fridge-2', title: 'Fridge 2 temperature', unit: '°C' },
  { id: 'gal-freezer', title: 'Freezer temperature', unit: '°C' },
  { id: 'gal-radio', title: 'Radio connection' },
  { id: 'gal-menu', title: 'Menu confirmed against allergies' },
  { id: 'gal-secure', title: 'Galley clean and secure' },
]

const engineering: RoutineSeed[] = [
  { id: 'eng-round', title: 'Engine room round' },
  { id: 'eng-bilge', title: 'Bilges, strainers and leaks' },
  { id: 'eng-hours', title: 'Generator hours', unit: 'h' },
  { id: 'eng-volts', title: 'Battery bank', unit: 'V' },
  { id: 'eng-radio', title: 'Radio with the bridge' },
  { id: 'eng-fluids', title: 'Fluids checked' },
]

export const routineCatalog: Record<string, RoutineSeed[]> = {
  captain: [
    { id: 'cap-bridge', title: 'Bridge walk, alarms and nav lights' },
    { id: 'cap-weather', title: 'Weather, traffic and the day’s passage' },
    { id: 'cap-radio', title: 'Radio check' },
    { id: 'cap-brief', title: 'Crew briefing' },
    { id: 'cap-guest', title: 'Guest programme confirmed' },
    { id: 'cap-log', title: 'Deck log and watches closed' },
  ],
  owner: [
    { id: 'own-post', title: 'Overnight messages and approvals' },
    { id: 'own-programme', title: 'Today’s programme with the captain' },
    { id: 'own-guests', title: 'Guest notes passed to interior and galley' },
  ],
  office: [
    { id: 'off-mail', title: 'Mail, agents and the day’s paperwork' },
    { id: 'off-accounts', title: 'Expenses and invoices in the queue' },
    { id: 'off-crew', title: 'Crew movements and certificates' },
  ],
  first_officer: deckLead,
  bosun: deckLead,
  deckhand: [
    { id: 'dh-wash', title: 'Wash down and dry the decks' },
    { id: 'dh-lines', title: 'Lines, fenders and covers' },
    { id: 'dh-tender', title: 'Tender ready if the programme needs it' },
    { id: 'dh-radio', title: 'Radio with the bridge' },
    { id: 'dh-secure', title: 'Deck secured before the evening' },
  ],
  engineer: engineering,
  second_engineer: engineering,
  eto: [
    { id: 'eto-power', title: 'Power, navigation and comms' },
    { id: 'eto-radio', title: 'Radio check' },
    { id: 'eto-alarms', title: 'Alarms acknowledged' },
    { id: 'eto-spares', title: 'Spares and open defects' },
  ],
  stewardess: interior,
  second_stew: interior,
  purser: [
    { id: 'pur-accounts', title: 'Guest accounts and cash' },
    { id: 'pur-stores', title: 'Bond and guest stores' },
    { id: 'pur-programme', title: 'Programme shared with the department heads' },
    { id: 'pur-radio', title: 'Radio with the bridge' },
  ],
  chef: galley,
  sous: galley,
}

const labels: Record<string, string> = {
  captain: 'Captain',
  owner: 'Owner',
  office: 'Office',
  first_officer: 'First mate',
  bosun: 'Bosun',
  deckhand: 'Deckhand',
  engineer: 'Engineer',
  second_engineer: 'Second engineer',
  eto: 'ETO',
  stewardess: 'Stewardess',
  second_stew: 'Second stewardess',
  purser: 'Purser',
  chef: 'Galley',
  sous: 'Galley',
}

export function routineLabel(key: string) {
  return labels[key] ?? 'Crew'
}

export function routineKey(user: Pick<CrewMember, 'role' | 'title' | 'access'>) {
  if (user.title === 'Office') return 'office'
  if (user.access === 'owner' && user.title !== 'Captain') return 'owner'
  return user.role || 'deckhand'
}

export function routineSeeds(key: string): RoutineSeed[] {
  return routineCatalog[key] ?? routineCatalog.deckhand
}
