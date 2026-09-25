import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Avatar } from '../../components/Avatar'
import { ExpenseStatus } from '../../components/ExpenseStatus'
import { ReceiptCapture } from '../../components/ReceiptCapture'
import { crew } from '../../data/crew'
import {
  canApproveExpense,
  canEditExpense,
  canRejectExpense,
  eligibleApprovers,
  expenseCategoryLabel,
  expenseCategoryOptions,
  categoryOptionId,
  extractionWarnings,
  expensePlace,
  formatEur,
  formatExpenseDate,
  missingExpenseFields,
  romeDateInput,
} from '../../lib/accounting'
import { useStore } from '../../store'
import type { ExpenseCategory } from '../../types'

export function AccountingDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user, expenses, updateExpense, submitExpense, approveExpense, rejectExpense } = useStore()
  if (!user) return null

  const exp = expenses.find((e) => e.id === id)
  if (!exp) return <Navigate to="/accounting/expenses" replace />

  const who = crew.find((c) => c.id === exp.uploadedBy)
  const approver = crew.find((c) => c.id === (exp.approvedBy ?? exp.approverId ?? ''))
  const edit = canEditExpense(user, exp)
  const warnings = extractionWarnings(exp)
  const missing = missingExpenseFields(exp)
  const canSubmit = edit && exp.status === 'draft' && !missing.length && Boolean(exp.approverId)
  const approvers = eligibleApprovers(exp.uploadedBy)

  return (
    <article className="acct-detail">
      <Link className="task-page-back" to="/accounting/expenses">
        <ArrowLeft size={16} strokeWidth={2} />
        Expenses
      </Link>
      <div className="acct-detail-grid">
        <section className="acct-card acct-slip">
          <h2>Original</h2>
          {exp.receipt?.type.startsWith('image/') ? (
            <img src={exp.receipt.dataUrl} alt={exp.receipt.name} />
          ) : exp.receipt?.type === 'application/pdf' ? (
            <iframe title={exp.receipt.name} src={exp.receipt.dataUrl} />
          ) : (
            <p className="acct-missing">No receipt attached</p>
          )}
          {edit && !exp.receipt ? <ReceiptCapture onFile={(file) => updateExpense(exp.id, { receipt: file })} /> : null}
        </section>

        <section className="acct-card">
          <p className="acct-ref">{exp.ref}</p>
          {edit ? (
            <label>
              Vendor
              <input value={exp.vendor} onChange={(e) => updateExpense(exp.id, { vendor: e.target.value })} />
            </label>
          ) : (
            <h2>{exp.vendor || 'Untitled'}</h2>
          )}

          {exp.status === 'draft' && !exp.extraction.completed ? (
            <p className="acct-warn">
              Enter the values from the original receipt before submitting.
            </p>
          ) : null}
          {warnings.length ? (
            <p className="acct-warn">
              Review before approval: {warnings.map((f) => f.replace(/([A-Z])/g, ' $1').toLowerCase()).join(', ')}.
            </p>
          ) : null}

          <dl className="acct-fields">
            <div>
              <dt>Amount</dt>
              <dd>
                {edit ? (
                  <span className="acct-money">
                    <input
                      type="number"
                      step="0.01"
                      value={exp.amount ?? ''}
                      onChange={(e) =>
                        updateExpense(exp.id, {
                          amount: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                    />
                    <select
                      value={exp.currency}
                      onChange={(e) => updateExpense(exp.id, { currency: e.target.value })}
                    >
                      {['EUR', 'USD', 'GBP', 'CHF'].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </span>
                ) : (
                  formatEur(exp.eurAmount)
                )}
              </dd>
            </div>
            {edit && exp.currency !== 'EUR' ? (
              <div>
                <dt>EUR amount</dt>
                <dd>
                  <input
                    type="number"
                    step="0.01"
                    value={exp.eurAmount ?? ''}
                    onChange={(e) =>
                      updateExpense(exp.id, {
                        eurAmount: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                  <small>Enter the EUR figure. No rate is applied automatically.</small>
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Category</dt>
              <dd>
                {edit ? (
                  <select
                    value={categoryOptionId(exp.category)}
                    onChange={(e) => updateExpense(exp.id, { category: e.target.value as ExpenseCategory })}
                  >
                    <option value="">Select</option>
                    {expenseCategoryOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : exp.category ? (
                  expenseCategoryLabel[exp.category]
                ) : (
                  '—'
                )}
              </dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>
                {edit ? (
                  <input
                    value={exp.place ?? expensePlace(exp)}
                    onChange={(e) => updateExpense(exp.id, { place: e.target.value })}
                    placeholder="Port, marina, town"
                  />
                ) : (
                  expensePlace(exp) || '—'
                )}
              </dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>
                {edit ? (
                  <input
                    type="date"
                    value={romeDateInput(exp.date)}
                    onChange={(e) => updateExpense(exp.id, { date: `${e.target.value}T12:00:00+02:00` })}
                  />
                ) : (
                  formatExpenseDate(exp.date || exp.uploadedAt)
                )}
              </dd>
            </div>
            <div>
              <dt>VAT</dt>
              <dd>
                {edit ? (
                  <input
                    type="number"
                    step="0.01"
                    value={exp.vat ?? ''}
                    onChange={(e) =>
                      updateExpense(exp.id, { vat: e.target.value === '' ? null : Number(e.target.value) })
                    }
                  />
                ) : (
                  formatEur(exp.vat)
                )}
              </dd>
            </div>
            <div>
              <dt>Invoice no.</dt>
              <dd>
                {edit ? (
                  <input
                    value={exp.invoiceNo}
                    onChange={(e) => updateExpense(exp.id, { invoiceNo: e.target.value })}
                  />
                ) : (
                  exp.invoiceNo || '—'
                )}
              </dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>
                {edit ? (
                  <textarea
                    rows={3}
                    value={exp.description}
                    onChange={(e) => updateExpense(exp.id, { description: e.target.value })}
                  />
                ) : (
                  exp.description || '—'
                )}
              </dd>
            </div>
            <div>
              <dt>Uploaded by</dt>
              <dd>
                <span className="acct-who">
                  {who ? <Avatar person={who} size="sm" /> : null}
                  {who?.name ?? '—'}
                </span>
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <ExpenseStatus status={exp.status} />
              </dd>
            </div>
            <div>
              <dt>{exp.status === 'pending' ? 'Approval required' : 'Approver'}</dt>
              <dd>
                {edit && exp.status !== 'approved' ? (
                  <select
                    value={exp.approverId ?? ''}
                    onChange={(e) => updateExpense(exp.id, { approverId: e.target.value || null })}
                  >
                    <option value="">Select</option>
                    {approvers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.title}
                      </option>
                    ))}
                  </select>
                ) : approver ? (
                  `${approver.name} · ${approver.title}`
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>

          <div className="acct-detail-actions">
            {canSubmit ? (
              <button className="btn" type="button" onClick={() => submitExpense(exp.id)}>
                Submit for approval
              </button>
            ) : null}
            {canRejectExpense(user, exp) ? (
              <button className="btn ghost" type="button" onClick={() => rejectExpense(exp.id)}>
                Reject
              </button>
            ) : null}
            {canApproveExpense(user, exp) ? (
              <button
                className="btn"
                type="button"
                onClick={() => {
                  approveExpense(exp.id)
                  nav('/accounting/approvals')
                }}
              >
                Approve
              </button>
            ) : null}
          </div>
        </section>
      </div>

      <section className="acct-card">
        <h2>Activity</h2>
        <ol className="acct-log">
          {exp.notes.map((n) => {
            const author = crew.find((c) => c.id === n.authorId)
            return (
              <li key={n.id}>
                {author ? <Avatar person={author} size="sm" /> : null}
                <div>
                  <p>{n.text}</p>
                  <time>{formatExpenseDate(n.at)}</time>
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    </article>
  )
}
