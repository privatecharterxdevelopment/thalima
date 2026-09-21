import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { FileAdd, FileList } from './FileList'
import { AssignPicks } from './AssignPicks'
import { crew, deptLabel, urgencyLabel } from '../data/crew'
import { canMoveTask, taskAssignees } from '../lib/format'
import { dueInputValue as dueVal } from '../lib/taskAi'
import { useStore } from '../store'
import { useUi } from '../ui'
import type { TaskStatus, Urgency } from '../types'

export function TaskSheet() {
  const { taskId, closeTask } = useUi()
  const { tasks, user, updateTask } = useStore()
  const task = tasks.find((t) => t.id === taskId) ?? null
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<TaskStatus>('ready')
  const [urgency, setUrgency] = useState<Urgency>('soon')
  const [assigneeIds, setAssigneeIds] = useState<string[]>([])
  const [due, setDue] = useState('')

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setBody(task.body)
    setStatus(task.status)
    setUrgency(task.urgency)
    setAssigneeIds(taskAssignees(task))
    setDue(dueVal(task.due))
  }, [task?.id])

  if (!task || !user) return null

  const can = canMoveTask(user, task)
  const people = assigneeIds.map((id) => crew.find((c) => c.id === id)).filter(Boolean)
  const names = people.map((p) => p!.name).join(', ')

  return (
    <div className="modal-back" onClick={closeTask}>
      <div className="modal task-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-head" style={{ padding: 0, border: 0 }}>
          <p className="eyebrow">
            {deptLabel[task.department]}
            {people[0] ? ` · ${people.map((p) => p!.title).join(' · ')}` : ''}
          </p>
          <button className="ghost-icon" onClick={closeTask} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        {can ? (
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault()
              const first = crew.find((c) => c.id === assigneeIds[0])
              updateTask(task.id, {
                title: title.trim(),
                body: body.trim(),
                status,
                urgency,
                assigneeId: assigneeIds[0] ?? task.assigneeId,
                assigneeIds,
                department: first?.department ?? task.department,
                due: new Date(due).toISOString(),
              })
              closeTask()
            }}
          >
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
            <FileList files={task.files ?? []} />
            {can && (
              <FileAdd
                files={task.files ?? []}
                onChange={(files) => updateTask(task.id, { files })}
              />
            )}
            <label>
              Assign
              <AssignPicks value={assigneeIds} onChange={setAssigneeIds} />
            </label>
            <div className="task-draft-row">
              <select value={status === 'done' ? 'done' : 'ready'} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                <option value="ready">Pending</option>
                <option value="done">Done</option>
              </select>
              <select value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>
                {(Object.keys(urgencyLabel) as Urgency[]).map((u) => (
                  <option key={u} value={u}>
                    {urgencyLabel[u]}
                  </option>
                ))}
              </select>
              <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
            <div className="row-btns">
              <button className="btn" type="submit">
                Save
              </button>
              <button className="btn ghost" type="button" onClick={closeTask}>
                Close
              </button>
            </div>
          </form>
        ) : (
          <div>
            <h2 style={{ fontSize: 22, letterSpacing: '-0.04em', marginBottom: 10 }}>{task.title}</h2>
            <p className="task-full">{task.body}</p>
            <FileList files={task.files ?? []} />
            <p className="hint" style={{ marginTop: 16 }}>
              Assigned to {names || 'crew'}. Not yours to edit.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
