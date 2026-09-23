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
export type AccountingRole = 'none' | 'submitter' | 'accountant' | 'captain'
export type Access = 'owner' | 'crew'
export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export type ExpenseSource = 'receipt' | 'manual'
export type ExpenseCategory =
  | 'fuel'
  | 'marina'
  | 'guest_fnb'
  | 'crew_food'
  | 'maintenance'
  | 'spares'
  | 'deck'
  | 'interior'
  | 'laundry'
  | 'transport'
  | 'travel'
  | 'agency'
  | 'comms'
  | 'medical'
  | 'insurance'
  | 'other'
export type Department = 'bridge' | 'engineering' | 'interior' | 'galley' | 'deck'
export type Urgency = 'routine' | 'soon' | 'now' | 'emergency'
export type TaskStatus = 'open' | 'doing' | 'waiting' | 'done'
export type TaskKind =
  | 'guest_request'
  | 'maintenance'
  | 'defect'
  | 'safety'
  | 'tender'
  | 'provisioning'
  | 'cleaning'
  | 'navigation'
  | 'routine'
  | 'delivery'
export type AwaitReason = 'spare' | 'contractor' | 'owner' | 'marina' | 'delivery'
export type DueKind = 'time' | 'date' | 'hours' | 'recurring' | 'event'
export type TaskEvent = 'before_departure' | 'before_guest_arrival' | 'after_anchoring' | 'before_crossing'
export type TaskRecur = 'daily' | 'weekly'
export type ChannelKind = 'all' | 'department' | 'dm'
export type CalRole = 'captain' | 'engineer' | 'stewardess' | 'chef' | 'bosun'

export type CrewMember = {
  id: string
  name: string
  title: string
  role: Role
  department: Department
  departments?: Department[]
  level: Level
  accounting: AccountingRole
  initials: string
  watch: string
  online: boolean
  email: string
  phone: string
  photo: string
  access?: Access
  active?: boolean
}

export type AttachedFile = {
  id: string
  name: string
  type: string
  size: number
  dataUrl: string
}

export type CloudFolder = 'yacht' | 'certificate' | 'manual' | 'invoice' | 'contract'

export type CloudDoc = AttachedFile & {
  title: string
  createdBy: string
  createdAt: string
  folder?: CloudFolder
}

export type TaskNote = {
  id: string
  authorId: string
  text: string
  at: string
  kind?: 'note' | 'status' | 'file' | 'assign'
}

export type Task = {
  id: string
  title: string
  body: string
  status: TaskStatus
  urgency: Urgency
  kind: TaskKind
  department: Department
  assigneeId: string
  assigneeIds?: string[]
  files?: AttachedFile[]
  notes?: TaskNote[]
  createdBy: string
  due: string
  createdAt: string
  completedAt?: string
  startedAt?: string
  workedMs?: number
  awaitReason?: AwaitReason
  dueKind?: DueKind
  dueHours?: number
  dueAssetId?: string
  recur?: TaskRecur
  eventCue?: TaskEvent
  ownerRequest?: boolean
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

export type AssetKind =
  | 'engine'
  | 'generator'
  | 'watermaker'
  | 'hvac'
  | 'tender'
  | 'pump'
  | 'battery'
  | 'nav'
  | 'other'

export type Equipment = {
  id: string
  name: string
  kind: AssetKind
  hours: number
  intervalH: number
  lastServiceAt: string
  lastServiceH: number
  nextServiceH: number
  location: string
  department: Department
  notes: string
}

export type ServiceLog = {
  id: string
  assetId: string
  at: string
  hours: number
  by: string
  text: string
}

export type DefectStatus = 'open' | 'watch' | 'closed'

export type Defect = {
  id: string
  assetId?: string
  title: string
  body: string
  status: DefectStatus
  at: string
  by: string
}

export type SparePart = {
  id: string
  name: string
  assetId?: string
  stock: number
  min: number
  unit: string
  location: string
}

export type CertKind = 'yacht' | 'crew' | 'safety' | 'insurance'

export type Certificate = {
  id: string
  title: string
  kind: CertKind
  holderId?: string
  expiresAt: string
  issuer: string
  notes: string
}

export type LeaveKind = 'leave' | 'rotation' | 'offsign'

export type Presence = 'onboard' | 'offboard'
export type DutyStatus = 'working' | 'off_duty' | 'leave' | 'sick' | 'travel' | 'training'
export type RosterKind = 'offboard' | 'off_duty' | 'leave' | 'sick' | 'travel' | 'training'
export type AbsenceReason = 'leave' | 'personal' | 'travel' | 'medical' | 'other'
export type RosterDecision = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type RosterAudit = {
  id: string
  at: string
  authorId: string
  action: 'created' | 'edited' | 'approved' | 'rejected' | 'cancelled' | 'admin_change'
  text: string
}

export type RosterEntry = {
  id: string
  crewId: string
  from: string
  to: string
  kind: RosterKind
  presence: Presence
  duty: DutyStatus
  reason: AbsenceReason
  comment: string
  status: RosterDecision
  requestedBy: string
  requestedAt: string
  decidedBy?: string
  decidedAt?: string
  source?: 'status'
  notes: RosterAudit[]
}

export type SelfStatus = 'working' | 'off_duty' | 'offboard' | 'sick'

export type LeaveRow = {
  id: string
  crewId: string
  from: string
  to: string
  kind: LeaveKind
  note: string
}

export type Handover = {
  id: string
  fromId: string
  toId: string
  at: string
  body: string
}

export type ProvisionCat = 'food' | 'beverage' | 'wine' | 'toiletries' | 'cleaning' | 'laundry'

export type ProvisionItem = {
  id: string
  category: ProvisionCat
  item: string
  stock: number
  min: number
  unit: string
  note: string
}

export type PurchaseCat = 'marina' | 'fuel' | 'repair' | 'provisioning' | 'crew' | 'other'
export type PurchaseStatus = 'pending' | 'approved' | 'denied' | 'paid'

export type PurchaseRequest = {
  id: string
  title: string
  supplier: string
  amount: number
  currency: string
  category: PurchaseCat
  status: PurchaseStatus
  by: string
  at: string
  note: string
}

export type ContactKind =
  | 'shipyard'
  | 'marina'
  | 'agent'
  | 'engineer'
  | 'sailmaker'
  | 'provisioning'
  | 'laundry'
  | 'fuel'
  | 'doctor'
  | 'emergency'
  | 'other'

export type DirectoryContact = {
  id: string
  name: string
  kind: ContactKind
  phone: string
  email: string
  whatsapp?: string
  place: string
  note: string
}

export type DrillKind = 'fire' | 'mob' | 'abandon' | 'first_aid' | 'safety_check'

export type Drill = {
  id: string
  kind: DrillKind
  at: string
  by: string
  note: string
}

export type TripGuest = {
  id?: string
  name: string
  cabin: string
  diet: string
  allergy: string
  laundry: string
}

export type TripLog = {
  id: string
  authorId: string
  text: string
  at: string
  kind?: 'note' | 'change' | 'guest' | 'prep'
}

export type Trip = {
  id: string
  title: string
  from: string
  to: string
  ownerAboard: boolean
  guests: TripGuest[]
  transfers: string
  reservations: string
  notes: string
  prepped?: boolean
  log?: TripLog[]
}

export type OpsState = {
  equipment: Equipment[]
  services: ServiceLog[]
  defects: Defect[]
  spares: SparePart[]
  certificates: Certificate[]
  leave: LeaveRow[]
  handovers: Handover[]
  provisions: ProvisionItem[]
  purchases: PurchaseRequest[]
  contacts: DirectoryContact[]
  drills: Drill[]
  trips: Trip[]
  stock?: StockItem[]
}

export type StockItem = {
  id: string
  dept: Department
  item: string
  stock: number
  min: number
  unit: string
  note: string
}

export type ExpenseField =
  | 'vendor'
  | 'date'
  | 'amount'
  | 'currency'
  | 'eurAmount'
  | 'vat'
  | 'invoiceNo'
  | 'category'
  | 'description'

export type FieldConfidence = 'ok' | 'low' | 'missing'

export type ExpenseAudit = {
  id: string
  at: string
  authorId: string
  action:
    | 'uploaded'
    | 'created'
    | 'extracted'
    | 'category_suggested'
    | 'edited'
    | 'submitted'
    | 'approved'
    | 'rejected'
  text: string
}

export type Expense = {
  id: string
  ref: string
  source: ExpenseSource
  vendor: string
  title?: string
  date: string
  category: ExpenseCategory | ''
  amount: number | null
  currency: string
  eurAmount: number | null
  vat: number | null
  invoiceNo: string
  description: string
  place: string
  paymentMethod: string
  status: ExpenseStatus
  uploadedBy: string
  uploadedAt: string
  approverId: string | null
  approvedBy?: string
  approvedAt?: string
  receipt?: AttachedFile
  extraction: {
    completed: boolean
    confidence: Partial<Record<ExpenseField, FieldConfidence>>
  }
  notes: ExpenseAudit[]
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
  seenNotices: Record<string, string>
  dismissedEmergencies: Record<string, string>
  weather: WeatherNow | null
  docs: CloudDoc[]
  ops: OpsState
  expenses: Expense[]
  roster: RosterEntry[]
}
