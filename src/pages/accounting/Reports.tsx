import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { crew } from '../../data/crew'
import {
  canReportAccounting,
  expenseCategoryLabel,
  expenseCategoryOptions,
  expenseStatusLabel,
  filterExpenses,
  formatEur,
  formatExpenseDate,
  formatRangeLabel,
  groupedSpend,
} from '../../lib/accounting'
import { useStore } from '../../store'
import type { Expense, ExpenseCategory, ExpenseStatus } from '../../types'
import type { AccountingOutlet } from '../Accounting'

function reportHtml(input: {
  from: string
  to: string
  rows: Expense[]
  appendix: boolean
  generated: string
}) {
  const total = input.rows.reduce((n, e) => n + (e.eurAmount ?? 0), 0)
  const cats = groupedSpend(input.rows)
  const appendix = input.appendix
    ? input.rows
        .filter((e) => e.receipt?.type.startsWith('image/'))
        .map(
          (e) =>
            `<figure class="app"><img src="${e.receipt!.dataUrl}" alt=""><figcaption>${e.ref} · ${e.vendor}</figcaption></figure>`,
        )
        .join('')
    : ''
  const rows = input.rows
    .map((e) => {
      const up = crew.find((c) => c.id === e.uploadedBy)?.name ?? ''
      const ap = crew.find((c) => c.id === e.approvedBy)?.name ?? ''
      return `<tr><td>${e.ref}</td><td>${formatExpenseDate(e.date || e.uploadedAt)}</td><td>${e.vendor}</td><td>${e.category ? expenseCategoryLabel[e.category] : ''}</td><td>${formatEur(e.eurAmount)}</td><td>${up}</td><td>${ap}</td></tr>`
    })
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>Thalima expense report</title>
    <style>
      body { font-family: Inter, Helvetica, sans-serif; color: #1c2430; padding: 32px 40px; }
      img.mark { height: 28px; }
      h1 { font-size: 13px; letter-spacing: .14em; margin: 18px 0 4px; }
      h2 { font-weight: 500; font-size: 28px; letter-spacing: -.04em; margin: 0 0 24px; }
      .meta { color: #667085; font-size: 13px; margin-bottom: 28px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th { text-align: left; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #98a2b3; border-bottom: 1px solid #eaecf0; padding: 8px 6px; }
      td { border-bottom: 1px solid #f2f4f7; padding: 9px 6px; }
      .cats { margin: 0 0 28px; padding: 0; list-style: none; }
      .cats li { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f2f4f7; font-size: 13px; }
      .app { break-inside: avoid; margin: 24px 0; }
      .app img { max-width: 100%; max-height: 420px; border: 1px solid #eaecf0; }
      figcaption { font-size: 12px; color: #667085; margin-top: 8px; }
    </style></head><body>
    <img class="mark" src="/logo.png" alt="Thalima">
    <h1>THALIMA</h1>
    <h2>Expense report</h2>
    <p class="meta">${formatRangeLabel(input.from, input.to)} · All amounts EUR · Generated ${input.generated}</p>
    <p><strong>Total expenses ${formatEur(total)}</strong></p>
    <ul class="cats">${cats.map((c) => `<li><span>${c.label}</span><span>${formatEur(c.amount)}</span></li>`).join('')}</ul>
    <table><thead><tr><th>Reference</th><th>Date</th><th>Vendor</th><th>Category</th><th>Amount EUR</th><th>Uploaded by</th><th>Approved by</th></tr></thead>
    <tbody>${rows}</tbody></table>
    ${appendix ? `<h2 style="font-size:20px;margin-top:40px">Receipt appendix</h2>${appendix}` : ''}
    </body></html>`
}

export function AccountingReports() {
  const { user, expenses } = useStore()
  const { from, to } = useOutletContext<AccountingOutlet>()
  const [category, setCategory] = useState<ExpenseCategory | 'all'>('all')
  const [status, setStatus] = useState<ExpenseStatus | 'all'>('approved')
  const [appendix, setAppendix] = useState(false)
  if (!user) return null

  const rows = useMemo(
    () =>
      filterExpenses(expenses, {
        from,
        to,
        category,
        uploadedBy: 'all',
        status,
        query: '',
      }).sort((a, b) => new Date(a.date || a.uploadedAt).getTime() - new Date(b.date || b.uploadedAt).getTime()),
    [expenses, from, to, category, status],
  )
  const total = rows.reduce((n, e) => n + (e.eurAmount ?? 0), 0)
  const canPrint = canReportAccounting(user)

  function generate() {
    const html = reportHtml({
      from,
      to,
      rows,
      appendix,
      generated: formatExpenseDate(new Date().toISOString()),
    })
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
  }

  return (
    <div className="acct-body">
      <section className="acct-card">
        <h2>Report</h2>
        <div className="acct-filters">
          <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory | 'all')}>
            <option value="all">All categories</option>
            {expenseCategoryOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as ExpenseStatus | 'all')}>
            {(Object.keys(expenseStatusLabel) as ExpenseStatus[]).map((id) => (
              <option key={id} value={id}>
                {expenseStatusLabel[id]}
              </option>
            ))}
          </select>
          <label className="acct-check">
            <input type="checkbox" checked={appendix} onChange={(e) => setAppendix(e.target.checked)} />
            Include receipt appendix
          </label>
          <button className="btn" type="button" disabled={!canPrint || !rows.length} onClick={generate}>
            Generate PDF
          </button>
        </div>
        {!canPrint ? (
          <p className="acct-hint">PDF reports are issued by the accountant or captain.</p>
        ) : null}
        <p className="acct-hint">
          {formatRangeLabel(from, to)} · {rows.length} line{rows.length === 1 ? '' : 's'} · {formatEur(total)}
        </p>
        {rows.length ? (
          <table className="acct-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Date</th>
                <th>Vendor</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Uploaded by</th>
                <th>Approved by</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((exp) => (
                <tr key={exp.id}>
                  <td>{exp.ref}</td>
                  <td>{formatExpenseDate(exp.date || exp.uploadedAt)}</td>
                  <td>{exp.vendor}</td>
                  <td>{exp.category ? expenseCategoryLabel[exp.category] : '—'}</td>
                  <td>{formatEur(exp.eurAmount)}</td>
                  <td>{crew.find((c) => c.id === exp.uploadedBy)?.name ?? '—'}</td>
                  <td>{crew.find((c) => c.id === exp.approvedBy)?.name ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="acct-empty">No lines for this report.</p>
        )}
      </section>
    </div>
  )
}
