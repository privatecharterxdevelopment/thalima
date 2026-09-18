import { useState } from 'react'
import { deptLabel, statusLabel, statusOrder, urgencyLabel } from '../data/crew'
import { canMoveTask, canSeeTask, sortTasks } from '../lib/format'
import { useStore } from '../store'
import { TaskCard } from '../components/TaskCard'
import { NewTask } from '../components/NewTask'
import type { Department, TaskStatus, Urgency } from '../types'

export function Board() {
  const { user, tasks, moveTask } = useStore()
  const [open, setOpen] = useState(false)
  const [dept, setDept] = useState<Department | 'all'>('all')
  const [urg, setUrg] = useState<Urgency | 'all'>('all')
  const [drag, setDrag] = useState<string | null>(null)

  if (!user) return null

  const visible = tasks
    .filter((t) => canSeeTask(user, t))
    .filter((t) => dept === 'all' || t.department === dept)
    .filter((t) => urg === 'all' || t.urgency === urg)

  const canCreate = user.level <= 2

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Assignment</p>
          <h1>Board</h1>
          <p>
            Drag a card to move it. You only see what your level allows. Time and urgency sit on every
            job.
          </p>
        </div>
        {canCreate && (
          <button className="btn" onClick={() => setOpen(true)}>
            Assign task
          </button>
        )}
      </div>

      <div className="filters" style={{ marginBottom: '1.2rem' }}>
        {(['all', 'bridge', 'engineering', 'interior', 'galley', 'deck'] as const).map((d) => (
          <button key={d} className={dept === d ? 'on' : ''} onClick={() => setDept(d)}>
            {d === 'all' ? 'All houses' : deptLabel[d]}
          </button>
        ))}
        {(['all', 'emergency', 'now', 'soon', 'routine'] as const).map((u) => (
          <button key={u} className={urg === u ? 'on' : ''} onClick={() => setUrg(u)}>
            {u === 'all' ? 'Any urgency' : urgencyLabel[u]}
          </button>
        ))}
      </div>

      <div className="kanban">
        {statusOrder.map((status) => {
          const col = visible.filter((t) => t.status === status).sort(sortTasks)
          return (
            <section
              key={status}
              className="col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!drag) return
                const task = tasks.find((t) => t.id === drag)
                if (task && canMoveTask(user, task)) moveTask(drag, status as TaskStatus)
                setDrag(null)
              }}
            >
              <header>
                <span>{statusLabel[status]}</span>
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
      {open && <NewTask onClose={() => setOpen(false)} />}
    </>
  )
}
