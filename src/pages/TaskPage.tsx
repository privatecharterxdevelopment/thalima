import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { AssignPicks } from '../components/AssignPicks'
import { WhoLine } from '../components/WhoLine'
import { StatusPill, statusTone } from '../components/StatusPill'
import { FileAdd, FileList } from '../components/FileList'
import { crew, deptLabel } from '../data/crew'
import { canMoveTask, canSeeTask, dueLine, relative, taskAssignees } from '../lib/format'
import { awaitLabel, kindLabel } from '../lib/opsTasks'
import { useStore } from '../store'
import type { CrewMember } from '../types'

export function TaskPage() {
  const { taskId } = useParams()
  const { user, tasks, updateTask, addTaskNote } = useStore()
  const [note, setNote] = useState('')
  const [pop, setPop] = useState(false)
  const popTimer = useRef<number>(0)

  useEffect(() => () => window.clearTimeout(popTimer.current), [])

  if (!user) return null

  const task = tasks.find((t) => t.id === taskId)
  if (!task || !canSeeTask(user, task)) return <Navigate to="/board" replace />

  const can = canMoveTask(user, task)
  const done = task.status === 'done' || pop
  const people = taskAssignees(task)
    .map((id) => crew.find((c) => c.id === id))
    .filter((who): who is CrewMember => Boolean(who))
  const log = [...(task.notes ?? [])].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
  const waiting = !done && task.status === 'waiting' && task.awaitReason ? awaitLabel[task.awaitReason] : null

  function confirm() {
    if (!task || !can || done) return
    setPop(true)
    window.clearTimeout(popTimer.current)
    popTimer.current = window.setTimeout(() => {
      updateTask(task.id, { status: 'done' })
    }, 380)
  }

  function post(e: FormEvent) {
    e.preventDefault()
    if (!task || !can || !note.trim()) return
    addTaskNote(task.id, note)
    setNote('')
  }

  return (
    <article className="task-page">
      <Link className="task-page-back" to="/board">
        <ArrowLeft size={16} strokeWidth={2} />
        Tasks
      </Link>

      <div className="task-page-grid">
        <div className="task-page-main">
          <div className="task-page-tags">
            <StatusPill status={done ? 'done' : task.status} tone={done ? 'done' : statusTone(task)} />
            <span>
              {deptLabel[task.department]} · {kindLabel[task.kind]}
            </span>
          </div>
          <h2 className="task-page-title">{task.title}</h2>
          <p className="task-page-body">{task.body}</p>
          <div className="task-page-meta">
            <WhoLine people={people} />
            <p>
              {dueLine(task.due)}
              {waiting ? ` · ${waiting}` : ''}
            </p>
          </div>

          {can ? (
            <button
              type="button"
              className={`task-confirm ${done ? 'is-done' : ''} ${pop ? 'is-pop' : ''}`}
              disabled={done}
              onClick={confirm}
            >
              <span className="task-confirm-label">Confirm</span>
              <span className="task-confirm-check" aria-hidden>
                <Check size={22} strokeWidth={2.6} />
              </span>
            </button>
          ) : null}

          {can && !done && user.level === 1 ? (
            <div className="task-assign">
              <span>Assigned crew</span>
              <AssignPicks
                value={taskAssignees(task)}
                date={task.due}
                onChange={(ids) => {
                  const first = crew.find((c) => c.id === ids[0])
                  updateTask(task.id, {
                    assigneeIds: ids,
                    assigneeId: ids[0] ?? task.assigneeId,
                    department: first?.department ?? task.department,
                  })
                }}
              />
            </div>
          ) : null}
        </div>

        <div className="task-page-side">
          <section className="task-log">
            <p className="eyebrow">Log</p>
            {log.length === 0 ? <p className="task-log-empty">No notes yet.</p> : null}
            {log.map((entry) => {
              const who = crew.find((c) => c.id === entry.authorId)
              const sys = entry.kind && entry.kind !== 'note'
              return (
                <article key={entry.id} className={sys ? 'task-log-item is-sys' : 'task-log-item'}>
                  <span className="task-log-dot" />
                  <div>
                    <p>
                      <b>{who?.name.split(' ')[0] ?? 'Crew'}</b>
                      <time>{relative(entry.at)}</time>
                    </p>
                    {sys && entry.kind === 'status' ? (
                      <>
                        <p className="task-log-sys">Status changed</p>
                        <p>{entry.text}</p>
                      </>
                    ) : (
                      <p>{entry.text}</p>
                    )}
                  </div>
                </article>
              )
            })}
          </section>

          <FileList
            files={task.files ?? []}
            onRemove={
              can
                ? (id) => updateTask(task.id, { files: (task.files ?? []).filter((f) => f.id !== id) })
                : undefined
            }
          />

          {can ? (
            <form className="task-compose" onSubmit={post}>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note to the log…"
              />
              <div>
                <div className="task-compose-actions">
                  <FileAdd
                    files={task.files ?? []}
                    onChange={(files) => updateTask(task.id, { files })}
                  />
                  <FileAdd
                    files={task.files ?? []}
                    onChange={(files) => updateTask(task.id, { files })}
                    accept="image/*"
                    label="Photo"
                  />
                </div>
                <button className="btn" type="submit" disabled={!note.trim()}>
                  Post
                </button>
              </div>
            </form>
          ) : (
            <p className="hint">You can read this. Confirm is for the assigned station.</p>
          )}
        </div>
      </div>
    </article>
  )
}
