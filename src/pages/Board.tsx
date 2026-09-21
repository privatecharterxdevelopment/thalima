import { useEffect, useState } from 'react'
import { deptLabel, urgencyLabel } from '../data/crew'
import { canMoveTask, canSeeTask, sortTasks } from '../lib/format'
import { useStore } from '../store'
import { TaskCard } from '../components/TaskCard'
import type { Department, TaskStatus, Urgency } from '../types'

const lanes = [
  { key: 'pending', label: 'Pending', accept: ['backlog', 'ready', 'doing', 'waiting'] as TaskStatus[], drop: 'ready' as TaskStatus },
  { key: 'done', label: 'Done', accept: ['done'] as TaskStatus[], drop: 'done' as TaskStatus },
]

export function Board() {
  const { user, tasks, moveTask, markTasksSeen } = useStore()
  const [dept, setDept] = useState<Department | 'all'>('all')
  const [urg, setUrg] = useState<Urgency | 'all'>('all')
  const [drag, setDrag] = useState<string | null>(null)

  useEffect(() => {
    markTasksSeen()
  }, [markTasksSeen])

  if (!user) return null

  const visible = tasks
    .filter((t) => canSeeTask(user, t))
    .filter((t) => dept === 'all' || t.department === dept)
    .filter((t) => urg === 'all' || t.urgency === urg)

  const depts: Array<Department | 'all'> =
    user.level === 1 ? ['all', 'bridge', 'engineering', 'interior', 'galley', 'deck'] : ['all', user.department]

  return (
    <div className="board-modern">
      <div className="filters">
        {depts.map((d) => (
          <button key={d} className={dept === d ? 'on' : ''} onClick={() => setDept(d)}>
            {d === 'all' ? 'All' : deptLabel[d]}
          </button>
        ))}
        {(['all', 'emergency', 'now', 'soon', 'routine'] as const).map((u) => (
          <button key={u} className={urg === u ? 'on' : ''} onClick={() => setUrg(u)}>
            {u === 'all' ? 'Any' : urgencyLabel[u]}
          </button>
        ))}
      </div>

      <div className="kanban modern">
        {lanes.map((lane) => {
          const col = visible.filter((t) => lane.accept.includes(t.status)).sort(sortTasks)
          return (
            <section
              key={lane.key}
              className={`col ${lane.key === 'pending' ? 'is-wide' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!drag) return
                const task = tasks.find((t) => t.id === drag)
                if (task && canMoveTask(user, task) && !lane.accept.includes(task.status)) {
                  moveTask(drag, lane.drop)
                }
                setDrag(null)
              }}
            >
              <header>
                <span>{lane.label}</span>
                <span>{col.length}</span>
              </header>
              {col.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  draggable={canMoveTask(user, t)}
                  onDragStart={() => setDrag(t.id)}
                />
              ))}
            </section>
          )
        })}
      </div>
    </div>
  )
}
