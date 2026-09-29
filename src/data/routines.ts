import type { CrewMember } from '../types'

export type RoutineSeed = { id: string; title: string }

const deckLead: RoutineSeed[] = [
  { id: 'deck-walk', title: 'Deck walk: lines, fenders, covers' },
  { id: 'deck-tender', title: 'Tender, toys and fuel checked' },
  { id: 'deck-guest', title: 'Guest deck set for the day' },
  { id: 'deck-secure', title: 'Secure the deck at the end of the watch' },
]

const interior: RoutineSeed[] = [
  { id: 'int-cabins', title: 'Cabins opened, turndown planned' },
  { id: 'int-laundry', title: 'Laundry sorted and turned' },
  { id: 'int-areas', title: 'Saloon and guest areas reset' },
  { id: 'int-stores', title: 'Linen and guest stores checked' },
]

const galley: RoutineSeed[] = [
  { id: 'gal-menu', title: 'Menu confirmed against allergies' },
  { id: 'gal-temps', title: 'Fridges, freezers and galley temps logged' },
  { id: 'gal-prep', title: 'Service plan and prep list' },
  { id: 'gal-secure', title: 'Galley clean and secure' },
]

const engineering: RoutineSeed[] = [
  { id: 'eng-round', title: 'Engine room round' },
  { id: 'eng-bilge', title: 'Bilges, strainers and leaks' },
  { id: 'eng-power', title: 'Generators, shore power and batteries' },
  { id: 'eng-fluids', title: 'Fluids and hours logged' },
]

export const routineCatalog: Record<string, RoutineSeed[]> = {
  captain: [
    { id: 'cap-bridge', title: 'Bridge walk, alarms and nav lights' },
    { id: 'cap-weather', title: 'Weather, traffic and the day’s passage' },
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
    { id: 'dh-secure', title: 'Deck secured before the evening' },
  ],
  engineer: engineering,
  second_engineer: engineering,
  eto: [
    { id: 'eto-power', title: 'Power, navigation and comms checks' },
    { id: 'eto-alarms', title: 'Alarms acknowledged and logged' },
    { id: 'eto-spares', title: 'Spares and open defects reviewed' },
  ],
  stewardess: interior,
  second_stew: interior,
  purser: [
    { id: 'pur-accounts', title: 'Guest accounts and cash' },
    { id: 'pur-stores', title: 'Bond and guest stores' },
    { id: 'pur-programme', title: 'Programme shared with the department heads' },
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
  chef: 'Chef',
  sous: 'Sous chef',
}

export function routineKey(user: Pick<CrewMember, 'role' | 'title' | 'access'>) {
  if (user.title === 'Office') return 'office'
  if (user.access === 'owner' && user.title !== 'Captain') return 'owner'
  return user.role || 'deckhand'
}

export function routineLabel(key: string) {
  return labels[key] ?? 'Crew'
}

export function routineSeeds(key: string): RoutineSeed[] {
  return routineCatalog[key] ?? routineCatalog.deckhand
}
