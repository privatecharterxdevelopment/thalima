import { Link, useOutletContext } from 'react-router-dom'
import { ExpenseStatus } from '../../components/ExpenseStatus'
import { ReceiptCapture } from '../../components/ReceiptCapture'
import { crew } from '../../data/crew'
import {
  canSubmitAccounting,
  expenseCategoryLabel,
  expenseTitle,
  filterExpenses,
  formatEur,
  formatExpenseDay,
  groupedSpend,
  monthLabel,
  receiptInbox,
  expensePlace,
} from '../../lib/accounting'
import { useStore } from '../../store'
import type { AccountingOutlet } from '../Accounting'

export function AccountingOverview() {
  const { user, expenses, addReceipt } = useStore()
  const { from, to, openReview } = useOutletContext<AccountingOutlet>()
  if (!user) return null

  const ranged = filterExpenses(expenses, {
    from,
    to,
    category: 'all',
    uploadedBy: 'all',
    status: 'all',
    query: '',
  })
  const approved = ranged.filter((e) => e.status === 'approved')
  const total = approved.reduce((n, e) => n + (e.eurAmount ?? 0), 0)
  const pendingRows = ranged.filter((e) => e.status === 'pending')
  const pendingAmt = pendingRows.reduce((n, e) => n + (e.eurAmount ?? 0), 0)
  const processed = ranged.filter((e) => e.receipt && e.status === 'approved').length
  const byCat = groupedSpend(approved)
  const maxCat = byCat[0]?.amount || 1
  const inbox = receiptInbox(expenses)
  const recent = [...ranged]
    .filter((e) => e.status !== 'draft')
    .sort((a, b) => new Date(b.date || b.uploadedAt).getTime() - new Date(a.date || a.uploadedAt).getTime())
  const month = monthLabel(to)
  const q = `from=${from}&to=${to}`
  const canSubmit = canSubmitAccounting(user)

  return (
    <div className="acct-body">
      <section className="acct-summary">
        <article>
          <b>{formatEur(total)}</b>
          <span>Total spend</span>
          <em>{month.split(' ')[0]}</em>
        </article>
        <article>
          <b>{pendingRows.length}</b>
          <span>To approve</span>
          <em>{formatEur(pendingAmt)} pending</em>
        </article>
        <article>
          <b>{processed}</b>
          <span>Receipts</span>
          <em>Processed</em>
        </article>
      </section>

      <div className="acct-bento">
        <section className="acct-panel">
          <header className="acct-panel-head">
            <h2>Spending</h2>
          </header>
          <p className="acct-figure">{formatEur(total)}</p>
          <p className="acct-figure-sub">{month}</p>
          {byCat.length ? (
            <ul className="acct-spend">
              {byCat.map((row) => (
                <li key={row.id}>
                  <div>
                    <span>{row.label}</span>
                    <b>{formatEur(row.amount)}</b>
                  </div>
                  <i style={{ width: `${Math.max(4, (row.amount / maxCat) * 100)}%` }} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="acct-empty">No approved spend in this range.</p>
          )}
        </section>

        <section className="acct-panel">
          <header className="acct-panel-head">
            <h2>Receipt inbox</h2>
            <p>
              {inbox.length
                ? `${inbox.length} item${inbox.length === 1 ? '' : 's'} need${inbox.length === 1 ? 's' : ''} review`
                : 'Nothing waiting'}
            </p>
          </header>
          {inbox.length ? (
            <ul className="acct-inbox">
              {inbox.map((exp) => {
                const ready = Boolean(exp.vendor && exp.eurAmount != null)
                return (
                  <li key={exp.id}>
                    <div>
                      <strong>{exp.receipt?.name || exp.vendor || exp.ref}</strong>
                      <span>
                        {exp.eurAmount != null ? formatEur(exp.eurAmount) : 'Enter amount'}
                      </span>
                      <em>{exp.category ? expenseCategoryLabel[exp.category] : 'Uncategorised'}</em>
                      <em className={ready ? 'is-ai' : 'is-wait'}>{ready ? 'Ready to submit' : 'Needs review'}</em>
                    </div>
                    <button className="text-link" type="button" onClick={() => openReview(exp.id)}>
                      Review →
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="acct-empty">No receipts waiting for confirmation.</p>
          )}
          {canSubmit ? (
            <div className="acct-inbox-upload">
              <ReceiptCapture
                combinedLabel="Scan / Upload receipt"
                onFile={(file) => {
                  const id = addReceipt(file)
                  openReview(id)
                }}
              />
            </div>
          ) : null}
        </section>
      </div>

      <section className="acct-panel acct-recent">
        <header className="acct-panel-head">
          <h2>Recent expenses</h2>
          <Link className="text-link" to={`/accounting/expenses?${q}`}>
            View all expenses →
          </Link>
        </header>
        {recent.length ? (
          <table className="acct-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Expense</th>
                <th>Category</th>
                <th>Location</th>
                <th>Submitted by</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.slice(0, 8).map((exp) => {
                const who = crew.find((c) => c.id === exp.uploadedBy)
                return (
                  <tr key={exp.id}>
                    <td>{formatExpenseDay(exp.date || exp.uploadedAt)}</td>
                    <td>
                      <Link to={`/accounting/expenses/${exp.id}`}>{expenseTitle(exp)}</Link>
                    </td>
                    <td>{exp.category ? expenseCategoryLabel[exp.category] : '—'}</td>
                    <td>{expensePlace(exp) || '—'}</td>
                    <td>{who?.title ?? '—'}</td>
                    <td>{formatEur(exp.eurAmount)}</td>
                    <td>
                      <ExpenseStatus status={exp.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <p className="acct-empty">No expenses in this range.</p>
        )}
      </section>
    </div>
  )
}
