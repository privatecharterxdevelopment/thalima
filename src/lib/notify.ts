import { expenseCategoryLabel } from './accounting'
import type { Department, Expense } from '../types'

export type TaskMail = {
  kind: 'task'
  taskId: string
  title: string
  body: string
  due: string
  department: Department
  assigneeIds: string[]
  fromId: string
  origin?: string
}

export type ExpenseMail = {
  kind: 'expense'
  expenseId: string
  ref: string
  vendor: string
  amount: string
  category: string
  description: string
  approverId: string
  fromId: string
  origin?: string
}

export type ChatMail = {
  kind: 'chat'
  channelId: string
  text: string
  fromId: string
  toIds: string[]
  origin?: string
}

export function notifyTaskAssigned(input: Omit<TaskMail, 'kind'>) {
  const to = input.assigneeIds.filter((id) => id && id !== input.fromId)
  if (!to.length) return
  void postMail({ kind: 'task', ...input, assigneeIds: to })
}

export function notifyExpenseApproval(input: Omit<ExpenseMail, 'kind'>) {
  if (!input.approverId || input.approverId === input.fromId) return
  void postMail({ kind: 'expense', ...input })
}

export function notifyChat(input: Omit<ChatMail, 'kind'>) {
  const to = input.toIds.filter((id) => id && id !== input.fromId)
  if (!to.length || !input.text.trim()) return
  void postMail({ kind: 'chat', ...input, toIds: to })
}

export function expenseMailFrom(exp: Expense, fromId: string): Omit<ExpenseMail, 'kind'> {
  return {
    expenseId: exp.id,
    ref: exp.ref,
    vendor: exp.vendor || exp.ref,
    amount: exp.eurAmount != null
      ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(exp.eurAmount)
      : '—',
    category: exp.category ? expenseCategoryLabel[exp.category] : 'Uncategorised',
    description: exp.description || exp.title || '',
    approverId: exp.approverId ?? '',
    fromId,
  }
}

async function postMail(payload: TaskMail | ExpenseMail | ChatMail) {
  try {
    const { supabase } = await import('./supabase')
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    await fetch('/api/notify', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...payload, origin: window.location.origin }),
    })
  } catch {
    /* mail is best-effort */
  }
}
