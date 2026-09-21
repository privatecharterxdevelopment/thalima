import { crew, deptLabel, urgencyLabel } from '../data/crew'
import { clock, dueState, taskAssignees } from '../lib/format'
import type { Task } from '../types'
import { Avatar } from './Avatar'
import { useUi } from '../ui'
import { useRef } from 'react'

export function TaskCard({
  task,
  draggable,
  onDragStart,
  fresh,
}: {
  task: Task
  draggable?: boolean
  onDragStart?: () => void
  fresh?: boolean
}) {
  const { openTask } = useUi()
  const dragged = useRef(false)
  const people = taskAssignees(task)
    .map((id) => crew.find((c) => c.id === id))
    .filter(Boolean)
  const due = dueState(task.due)
  return (
    <article
      className={`task ${fresh ? 'is-new' : ''}`}
      data-urgency={task.urgency}
      draggable={draggable}
      onDragStart={() => {
        dragged.current = true
        onDragStart?.()
      }}
      onClick={() => {
        if (dragged.current) {
          dragged.current = false
          return
        }
        openTask(task.id)
      }}
    >
      <div className="task-meta">
        <span className="pill">{urgencyLabel[task.urgency]}</span>
        <span style={{ color: due === 'overdue' ? 'var(--now)' : undefined }}>
          {due === 'overdue' ? 'Overdue ' : ''}
          {clock(task.due)}
        </span>
      </div>
      <h3>
        {task.title}
        {fresh && <i className="new-dot">New</i>}
      </h3>
      <p className="body">{task.body}</p>
      <div className="task-meta">
        <span>{deptLabel[task.department]}</span>
        {task.files?.length ? <span>{task.files.length} file{task.files.length > 1 ? 's' : ''}</span> : null}
        <span className="task-who">
          {people.map((who) => (
            <Avatar key={who!.id} person={who!} size="sm" />
          ))}
        </span>
      </div>
    </article>
  )
}
