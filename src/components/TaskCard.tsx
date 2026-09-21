import { crew, deptLabel, statusLabel } from '../data/crew'
import { elapsedShort, taskAssignees, taskOnlineMs } from '../lib/format'
import type { Task } from '../types'
import { useNavigate } from 'react-router-dom'

export function TaskCard({ task }: { task: Task }) {
  const nav = useNavigate()
  const who = taskAssignees(task)
    .map((id) => crew.find((c) => c.id === id))
    .filter(Boolean)[0]
  const bits = [
    who?.name.split(' ')[0],
    deptLabel[task.department],
    elapsedShort(taskOnlineMs(task)),
    task.status !== 'open' ? statusLabel[task.status] : null,
  ].filter(Boolean)

  return (
    <article className="task ops-card" onClick={() => nav(`/board/${task.id}`)}>
      <h3>{task.title}</h3>
      <p className="ops-meta">{bits.join(' · ')}</p>
    </article>
  )
}
