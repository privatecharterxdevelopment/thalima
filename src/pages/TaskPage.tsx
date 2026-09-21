import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AssignPicks } from '../components/AssignPicks'
import { Avatar } from '../components/Avatar'
import { FileAdd, FileList } from '../components/FileList'
import { crew, deptLabel, statusLabel } from '../data/crew'
import {
  canMoveTask,
  canSeeTask,
  elapsedClock,
  relative,
  taskAssignees,
  taskOnlineMs,
  taskWorkedMs,
} from '../lib/format'
import { awaitLabel, kindLabel } from '../lib/opsTasks'
import { useStore } from '../store'
import type { AwaitReason, TaskStatus } from '../types'

const statuses: TaskStatus[] = ['open', 'doing', 'waiting', 'done']

export function TaskPage() {
  const { taskId } = useParams()
  const { user, tasks, updateTask, addTaskNote } = useStore()
  const [now, setNow] = useState(() => Date.now())
  const [note, setNote] = useState('')

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  if (!user) return null

  const task = tasks.find((t) => t.id === taskId)
  if (!task || !canSeeTask(user, task)) return <Navigate to="/board" replace />

  const can = canMoveTask(user, task)
  const people = taskAssignees(task)
    .map((id) => crew.find((c) => c.id === id))
    .filter(Boolean)
  const author = crew.find((c) => c.id === task.createdBy)
  const log = [
    {
      id: `brief-${task.id}`,
      authorId: task.createdBy,
      text: task.body,
      at: task.createdAt,
      kind: 'note' as const,
    },
    ...(task.notes ?? []),
  ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  function setStatus(status: TaskStatus) {
    if (!task || !can || status === task.status) return
    updateTask(task.id, {
      status,
      awaitReason: status === 'waiting' ? (task.awaitReason ?? 'spare') : undefined,
    })
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
          <header className="task-page-head">
            <p className="eyebrow">
              {deptLabel[task.department]} · {kindLabel[task.kind]}
              {author ? ` · ${author.name.split(' ')[0]} opened` : ''}
            </p>
            <h1>{task.title}</h1>
            <ul className="task-page-who">
              {people.map((who) => (
                <li key={who!.id}>
                  <Avatar person={who!} />
                  <span>
                    <b>{who!.name}</b>
                    <em>{who!.title}</em>
                  </span>
                </li>
              ))}
            </ul>
          </header>

          <div className="task-clocks">
            <p>
              <span>Online</span>
              <b>{elapsedClock(taskOnlineMs(task, now))}</b>
            </p>
            <p>
              <span>Worked</span>
              <b>{elapsedClock(taskWorkedMs(task, now))}</b>
            </p>
          </div>

          <div className="task-status">
            {statuses.map((s) => (
              <button
                key={s}
                type="button"
                className={task.status === s ? 'on' : ''}
                disabled={!can}
                onClick={() => setStatus(s)}
              >
                {statusLabel[s]}
              </button>
            ))}
          </div>

          {task.status === 'waiting' && can && (
            <div className="task-status is-wait">
              {(Object.keys(awaitLabel) as AwaitReason[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={task.awaitReason === r ? 'on' : ''}
                  onClick={() => updateTask(task.id, { awaitReason: r })}
                >
                  {awaitLabel[r]}
                </button>
              ))}
            </div>
          )}

          {can && (
            <div className="task-assign">
              <span>Station / person</span>
              <AssignPicks
                value={taskAssignees(task)}
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
          )}
        </div>

        <div className="task-page-side">
          <section className="task-log">
            <p className="eyebrow">Log</p>
            {log.map((entry) => {
              const who = crew.find((c) => c.id === entry.authorId)
              const sys = entry.kind && entry.kind !== 'note'
              return (
                <article key={entry.id} className={sys ? 'task-log-item is-sys' : 'task-log-item'}>
                  {who ? <Avatar person={who} /> : <span className="task-log-dot" />}
                  <div>
                    <p>
                      <b>{who?.name.split(' ')[0] ?? 'Crew'}</b>
                      <time>{relative(entry.at)}</time>
                    </p>
                    <p>{entry.text}</p>
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
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note to the log…"
              />
              <div>
                <FileAdd
                  files={task.files ?? []}
                  onChange={(files) => updateTask(task.id, { files })}
                />
                <button className="btn" type="submit" disabled={!note.trim()}>
                  Post
                </button>
              </div>
            </form>
          ) : (
            <p className="hint">You can read this. Status and notes are for the assigned station.</p>
          )}
        </div>
      </div>
    </article>
  )
}
