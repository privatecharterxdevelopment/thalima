import { useLocation, useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { deptLabel } from '../data/crew'
import { taskAssignees } from '../lib/format'
import { isEmergencyDismissed, openEmergencies } from '../lib/notices'
import { useStore } from '../store'

export function EmergencyAlert() {
  const { user, tasks, dismissedEmergencies, dismissEmergency, claimEmergency } = useStore()
  const nav = useNavigate()
  const loc = useLocation()

  if (!user) return null

  const alerts = openEmergencies(tasks).filter((t) => {
    if (isEmergencyDismissed(user.id, t.id, dismissedEmergencies)) return false
    if (loc.pathname === `/board/${t.id}`) return false
    if (taskAssignees(t).includes(user.id) && t.status === 'doing') return false
    return true
  })

  if (!alerts.length) return null

  return (
    <div className="em-alert-layer" role="region" aria-label="Emergency alerts">
      {alerts.map((task) => (
        <article key={task.id} className="em-alert">
          <button
            className="em-alert-x"
            type="button"
            aria-label="Dismiss — I cannot take this"
            onClick={() => dismissEmergency(task.id)}
          >
            <X size={16} strokeWidth={2} />
          </button>
          <p className="em-alert-kicker">Emergency · all crew</p>
          <h2>{task.title}</h2>
          {task.body ? <p>{task.body}</p> : null}
          <small>{deptLabel[task.department]}</small>
          <div className="em-alert-actions">
            <button
              className="btn ghost"
              type="button"
              onClick={() => nav(`/board/${task.id}`)}
            >
              Open
            </button>
            <button
              className="btn"
              type="button"
              onClick={() => {
                claimEmergency(task.id)
                nav(`/board/${task.id}`)
              }}
            >
              Take on
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
