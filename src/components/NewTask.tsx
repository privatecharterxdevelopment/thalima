import { useState } from 'react'
import { crew } from '../data/crew'
import { deptLabel } from '../data/crew'
import { canAssign } from '../lib/format'
import { useStore } from '../store'
import type { Department, Urgency } from '../types'

export function NewTask({ onClose }: { onClose: () => void }) {
  const { user, addTask } = useStore()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [department, setDepartment] = useState<Department>(user?.department ?? 'deck')
  const [assigneeId, setAssigneeId] = useState(user?.id ?? 'luca')
  const [urgency, setUrgency] = useState<Urgency>('soon')
  const [due, setDue] = useState(() => {
    const d = new Date(Date.now() + 2 * 3600_000)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    return d.toISOString().slice(0, 16)
  })

  if (!user) return null

  const assignees = crew.filter((c) => user.level === 1 || c.department === department || c.id === user.id)
  const can = canAssign(user, department)

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Assign a task</h2>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim() || !can) return
            addTask({
              title: title.trim(),
              body: body.trim(),
              department,
              assigneeId,
              urgency,
              due: new Date(due).toISOString(),
            })
            onClose()
          }}
        >
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label>
            What needs doing
            <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>
          <label>
            Department
            <select
              value={department}
              onChange={(e) => {
                const d = e.target.value as Department
                setDepartment(d)
                const first = crew.find((c) => c.department === d)
                if (first) setAssigneeId(first.id)
              }}
              disabled={user.level > 1}
            >
              {Object.entries(deptLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Assign to
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} disabled={!can}>
              {assignees.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Urgency
            <select value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency)}>
              <option value="routine">Routine</option>
              <option value="soon">Soon</option>
              <option value="now">Now</option>
              <option value="emergency">Emergency</option>
            </select>
          </label>
          <label>
            Due
            <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
          </label>
          <div className="row-btns">
            <button className="btn" type="submit" disabled={!can}>
              Put on the board
            </button>
            <button className="btn ghost" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
