import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { AssignPicks } from '../components/AssignPicks'
import { FileAdd, FileList } from '../components/FileList'
import { crew, deptLabel, urgencyLabel } from '../data/crew'
import { WhoLine } from '../components/WhoLine'
import { StatusPill } from '../components/StatusPill'
import { canAssign, clock, dueLine, taskAssignees } from '../lib/format'
import { isDueToday, kindLabel } from '../lib/opsTasks'
import { dueInputValue, type TaskDraft } from '../lib/taskAi'
import { useStore } from '../store'
import type { AttachedFile, CrewMember, Department, TaskKind, Urgency } from '../types'

function emptyDraft(userId: string, department: Department, urgency: Urgency): TaskDraft {
  return {
    title: '',
    body: '',
    department,
    assigneeId: userId,
    assigneeIds: [userId],
    urgency,
    due: new Date(Date.now() + 3 * 3600_000).toISOString(),
    kind: 'routine',
  }
}

export function NewJob() {
  const { user, addTask } = useStore()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const startUrgency: Urgency = params.get('urgency') === 'emergency' ? 'emergency' : 'soon'
  const titleRef = useRef<HTMLInputElement>(null)
  const focused = useRef(false)
  const [draft, setDraft] = useState<TaskDraft | null>(null)
  const [files, setFiles] = useState<AttachedFile[]>([])

  useEffect(() => {
    if (!user) return
    setDraft((current) => current ?? emptyDraft(user.id, user.department, startUrgency))
  }, [user, startUrgency])

  useEffect(() => {
    setDraft((current) => (current && current.urgency !== startUrgency ? { ...current, urgency: startUrgency } : current))
  }, [startUrgency])

  useEffect(() => {
    if (!draft || focused.current) return
    titleRef.current?.focus()
    focused.current = true
  }, [draft])

  if (!user) return null
  if (user.level > 2) return <Navigate to="/app" replace />
  if (!draft) return null

  function setPeople(ids: string[]) {
    if (!draft || !ids.length) return
    const first = crew.find((c) => c.id === ids[0])
    setDraft({
      ...draft,
      assigneeIds: ids,
      assigneeId: ids[0],
      department: first?.department ?? draft.department,
    })
  }

  const assigned = taskAssignees(draft)
  const people = assigned
    .map((id) => crew.find((c) => c.id === id))
    .filter((who): who is CrewMember => Boolean(who))
  const emergency = draft.urgency === 'emergency'
  const dueStamp = `${isDueToday(draft.due) ? 'today' : 'on ' + new Date(draft.due).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Rome',
  })} at ${clock(draft.due)}`
  const summary = draft.urgency === 'emergency'
    ? `Emergency · all crew will be alerted · ${assigned.length} crew assigned`
    : `${assigned.length} crew assigned · Due ${dueStamp}`

  return (
    <div className="job-new">
      <form
        className="job-new-grid"
        onSubmit={(e) => {
          e.preventDefault()
          if (!canAssign(user, draft.department) || !draft.title.trim()) return
          const id = addTask({ ...draft, files })
          nav(`/board/${id}`)
        }}
      >
        <div className="task-draft">
        <section className="task-draft-section">
          <h2>Task</h2>
          <label>
            Title
            <input
              ref={titleRef}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Task title"
            />
          </label>
          <label>
            Description
            <textarea
              rows={3}
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              placeholder="What needs doing"
            />
          </label>
        </section>

        <section className="task-draft-section">
          <h2>Details</h2>
          <div className="task-draft-grid">
            <label>
              Department / Area
              <select
                value={draft.department}
                onChange={(e) => setDraft({ ...draft, department: e.target.value as Department })}
              >
                {(Object.keys(deptLabel) as Department[]).map((d) => (
                  <option key={d} value={d}>
                    {deptLabel[d]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Priority
              <select
                value={draft.kind}
                onChange={(e) => setDraft({ ...draft, kind: e.target.value as TaskKind })}
              >
                {(Object.keys(kindLabel) as TaskKind[]).map((k) => (
                  <option key={k} value={k}>
                    {kindLabel[k]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due
              <input
                type="datetime-local"
                value={dueInputValue(draft.due)}
                onChange={(e) => setDraft({ ...draft, due: new Date(e.target.value).toISOString() })}
              />
            </label>
            <label className={draft.urgency === 'emergency' ? 'is-emergency' : ''}>
              Timing
              <select
                value={draft.urgency}
                onChange={(e) => setDraft({ ...draft, urgency: e.target.value as Urgency })}
              >
                {(['routine', 'soon', 'now', 'emergency'] as Urgency[]).map((u) => (
                  <option key={u} value={u}>
                    {urgencyLabel[u] ?? u}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {draft.urgency === 'emergency' ? (
            <p className="task-draft-emergency">
              All crew will see a live alert until someone takes this on and it is resolved. Anyone who cannot help can
              close it with ×.
            </p>
          ) : null}
        </section>

        <section className="task-draft-section">
          <h2>Assigned crew</h2>
          <AssignPicks value={assigned} onChange={setPeople} variant="chips" date={draft.due} />
        </section>

        <section className="task-draft-section">
          <h2>Attachments</h2>
          <div className="file-row">
            <FileAdd files={files} onChange={setFiles} label="+ Add photo or file" />
            <FileList files={files} onRemove={(id) => setFiles(files.filter((f) => f.id !== id))} />
          </div>
        </section>

        </div>

        <aside className="job-preview">
          <header>
            <h2>Preview</h2>
            <span>How the crew will see it</span>
          </header>
          <article className={`job-preview-card ${emergency ? 'is-emergency' : ''}`}>
            <div className="task-page-tags">
              <StatusPill status="open" tone={emergency ? 'hot' : 'open'} />
              <span>
                {deptLabel[draft.department]} · {kindLabel[draft.kind]}
              </span>
            </div>
            <h3 className={draft.title.trim() ? '' : 'is-empty'}>{draft.title.trim() || 'Task title'}</h3>
            {draft.body.trim() ? <p>{draft.body.trim()}</p> : null}
            <div className="job-preview-meta">
              <WhoLine people={people} />
              <small>{dueLine(draft.due)}</small>
            </div>
            {files.length ? <small className="job-preview-files">{files.length} attachment{files.length > 1 ? 's' : ''}</small> : null}
          </article>
          <p className={`job-preview-sum ${emergency ? 'is-emergency' : ''}`}>{summary}</p>
          <div className="job-preview-actions">
            <button className="btn" type="submit" disabled={!draft.title.trim()}>
              {emergency ? 'Raise emergency' : 'Create task'}
            </button>
            <button className="btn ghost" type="button" onClick={() => nav('/board')}>
              Cancel
            </button>
          </div>
        </aside>
      </form>
    </div>
  )
}
