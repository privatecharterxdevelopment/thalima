import { expenseStatusLabel } from '../lib/accounting'
import type { ExpenseStatus } from '../types'

const tone: Record<ExpenseStatus, string> = {
  approved: 'done',
  pending: 'waiting',
  rejected: 'hot',
  draft: 'open',
}

export function ExpenseStatus({ status }: { status: ExpenseStatus }) {
  return <span className={`st-pill is-${tone[status]}`}>{expenseStatusLabel[status]}</span>
}
