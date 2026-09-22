import { crew, deptLabel } from '../data/crew'
import { dueLine, taskAssignees } from '../lib/format'
import type { CrewMember, Task } from '../types'
import { useNavigate } from 'react-router-dom'
import { WhoLine } from './WhoLine'

export function TaskCard({ task }: { task: Task }) {
  const nav = useNavigate()
  const people = taskAssignees(task)
    .map((id) => crew.find((c) => c.id === id))
    .filter((who): who is CrewMember => Boolean(who))
  const bits = [deptLabel[task.department], dueLine(task.due)].filter(Boolean)
  const done = task.status === 'done'

  return (
    <article className="task ops-card" onClick={() => nav(`/board/${task.id}`)}>
      <div>
        <h3>{task.title}</h3>
        <p className="ops-meta">{bits.join(' · ')}</p>
        <WhoLine people={people} />
      </div>
      <span className={`task-chip ${done ? 'is-done' : 'is-pending'}`}>{done ? 'Confirmed' : 'Pending'}</span>
    </article>
  )
}
