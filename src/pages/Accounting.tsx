import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ReceiptCapture } from '../components/ReceiptCapture'
import { ReceiptReview } from '../components/ReceiptReview'
import { canSubmitAccounting, firstOfRomeMonth, formatRangeLabel, romeDateInput } from '../lib/accounting'
import { useStore } from '../store'

const views = [
  { to: '/accounting', end: true, label: 'Overview' },
  { to: '/accounting/expenses', label: 'Expenses' },
  { to: '/accounting/approvals', label: 'Approvals' },
  { to: '/accounting/reports', label: 'Reports' },
]

export function Accounting() {
  const { user, expenses, addReceipt } = useStore()
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const nav = useNavigate()
  const [menu, setMenu] = useState(false)
  const addRef = useRef<HTMLDivElement>(null)

  const from = params.get('from') || firstOfRomeMonth()
  const to = params.get('to') || romeDateInput()
  const canSubmit = Boolean(user && canSubmitAccounting(user))
  const waiting = user ? expenses.filter((e) => e.status === 'pending' && e.approverId === user.id).length : 0
  const reviewId = params.get('review')

  function setRange(key: 'from' | 'to', value: string) {
    const next = new URLSearchParams(params)
    next.set(key, value)
    setParams(next, { replace: true })
  }

  function openReview(id: string) {
    const next = new URLSearchParams(params)
    next.set('review', id)
    setParams(next)
    setMenu(false)
  }

  function closeReview() {
    const next = new URLSearchParams(params)
    next.delete('review')
    setParams(next, { replace: true })
  }

  const q = `from=${from}&to=${to}`

  useEffect(() => {
    if (!menu) return
    function onPointer(e: MouseEvent) {
      if (!addRef.current?.contains(e.target as Node)) setMenu(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenu(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu])

  if (!user) return null

  return (
    <div className="acct">
      <div className="acct-toolbar">
        <nav className="ops-views">
          {views.map((v) => (
            <NavLink
              key={v.to}
              to={`${v.to}?${q}`}
              end={v.end}
              className={({ isActive }) => {
                if (v.to === '/accounting/expenses' && location.pathname.startsWith('/accounting/expenses')) {
                  return 'on'
                }
                if (v.to === '/accounting/expenses' && location.pathname.startsWith('/accounting/receipts')) {
                  return 'on'
                }
                return isActive ? 'on' : ''
              }}
            >
              {v.label}
              {v.to === '/accounting/approvals' && waiting ? <em>{waiting}</em> : null}
            </NavLink>
          ))}
        </nav>
        <div className="acct-toolbar-end">
          <label className="acct-range">
            <span className="acct-range-text">{formatRangeLabel(from, to)}</span>
            <span className="acct-range-hits">
              <input
                type="date"
                value={from}
                aria-label="From date"
                onChange={(e) => setRange('from', e.target.value)}
              />
              <input
                type="date"
                value={to}
                aria-label="To date"
                onChange={(e) => setRange('to', e.target.value)}
              />
            </span>
          </label>
          {canSubmit ? (
            <div className="acct-add" ref={addRef}>
              <button className="btn" type="button" onClick={() => setMenu((v) => !v)}>
                + Add expense
              </button>
              {menu ? (
                <div className="acct-add-menu">
                  <ReceiptCapture
                    onFile={(file) => {
                      const id = addReceipt(file)
                      nav(`/accounting?${q}&review=${id}`)
                      setMenu(false)
                    }}
                  />
                  <Link className="acct-add-manual" to={`/accounting/new?${q}`} onClick={() => setMenu(false)}>
                    Manual expense
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <Outlet context={{ from, to, openReview }} />
      {reviewId ? <ReceiptReview id={reviewId} onClose={closeReview} /> : null}
    </div>
  )
}

export type AccountingOutlet = {
  from: string
  to: string
  openReview: (id: string) => void
}
