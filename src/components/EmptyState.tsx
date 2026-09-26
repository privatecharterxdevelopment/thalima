import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function EmptyState({
  title,
  body,
  action,
  className = '',
}: {
  title: string
  body?: string
  action?: { to: string; label: string } | { onClick: () => void; label: string }
  className?: string
}) {
  let cta: ReactNode = null
  if (action) {
    if ('to' in action) {
      cta = (
        <Link className="btn ghost empty-state-cta" to={action.to}>
          {action.label}
        </Link>
      )
    } else {
      cta = (
        <button type="button" className="btn ghost empty-state-cta" onClick={action.onClick}>
          {action.label}
        </button>
      )
    }
  }

  return (
    <div className={`empty-state ${className}`.trim()}>
      <strong>{title}</strong>
      {body ? <p>{body}</p> : null}
      {cta}
    </div>
  )
}
