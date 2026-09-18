import { crew } from '../data/crew'
import { clock, dueState, relative } from '../lib/format'
import { deptLabel, urgencyLabel } from '../data/crew'
import type { Task } from '../types'
import { Avatar } from './Avatar'

export function TaskCard({
  task,
  clamp = true,
  draggable,
  onDragStart,
}: {
  task: Task
  clamp?: boolean
  draggable?: boolean
  onDragStart?: () => void
}) {
  const who = crew.find((c) => c.id === task.assigneeId)
  const due = dueState(task.due)
  return (
    <article
      className="task"
      data-urgency={task.urgency}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <div className="task-meta" style={{ marginTop: 0 }}>
        <span className="pill">{urgencyLabel[task.urgency]}</span>
        <span style={{ color: due === 'overdue' ? 'var(--now)' : undefined }}>
          {due === 'overdue' ? 'Overdue · ' : ''}
          {clock(task.due)}
        </span>
      </div>
      <h3>{task.title}</h3>
      <p className="body" style={clamp ? undefined : { WebkitLineClamp: 'unset', display: 'block' }}>
        {task.body}
      </p>
      <div className="task-meta">
        <span>{deptLabel[task.department]}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {who && <Avatar person={who} size="sm" />}
          {relative(task.due)}
        </span>
      </div>
    </article>
  )
}
