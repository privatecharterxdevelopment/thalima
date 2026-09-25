import { Link, useNavigate } from 'react-router-dom'
import { crew } from '../data/crew'
import {
  canEditExpense,
  currencies,
  defaultApproverId,
  eligibleApprovers,
  expenseCategoryLabel,
  expenseCategoryOptions,
  categoryOptionId,
  formatEur,
  formatExpenseDate,
  missingExpenseFields,
  expensePlace,
  romeDateInput,
} from '../lib/accounting'
import { useStore } from '../store'
import type { ExpenseCategory } from '../types'

export function ReceiptReview({ id, onClose }: { id: string; onClose: () => void }) {
  const nav = useNavigate()
  const { user, expenses, updateExpense, submitExpense } = useStore()
  const exp = expenses.find((e) => e.id === id)
  if (!user || !exp) return null

  const who = crew.find((c) => c.id === exp.uploadedBy)
  const edit = canEditExpense(user, exp)
  const missing = missingExpenseFields(exp)
  const canSubmit = edit && exp.status === 'draft' && !missing.length && Boolean(exp.approverId)
  const approvers = eligibleApprovers(exp.uploadedBy)

  return (
    <div className="acct-drawer-back" onClick={onClose}>
      <aside className="acct-drawer" onClick={(e) => e.stopPropagation()}>
        <header>
          <div>
            <p className="acct-kicker">{exp.source === 'manual' ? 'Manual entry' : 'Receipt uploaded'}</p>
            <h2>{exp.vendor || exp.receipt?.name || exp.ref}</h2>
          </div>
          <button className="btn ghost" type="button" onClick={onClose}>
            Close
          </button>
        </header>

        {exp.receipt?.type.startsWith('image/') ? (
          <img className="acct-drawer-slip" src={exp.receipt.dataUrl} alt={exp.receipt.name} />
        ) : exp.receipt ? (
          <p className="acct-hint">{exp.receipt.name}</p>
        ) : (
          <p className="acct-hint">No original attached.</p>
        )}

        {edit ? (
          <p className="acct-hint">
            Fill in the fields from the original receipt, then submit for approval.
          </p>
        ) : null}

        <dl className="acct-review">
          <div>
            <dt>Merchant</dt>
            <dd>
              {edit ? (
                <input value={exp.vendor} onChange={(e) => updateExpense(exp.id, { vendor: e.target.value })} />
              ) : (
                exp.vendor || '—'
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
                formatExpenseDate(exp.date)
              )}
            </dd>
          </div>
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
                      updateExpense(exp.id, { amount: e.target.value === '' ? null : Number(e.target.value) })
                    }
                  />
                  <select value={exp.currency} onChange={(e) => updateExpense(exp.id, { currency: e.target.value })}>
                    {currencies.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </span>
              ) : (
                formatEur(exp.eurAmount)
              )}
            </dd>
          </div>
          <div>
            <dt>VAT / Tax</dt>
            <dd>
              {edit ? (
                <input
                  type="number"
                  step="0.01"
                  value={exp.vat ?? ''}
                  onChange={(e) => updateExpense(exp.id, { vat: e.target.value === '' ? null : Number(e.target.value) })}
                />
              ) : (
                formatEur(exp.vat)
              )}
            </dd>
          </div>
          <div>
            <dt>Category</dt>
            <dd>
              {edit ? (
                <select
                  value={categoryOptionId(exp.category)}
                  onChange={(e) => updateExpense(exp.id, { category: e.target.value as ExpenseCategory | '' })}
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
            <dt>Payment method</dt>
            <dd>
              {edit ? (
                <input
                  value={exp.paymentMethod ?? ''}
                  onChange={(e) => updateExpense(exp.id, { paymentMethod: e.target.value })}
                  placeholder="Yacht account, cash…"
                />
              ) : (
                exp.paymentMethod || '—'
              )}
            </dd>
          </div>
          <div>
            <dt>Submitted by</dt>
            <dd>
              {who?.title ?? '—'}
              {who ? ` · ${who.name}` : ''}
            </dd>
          </div>
          <div>
            <dt>Vessel</dt>
            <dd>Thalima</dd>
          </div>
          <div>
            <dt>Notes</dt>
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
          {edit && exp.status === 'draft' ? (
            <div>
              <dt>Approver</dt>
              <dd>
                <select
                  value={exp.approverId ?? defaultApproverId(exp.uploadedBy) ?? ''}
                  onChange={(e) => updateExpense(exp.id, { approverId: e.target.value })}
                >
                  {approvers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="acct-drawer-actions">
          {exp.receipt ? (
            <Link className="btn ghost" to={`/accounting/expenses/${exp.id}`}>
              View original receipt
            </Link>
          ) : null}
          <Link className="btn ghost" to={`/accounting/expenses/${exp.id}`}>
            Edit details
          </Link>
          {exp.status === 'draft' ? (
            <button
              className="btn"
              type="button"
              disabled={!canSubmit}
              onClick={() => {
                submitExpense(exp.id)
                onClose()
                nav('/accounting/approvals')
              }}
            >
              Submit expense
            </button>
          ) : (
            <button className="btn" type="button" onClick={onClose}>
              Done
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}
