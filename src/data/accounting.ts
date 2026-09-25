import { crew } from './crew'
import type { AttachedFile, Expense, ExpenseCategory, ExpenseStatus } from '../types'

function slip(vendor: string, amount: string, date: string, ref: string, name?: string): AttachedFile {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="580" viewBox="0 0 420 580">
    <rect width="420" height="580" fill="#f6f4ef"/>
    <rect x="18" y="18" width="384" height="544" fill="#fff" stroke="#e7e2d8"/>
    <text x="210" y="64" text-anchor="middle" font-family="Georgia, serif" font-size="18" fill="#1c2430">${vendor}</text>
    <line x1="48" y1="84" x2="372" y2="84" stroke="#e7e2d8"/>
    <text x="48" y="122" font-family="Inter, sans-serif" font-size="11" fill="#8a9099">RECEIPT</text>
    <text x="48" y="148" font-family="Inter, sans-serif" font-size="13" fill="#1c2430">${date}</text>
    <text x="48" y="188" font-family="Inter, sans-serif" font-size="11" fill="#8a9099">TOTAL</text>
    <text x="48" y="220" font-family="Inter, sans-serif" font-size="22" fill="#1c2430">${amount}</text>
    <text x="48" y="268" font-family="Inter, sans-serif" font-size="11" fill="#8a9099">THALIMA REF</text>
    <text x="48" y="292" font-family="Inter, sans-serif" font-size="13" fill="#1c2430">${ref}</text>
    <text x="48" y="540" font-family="Inter, sans-serif" font-size="10" fill="#b0b4ba">Original onboard scan</text>
  </svg>`
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  return {
    id: `fr-${ref}`,
    name: name ?? `${ref}.svg`,
    type: 'image/svg+xml',
    size: dataUrl.length,
    dataUrl,
  }
}

function at(day: number, hour = 10) {
  return `2026-09-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:12:00+02:00`
}

export function expenseRow(input: {
  n: string
  vendor: string
  category: ExpenseCategory
  eur: number
  vat?: number
  day: number
  hour?: number
  by: string
  status: ExpenseStatus
  approver?: string
  approvedBy?: string
  invoiceNo?: string
  description: string
  place: string
  title?: string
  fileName?: string
  source?: Expense['source']
  currency?: string
  amount?: number
  extracted?: boolean
}): Expense {
  const uploadedAt = at(input.day, input.hour)
  const approvedAt = input.status === 'approved' ? at(input.day, (input.hour ?? 10) + 3) : undefined
  const ref = `THA-2026-${input.n}`
  const receipt = input.source === 'manual' ? undefined : slip(input.vendor, `€${input.eur.toFixed(2)}`, `Sep ${input.day} 2026`, ref, input.fileName)
  const notes: Expense['notes'] = [
    {
      id: `ea-${input.n}-1`,
      at: uploadedAt,
      authorId: input.by,
      action: input.source === 'manual' ? 'created' : 'uploaded',
      text: input.source === 'manual' ? `Manual expense · ${crewFirst(input.by)}` : `Uploaded by ${crewFirst(input.by)}`,
    },
  ]
  if (input.status === 'approved' && input.approvedBy) {
    notes.push({
      id: `ea-${input.n}-9`,
      at: approvedAt!,
      authorId: input.approvedBy,
      action: 'approved',
      text: `Approved by ${crewFirst(input.approvedBy)}`,
    })
  }
  if (input.status === 'rejected' && input.approvedBy) {
    notes.push({
      id: `ea-${input.n}-9`,
      at: at(input.day, (input.hour ?? 10) + 2),
      authorId: input.approvedBy,
      action: 'rejected',
      text: `Rejected by ${crewFirst(input.approvedBy)}`,
    })
  }
  return {
    id: `ex-${input.n}`,
    ref,
    source: input.source ?? 'receipt',
    vendor: input.vendor,
    title: input.title ?? '',
    date: uploadedAt,
    category: input.category,
    amount: input.amount ?? input.eur,
    currency: input.currency ?? 'EUR',
    eurAmount: input.eur,
    vat: input.vat ?? null,
    invoiceNo: input.invoiceNo ?? '',
    description: input.description,
    place: input.place,
    paymentMethod: '',
    status: input.status,
    uploadedBy: input.by,
    uploadedAt,
    approverId: input.approver ?? 'captain',
    approvedBy: input.status === 'approved' || input.status === 'rejected' ? input.approvedBy : undefined,
    approvedAt: input.status === 'approved' ? approvedAt : undefined,
    receipt,
    extraction: {
      completed: input.extracted ?? input.source !== 'manual',
      confidence: {
        vendor: 'ok',
        date: 'ok',
        amount: 'ok',
        currency: 'ok',
        eurAmount: 'ok',
        vat: input.vat != null ? 'ok' : 'missing',
        invoiceNo: input.invoiceNo ? 'ok' : 'missing',
        category: 'ok',
        description: 'ok',
      },
    },
    notes,
  }
}

function crewFirst(id: string) {
  return crew.find((c) => c.id === id)?.name ?? id
}

/** Live books start empty — expenses are created in-app. */
export function expensesSeed(): Expense[] {
  return []
}
