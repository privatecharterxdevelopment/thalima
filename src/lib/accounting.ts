import { crew } from '../data/crew'
import type {
  AccountingRole,
  CrewMember,
  Expense,
  ExpenseAudit,
  ExpenseCategory,
  ExpenseField,
  ExpenseStatus,
} from '../types'
import { uid } from './format'

export const expenseCategories: ExpenseCategory[] = [
  'fuel',
  'marina',
  'guest_fnb',
  'interior',
  'crew_food',
  'maintenance',
  'spares',
  'deck',
  'laundry',
  'agency',
  'medical',
  'transport',
  'travel',
  'comms',
  'insurance',
  'other',
]

export const expenseCategoryLabel: Record<ExpenseCategory, string> = {
  fuel: 'Fuel & Bunkering',
  marina: 'Marina & Berthing',
  guest_fnb: 'Guest Provisioning',
  interior: 'Guest Expenses',
  crew_food: 'Crew Expenses',
  maintenance: 'Maintenance & Parts',
  spares: 'Maintenance & Parts',
  deck: 'Shore Services',
  laundry: 'Shore Services',
  agency: 'Shore Services',
  medical: 'Shore Services',
  transport: 'Transportation',
  travel: 'Transportation',
  comms: 'Communication',
  insurance: 'Insurance',
  other: 'Other',
}

export const spendGroups: { id: string; label: string; cats: ExpenseCategory[] }[] = [
  { id: 'fuel', label: 'Fuel & Bunkering', cats: ['fuel'] },
  { id: 'marina', label: 'Marina & Berthing', cats: ['marina'] },
  { id: 'guest_fnb', label: 'Guest Provisioning', cats: ['guest_fnb'] },
  { id: 'parts', label: 'Maintenance & Parts', cats: ['maintenance', 'spares'] },
  { id: 'crew', label: 'Crew Expenses', cats: ['crew_food'] },
  { id: 'guest', label: 'Guest Expenses', cats: ['interior'] },
  { id: 'shore', label: 'Shore Services', cats: ['deck', 'laundry', 'agency', 'medical'] },
  { id: 'transport', label: 'Transportation', cats: ['transport', 'travel'] },
  { id: 'comms', label: 'Communication', cats: ['comms'] },
  { id: 'insurance', label: 'Insurance', cats: ['insurance'] },
  { id: 'other', label: 'Other', cats: ['other'] },
]

export const expenseStatusLabel: Record<ExpenseStatus, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

export const currencies = ['EUR', 'USD', 'GBP', 'CHF'] as const

export function accountingRoleOf(user: CrewMember): AccountingRole {
  return user.accounting ?? 'none'
}

export function canSubmitAccounting(user: CrewMember) {
  return accountingRoleOf(user) !== 'none'
}

export function canReviewAccounting(user: CrewMember) {
  const role = accountingRoleOf(user)
  return role === 'accountant' || role === 'captain'
}

export function canReportAccounting(user: CrewMember) {
  return canReviewAccounting(user)
}

export function eligibleApprovers(exceptId?: string) {
  return crew.filter((c) => {
    if (exceptId && c.id === exceptId) return false
    return c.accounting === 'accountant' || c.accounting === 'captain'
  })
}

export function defaultApproverId(uploaderId: string) {
  return eligibleApprovers(uploaderId)[0]?.id ?? null
}

export function canEditExpense(user: CrewMember, exp: Expense) {
  if (exp.status === 'approved') return accountingRoleOf(user) === 'accountant'
  if (exp.status === 'rejected') return canReviewAccounting(user) || exp.uploadedBy === user.id
  if (exp.uploadedBy === user.id) return true
  return canReviewAccounting(user)
}

export function canApproveExpense(user: CrewMember, exp: Expense) {
  if (exp.status !== 'pending') return false
  if (exp.uploadedBy === user.id) return false
  if (!canReviewAccounting(user)) return false
  if (exp.approverId && exp.approverId !== user.id) return false
  return true
}

export function canRejectExpense(user: CrewMember, exp: Expense) {
  return canApproveExpense(user, exp)
}

export function romeDateInput(iso?: string) {
  return new Date(iso ?? Date.now()).toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' })
}

export function firstOfRomeMonth(iso?: string) {
  const day = romeDateInput(iso)
  return `${day.slice(0, 8)}01`
}

const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function romeYmd(iso: string) {
  const day = iso.length <= 10 ? iso : romeDateInput(iso)
  return { y: day.slice(0, 4), m: Number(day.slice(5, 7)), d: day.slice(8, 10) }
}

export function formatExpenseDate(iso: string) {
  const { y, m, d } = romeYmd(iso)
  return `${Number(d)} ${shortMonths[m - 1]} ${y}`
}

export function formatExpenseDay(iso: string) {
  const { m, d } = romeYmd(iso)
  return `${Number(d)} ${shortMonths[m - 1]}`
}

export function monthLabel(iso: string) {
  const { y, m } = romeYmd(`${iso.slice(0, 10)}T12:00:00+02:00`)
  const long = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return `${long[m - 1]} ${y}`
}

export function extractionScore(exp: Expense) {
  if (!exp.extraction.completed) return null
  const vals = Object.values(exp.extraction.confidence)
  if (!vals.length) return null
  const ok = vals.filter((v) => v === 'ok').length
  return Math.round((ok / vals.length) * 100)
}

export function receiptInbox(list: Expense[]) {
  return list
    .filter((e) => e.status === 'draft')
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
}

export function expensePlace(exp: Expense) {
  if (exp.place?.trim()) return exp.place.trim()
  const v = `${exp.vendor} ${exp.description}`.toLowerCase()
  if (v.includes('porto cervo') || v.includes('cala di volpe')) return 'Porto Cervo'
  if (v.includes('porto rotondo')) return 'Porto Rotondo'
  if (v.includes('olbia')) return 'Olbia'
  return ''
}

export function groupedSpend(list: Expense[]) {
  return spendGroups
    .map((group) => ({
      id: group.id,
      label: group.label,
      amount: list
        .filter((e) => e.category && group.cats.includes(e.category))
        .reduce((n, e) => n + (e.eurAmount ?? 0), 0),
    }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}

export function formatRangeLabel(from: string, to: string) {
  const fmt = (day: string) => {
    const { y, m, d } = romeYmd(day)
    return `${d} ${shortMonths[m - 1]} ${y}`
  }
  return `${fmt(from)} — ${fmt(to)}`
}

export function expenseTitle(exp: Expense) {
  return exp.title?.trim() || exp.vendor || exp.receipt?.name || exp.ref
}

export function formatEur(n: number | null | undefined) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(n)
}

export function inDateRange(iso: string, from: string, to: string) {
  const day = romeDateInput(iso)
  return day >= from && day <= to
}

export function inRomeMonth(iso: string, month = romeDateInput().slice(0, 7)) {
  return romeDateInput(iso).startsWith(month)
}

export function nextExpenseRef(expenses: Expense[], at = new Date()) {
  const year = Number(
    at.toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' }).slice(0, 4),
  )
  const prefix = `THA-${year}-`
  let max = 0
  for (const exp of expenses) {
    if (!exp.ref.startsWith(prefix)) continue
    const n = Number(exp.ref.slice(prefix.length))
    if (Number.isFinite(n) && n > max) max = n
  }
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

export function expenseAudit(
  authorId: string,
  action: ExpenseAudit['action'],
  text: string,
): ExpenseAudit {
  return {
    id: uid('ea'),
    at: new Date().toISOString(),
    authorId,
    action,
    text,
  }
}

export const requiredExpenseFields: ExpenseField[] = ['vendor', 'date', 'eurAmount', 'category']

export function missingExpenseFields(exp: Expense): ExpenseField[] {
  const missing: ExpenseField[] = []
  if (!exp.vendor.trim()) missing.push('vendor')
  if (!exp.date) missing.push('date')
  if (exp.eurAmount === null || Number.isNaN(exp.eurAmount)) missing.push('eurAmount')
  if (!exp.category) missing.push('category')
  if (exp.currency !== 'EUR' && (exp.amount === null || Number.isNaN(exp.amount))) missing.push('amount')
  return missing
}

export function extractionWarnings(exp: Expense) {
  const missing = missingExpenseFields(exp)
  const low = (Object.entries(exp.extraction.confidence) as [ExpenseField, string][])
    .filter(([, v]) => v === 'low' || v === 'missing')
    .map(([k]) => k)
  return [...new Set([...missing, ...low])]
}

export function expenseSearchBlob(exp: Expense) {
  const who = crew.find((c) => c.id === exp.uploadedBy)
  const approver = crew.find((c) => c.id === (exp.approvedBy ?? exp.approverId ?? ''))
  const cat = exp.category ? expenseCategoryLabel[exp.category] : ''
  return [
    exp.ref,
    exp.vendor,
    cat,
    exp.description,
    exp.place,
    exp.invoiceNo,
    who?.name,
    who?.title,
    approver?.name,
    exp.status,
    exp.currency,
    exp.eurAmount ?? '',
    formatExpenseDate(exp.date || exp.uploadedAt),
  ]
    .join(' ')
    .toLowerCase()
}

export function matchExpenseQuery(exp: Expense, q: string) {
  const query = q.trim().toLowerCase()
  if (!query) return true
  return expenseSearchBlob(exp).includes(query)
}

export type ExpenseFilters = {
  from: string
  to: string
  category: ExpenseCategory | 'all'
  uploadedBy: string
  status: ExpenseStatus | 'all'
  query: string
}

export function categoryMatches(expCat: ExpenseCategory | '', pick: ExpenseCategory | 'all') {
  if (pick === 'all') return true
  if (!expCat) return false
  const group = spendGroups.find((g) => g.cats.includes(pick) || g.cats.includes(expCat))
  if (group && group.cats.includes(pick)) return group.cats.includes(expCat)
  return expCat === pick
}

export const expenseCategoryOptions = spendGroups.map((g) => ({ id: g.cats[0], label: g.label }))

export function categoryOptionId(cat: ExpenseCategory | '') {
  if (!cat) return ''
  return spendGroups.find((g) => g.cats.includes(cat))?.cats[0] ?? cat
}

export function filterExpenses(list: Expense[], filters: ExpenseFilters) {
  return list.filter((exp) => {
    if (!inDateRange(exp.date || exp.uploadedAt, filters.from, filters.to)) return false
    if (!categoryMatches(exp.category, filters.category)) return false
    if (filters.uploadedBy !== 'all' && exp.uploadedBy !== filters.uploadedBy) return false
    if (filters.status !== 'all' && exp.status !== filters.status) return false
    if (!matchExpenseQuery(exp, filters.query)) return false
    return true
  })
}

export function emptyDraftExpense(
  userId: string,
  ref: string,
  source: Expense['source'],
): Expense {
  const now = new Date().toISOString()
  return {
    id: uid('ex'),
    ref,
    source,
    vendor: '',
    date: `${romeDateInput()}T12:00:00+02:00`,
    category: '',
    amount: null,
    currency: 'EUR',
    eurAmount: null,
    vat: null,
    invoiceNo: '',
    description: '',
    place: '',
    paymentMethod: '',
    status: 'draft',
    uploadedBy: userId,
    uploadedAt: now,
    approverId: defaultApproverId(userId),
    extraction: {
      completed: false,
      confidence: {
        vendor: 'missing',
        date: 'missing',
        amount: 'missing',
        currency: 'missing',
        eurAmount: 'missing',
        vat: 'missing',
        invoiceNo: 'missing',
        category: 'missing',
        description: 'missing',
      },
    },
    notes: [],
  }
}
