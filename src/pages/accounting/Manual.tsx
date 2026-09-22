import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ReceiptCapture } from '../../components/ReceiptCapture'
import {
  defaultApproverId,
  eligibleApprovers,
  expenseCategoryOptions,
  romeDateInput,
} from '../../lib/accounting'
import { useStore } from '../../store'
import type { AttachedFile, ExpenseCategory } from '../../types'

export function AccountingManual() {
  const { user, addManualExpense } = useStore()
  const nav = useNavigate()
  const [vendor, setVendor] = useState('')
  const [date, setDate] = useState(romeDateInput())
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [eurAmount, setEurAmount] = useState('')
  const [vat, setVat] = useState('')
  const [category, setCategory] = useState<ExpenseCategory | ''>('')
  const [description, setDescription] = useState('')
  const [receipt, setReceipt] = useState<AttachedFile | undefined>()
  const [approverId, setApproverId] = useState(user ? defaultApproverId(user.id) ?? '' : '')
  if (!user) return null

  const approvers = eligibleApprovers(user.id)
  const eur = currency === 'EUR' ? Number(amount) : Number(eurAmount)
  const ready = vendor.trim() && amount && category && approverId && Number.isFinite(eur)

  return (
    <div className="acct-body">
      <form
        className="acct-card acct-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!ready || !category) return
          const id = addManualExpense({
            vendor,
            date: `${date}T12:00:00+02:00`,
            amount: Number(amount),
            currency,
            eurAmount: eur,
            vat: vat === '' ? null : Number(vat),
            category,
            description,
            receipt,
            approverId,
          })
          nav(`/accounting/expenses/${id}`)
        }}
      >
        <h2>Manual expense</h2>
        <p className="acct-hint">Approval is required from an accountant or the captain. All reports use EUR.</p>
        <label>
          Vendor
          <input value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="Merchant" />
        </label>
        <div className="acct-form-grid">
          <label>
            Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            Amount
            <span className="acct-money">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {['EUR', 'USD', 'GBP', 'CHF'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </span>
          </label>
        </div>
        {currency !== 'EUR' ? (
          <label>
            EUR amount
            <input
              type="number"
              step="0.01"
              value={eurAmount}
              onChange={(e) => setEurAmount(e.target.value)}
            />
            <small>Enter the EUR figure. No rate is applied automatically.</small>
          </label>
        ) : null}
        <div className="acct-form-grid">
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory | '')}>
              <option value="">Select</option>
              {expenseCategoryOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            VAT
            <input type="number" step="0.01" value={vat} onChange={(e) => setVat(e.target.value)} />
          </label>
        </div>
        <label>
          Description
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div>
          <p className="acct-label">Receipt attachment</p>
          {receipt ? <p className="acct-file">{receipt.name}</p> : <p className="acct-missing">No receipt attached</p>}
          <ReceiptCapture onFile={setReceipt} />
        </div>
        <label>
          Approver
          <select value={approverId} onChange={(e) => setApproverId(e.target.value)}>
            <option value="">Select</option>
            {approvers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.title}
              </option>
            ))}
          </select>
        </label>
        <p className="acct-hint">Approval required</p>
        <div className="acct-detail-actions">
          <button className="btn ghost" type="button" onClick={() => nav('/accounting')}>
            Cancel
          </button>
          <button className="btn" type="submit" disabled={!ready}>
            Submit expense
          </button>
        </div>
      </form>
    </div>
  )
}
