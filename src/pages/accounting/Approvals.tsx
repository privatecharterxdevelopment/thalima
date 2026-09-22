import { Link } from 'react-router-dom'
import { Avatar } from '../../components/Avatar'
import { ExpenseStatus } from '../../components/ExpenseStatus'
import { crew } from '../../data/crew'
import { canApproveExpense, canReviewAccounting, expenseCategoryLabel, formatEur, formatExpenseDate } from '../../lib/accounting'
import { useStore } from '../../store'

export function AccountingApprovals() {
  const { user, expenses, approveExpense, rejectExpense } = useStore()
  if (!user) return null

  const queue = expenses
    .filter((e) => canApproveExpense(user, e))
    .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())

  if (!canReviewAccounting(user)) {
    return (
      <div className="acct-body">
        <section className="acct-card">
          <p className="acct-empty">Approvals are for the accountant and captain.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="acct-body">
      <section className="acct-card">
        <h2>Waiting on you</h2>
        {queue.length ? (
          <ul className="acct-queue">
            {queue.map((exp) => {
              const who = crew.find((c) => c.id === exp.uploadedBy)
              return (
                <li key={exp.id}>
                  <div className="acct-queue-preview">
                    {exp.receipt?.type.startsWith('image/') ? (
                      <img src={exp.receipt.dataUrl} alt="" />
                    ) : exp.receipt ? (
                      <span>PDF</span>
                    ) : (
                      <span>No receipt</span>
                    )}
                  </div>
                  <div className="acct-queue-copy">
                    <p className="acct-ref">{exp.ref}</p>
                    <h3>{exp.vendor || 'Untitled'}</h3>
                    <p>
                      {formatEur(exp.eurAmount)} · {exp.category ? expenseCategoryLabel[exp.category] : 'Uncategorised'} ·{' '}
                      {formatExpenseDate(exp.date || exp.uploadedAt)}
                    </p>
                    <span className="acct-who">
                      {who ? <Avatar person={who} size="sm" /> : null}
                      Uploaded by {who?.name.split(' ')[0] ?? 'crew'}
                      <ExpenseStatus status={exp.status} />
                    </span>
                  </div>
                  <div className="acct-queue-actions">
                    <button className="btn ghost" type="button" onClick={() => rejectExpense(exp.id)}>
                      Reject
                    </button>
                    <Link className="btn ghost" to={`/accounting/expenses/${exp.id}`}>
                      Edit
                    </Link>
                    <button className="btn" type="button" onClick={() => approveExpense(exp.id)}>
                      Approve
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="acct-empty">Nothing waiting on your approval.</p>
        )}
      </section>
    </div>
  )
}
