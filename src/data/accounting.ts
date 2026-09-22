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

function row(input: {
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
      text: input.source === 'manual' ? `Manual expense · ${input.by === 'sofia' ? 'Sofia' : input.by}` : `Uploaded by ${crewFirst(input.by)}`,
    },
  ]
  if (input.source !== 'manual') {
    notes.push(
      {
        id: `ea-${input.n}-2`,
        at: at(input.day, (input.hour ?? 10) + 0),
        authorId: input.by,
        action: 'extracted',
        text: 'AI extraction completed',
      },
      {
        id: `ea-${input.n}-3`,
        at: at(input.day, (input.hour ?? 10) + 0),
        authorId: input.by,
        action: 'category_suggested',
        text: 'Category suggested',
      },
    )
    if (input.n === '0481') {
      notes.push({
        id: `ea-${input.n}-4`,
        at: at(input.day, (input.hour ?? 10) + 1),
        authorId: input.by,
        action: 'edited',
        text: 'Edited by Sofia',
      })
    }
  }
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
    approverId: input.approver ?? 'eddy',
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
  return ({ eddy: 'Max', marco: 'Marco', sofia: 'Sofia', julien: 'Julien', luca: 'Luca' } as Record<string, string>)[id] ?? id
}

export function expensesSeed(): Expense[] {
  return [
    row({
      n: '0475',
      vendor: 'Saras bunker',
      title: 'Fuel bunkering',
      category: 'fuel',
      eur: 4860,
      vat: 874.8,
      day: 18,
      by: 'eddy',
      status: 'approved',
      approvedBy: 'sofia',
      invoiceNo: 'SR-4412',
      description: 'MGO top-up before the Porto Cervo week. Two receipts — bunker docket onboard.',
      place: 'Porto Cervo',
    }),
    row({
      n: '0476',
      vendor: 'Cala di Volpe market',
      title: 'Guest provisions',
      category: 'guest_fnb',
      eur: 642.4,
      vat: 64.24,
      day: 17,
      hour: 16,
      by: 'sofia',
      status: 'approved',
      approvedBy: 'eddy',
      description: 'Guest fruit, still water, and Adler’s requested cheeses.',
      place: 'Olbia',
      fileName: 'IMG_2841.jpg',
    }),
    row({
      n: '0477',
      vendor: 'Cash & Carry Olbia',
      title: 'Crew provisions',
      category: 'crew_food',
      eur: 318.9,
      day: 15,
      by: 'eddy',
      status: 'approved',
      approvedBy: 'sofia',
      description: 'Crew week: rice, eggs, coffee, still water.',
      place: 'Porto Cervo',
    }),
    row({
      n: '0478',
      vendor: 'Lavanderia Porto Rotondo',
      category: 'laundry',
      eur: 186,
      vat: 33.48,
      day: 12,
      by: 'sofia',
      status: 'pending',
      approver: 'eddy',
      invoiceNo: 'LPR-902',
      description: 'Guest whites plus crew bedding. Same house as last season.',
      place: 'Porto Rotondo',
    }),
    row({
      n: '0479',
      vendor: 'Pegaso Marine, Olbia',
      title: 'Engine spare parts',
      category: 'spares',
      eur: 412,
      vat: 74.16,
      day: 16,
      by: 'marco',
      status: 'approved',
      approvedBy: 'eddy',
      invoiceNo: 'PG-1188',
      description: 'Cummins raw-water impeller ×2. Not to leave the boat.',
      place: 'Olbia',
      fileName: 'receipt_0918.pdf',
    }),
    row({
      n: '0480',
      vendor: 'Hertz Olbia Airport',
      category: 'transport',
      eur: 94,
      day: 15,
      by: 'luca',
      status: 'rejected',
      approvedBy: 'eddy',
      description: 'Crew run to airport — personal use. Rejected; use the yacht van.',
      place: 'Olbia',
    }),
    row({
      n: '0481',
      vendor: 'Marina di Porto Cervo',
      title: 'Marina fees',
      category: 'marina',
      eur: 1280,
      vat: 230.82,
      day: 18,
      hour: 9,
      by: 'eddy',
      status: 'approved',
      approvedBy: 'sofia',
      invoiceNo: 'PCM-21-094',
      description: 'Alongside, water, and power 18 Sep. Stern-to on B dock.',
      place: 'Porto Cervo',
    }),
    row({
      n: '0482',
      vendor: 'Farmacia del Porto, Olbia',
      title: 'Ship medical chest',
      category: 'medical',
      eur: 67.5,
      vat: 6.75,
      day: 18,
      by: 'luca',
      status: 'draft',
      description: 'Ship’s medical chest: antiseptic, tape, seasickness. Scan incomplete.',
      place: 'Olbia',
      extracted: false,
      fileName: 'IMG_2822.jpg',
    }),
    row({
      n: '0483',
      vendor: 'Nautisport, Olbia',
      category: 'deck',
      eur: 154.2,
      day: 19,
      by: 'luca',
      status: 'pending',
      approver: 'eddy',
      description: 'Fender covers and a spare shore-power adapter.',
      place: 'Olbia',
    }),
    row({
      n: '0484',
      vendor: 'Maison de la Truffe, Porto Cervo',
      category: 'interior',
      eur: 88,
      day: 20,
      by: 'sofia',
      status: 'pending',
      approver: 'eddy',
      source: 'manual',
      description: 'Guest cabin candles. No receipt — paid cash in the piazza.',
      place: 'Porto Cervo',
    }),
    row({
      n: '0485',
      vendor: 'Cala di Volpe market',
      title: 'Guest provisions',
      category: 'guest_fnb',
      eur: 642.4,
      vat: 64.24,
      day: 17,
      hour: 11,
      by: 'sofia',
      status: 'draft',
      description: 'Guest fruit, still water, and Adler’s requested cheeses.',
      place: 'Porto Cervo',
      extracted: true,
      fileName: 'IMG_2841.jpg',
    }),
    row({
      n: '0486',
      vendor: 'Pegaso Marine, Olbia',
      title: 'Engine spare parts',
      category: 'spares',
      eur: 412,
      vat: 74.16,
      day: 16,
      hour: 11,
      by: 'marco',
      status: 'draft',
      invoiceNo: 'PG-1188',
      description: 'Cummins raw-water impeller ×2. Not to leave the boat.',
      place: 'Olbia',
      extracted: true,
      fileName: 'receipt_0918.pdf',
    }),
  ].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
}
