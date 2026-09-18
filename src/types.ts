export type Role = 'captain' | 'engineer' | 'stewardess' | 'chef' | 'deck'
export type Level = 1 | 2 | 3
export type Department = 'bridge' | 'engineering' | 'interior' | 'galley' | 'deck'
export type Urgency = 'routine' | 'soon' | 'now' | 'emergency'
export type TaskStatus = 'backlog' | 'ready' | 'doing' | 'waiting' | 'done'
export type ChannelKind = 'all' | 'department' | 'dm'

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
}

export type Task = {
  id: string
  title: string
  body: string
  status: TaskStatus
  urgency: Urgency
  department: Department
  assigneeId: string
  createdBy: string
  due: string
  createdAt: string
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
  sst: number | null
  fetchedAt: string
}

export type AppSnapshot = {
  userId: string | null
  theme: 'light' | 'dark'
  tasks: Task[]
  messages: ChatMessage[]
  log: LogEntry[]
  systems: Systems
  lastRead: Record<string, string>
  weather: WeatherNow | null
}
