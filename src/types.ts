export type Role =
  | 'captain'
  | 'first_officer'
  | 'bosun'
  | 'deckhand'
  | 'engineer'
  | 'second_engineer'
  | 'eto'
  | 'purser'
  | 'stewardess'
  | 'second_stew'
  | 'chef'
  | 'sous'
export type Level = 1 | 2 | 3
export type Department = 'bridge' | 'engineering' | 'interior' | 'galley' | 'deck'
export type Urgency = 'routine' | 'soon' | 'now' | 'emergency'
export type TaskStatus = 'backlog' | 'ready' | 'doing' | 'waiting' | 'done'
export type ChannelKind = 'all' | 'department' | 'dm'
export type CalRole = 'captain' | 'engineer' | 'stewardess' | 'chef' | 'bosun'

export type CrewMember = {
  id: string
  name: string
  title: string
  role: Role
  department: Department
  level: Level
  initials: string
  watch: string
  online: boolean
  email: string
  phone: string
  photo: string
}

export type AttachedFile = {
  id: string
  name: string
  type: string
  size: number
  dataUrl: string
}

export type CloudDoc = AttachedFile & {
  title: string
  createdBy: string
  createdAt: string
}

export type Task = {
  id: string
  title: string
  body: string
  status: TaskStatus
  urgency: Urgency
  department: Department
  assigneeId: string
  assigneeIds?: string[]
  files?: AttachedFile[]
  createdBy: string
  due: string
  createdAt: string
  completedAt?: string
}

export type Channel = {
  id: string
  name: string
  kind: ChannelKind
  department?: Department
  memberIds?: string[]
}

export type ChatMessage = {
  id: string
  channelId: string
  authorId: string
  text: string
  at: string
}

export type LogEntry = {
  id: string
  at: string
  authorId: string
  text: string
}

export type CalEvent = {
  id: string
  title: string
  body: string
  role: CalRole
  start: string
  end: string
  createdBy: string
}

export type GuestCabin = {
  id: string
  name: string
  beds: string
  guests: string[]
  notes: string
  service: string
}

export type Systems = {
  fuelPct: number
  waterPct: number
  blackPct: number
  greyPct: number
  batteryV: number
  engineHours: number
  gensetHours: number
  watermaker: 'producing' | 'standby' | 'fault'
  genset: 'running' | 'standby'
  hydraulics: 'ok' | 'watch'
}

export type WeatherHour = {
  at: string
  windKn: number
  gustKn: number
  waveM: number | null
}

export type WeatherNow = {
  tempC: number
  windKn: number
  gustKn: number
  windDir: number
  pressure: number
  cloud: number
  waveM: number | null
  waveDir: number | null
  wavePeriod: number | null
  swellM: number | null
  swellPeriod: number | null
  sst: number | null
  hourly: WeatherHour[]
  fetchedAt: string
}

export type AppSnapshot = {
  userId: string | null
  theme: 'light' | 'dark'
  tasks: Task[]
  messages: ChatMessage[]
  log: LogEntry[]
  events: CalEvent[]
  systems: Systems
  lastRead: Record<string, string>
  weather: WeatherNow | null
  docs: CloudDoc[]
}
