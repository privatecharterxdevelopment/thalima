import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Search } from 'lucide-react'
import { ExpenseStatus } from '../../components/ExpenseStatus'
import { crew } from '../../data/crew'
import {
  expenseCategoryLabel,
  expenseCategoryOptions,
  expensePlace,
  expenseStatusLabel,
  expenseTitle,
  filterExpenses,
  formatEur,
  formatExpenseDay,
} from '../../lib/accounting'
import { useStore } from '../../store'
import type { ExpenseCategory, ExpenseStatus as Status } from '../../types'
import type { AccountingOutlet } from '../Accounting'

export function AccountingReceipts() {
  const { user, expenses } = useStore()
  const { from, to } = useOutletContext<AccountingOutlet>()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<ExpenseCategory | 'all'>('all')
  const [uploadedBy, setUploadedBy] = useState('all')
  const [status, setStatus] = useState<Status | 'all'>('all')
  if (!user) return null

  const rows = filterExpenses(expenses, { from, to, category, uploadedBy, status, query })
    .filter((e) => status !== 'all' || e.status !== 'draft')
    .sort((a, b) => new Date(b.date || b.uploadedAt).getTime() - new Date(a.date || a.uploadedAt).getTime())

  return (
    <div className="acct-body">
      <div className="acct-filters">
        <label className="ops-search">
          <Search size={16} strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Expense, merchant, port, crew…"
          />
        </label>
        <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory | 'all')}>
          <option value="all">All categories</option>
          {expenseCategoryOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <select value={uploadedBy} onChange={(e) => setUploadedBy(e.target.value)}>
          <option value="all">Uploaded by anyone</option>
          {crew.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as Status | 'all')}>
          <option value="all">Submitted</option>
          {(Object.keys(expenseStatusLabel) as Status[]).map((id) => (
            <option key={id} value={id}>
              {expenseStatusLabel[id]}
            </option>
          ))}
        </select>
      </div>
      <section className="acct-panel">
        {rows.length ? (
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
              {rows.map((exp) => {
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
          <p className="acct-empty">No expenses match those filters.</p>
        )}
      </section>
    </div>
  )
}
