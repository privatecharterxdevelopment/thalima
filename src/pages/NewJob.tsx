import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'
import { AssignPicks } from '../components/AssignPicks'
import { FileAdd, FileList } from '../components/FileList'
import { crew } from '../data/crew'
import { canAssign, taskAssignees } from '../lib/format'
import { draftFromPrompt, dueInputValue, type TaskDraft } from '../lib/taskAi'
import { useStore } from '../store'
import type { AttachedFile, Urgency } from '../types'

export function NewJob() {
  const { user, addTask } = useStore()
  const nav = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [draft, setDraft] = useState<TaskDraft | null>(null)
  const [thinking, setThinking] = useState(false)
  const [files, setFiles] = useState<AttachedFile[]>([])
  const input = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    input.current?.focus()
  }, [])

  if (!user) return null
  if (user.level > 2) return <Navigate to="/app" replace />

  function run(text: string) {
    if (!user || !text.trim()) return
    setThinking(true)
    window.setTimeout(() => {
      setDraft(draftFromPrompt(text.trim(), user))
      setThinking(false)
      setPrompt('')
    }, 280)
  }

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

  const assigned = draft ? taskAssignees(draft) : []
  const names = assigned
    .map((id) => crew.find((c) => c.id === id)?.name.split(' ')[0])
    .filter(Boolean)
    .join(', ')

  return (
    <div className="job-new">
      <div className="job-new-body">
        {draft ? (
          <form
            className="task-draft"
            onSubmit={(e) => {
              e.preventDefault()
              if (!canAssign(user, draft.department) || !draft.title.trim()) return
              addTask({ ...draft, files })
              nav('/board')
            }}
          >
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Title"
            />
            <textarea
              rows={5}
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              placeholder="What needs doing"
            />
            <label>
              Assign
              <AssignPicks value={assigned} onChange={setPeople} />
            </label>
            <div className="file-row">
              <FileAdd files={files} onChange={setFiles} />
              <FileList files={files} onRemove={(id) => setFiles(files.filter((f) => f.id !== id))} />
            </div>
            <div className="task-draft-row">
              <select
                value={draft.urgency}
                onChange={(e) => setDraft({ ...draft, urgency: e.target.value as Urgency })}
              >
                {(['routine', 'soon', 'now', 'emergency'] as Urgency[]).map((u) => (
                  <option key={u} value={u}>
                    {u[0].toUpperCase() + u.slice(1)}
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={dueInputValue(draft.due)}
                onChange={(e) => setDraft({ ...draft, due: new Date(e.target.value).toISOString() })}
              />
            </div>
            <p className="hint">
              {names || 'They'} will see this in their inbox. Change anything before it goes on the board.
            </p>
            <div className="row-btns">
              <button className="btn" type="submit">
                Put on board
              </button>
              <button className="btn ghost" type="button" onClick={() => setDraft(null)}>
                Discard
              </button>
            </div>
          </form>
        ) : (
          <div className="job-new-idle">
            <p>Who, what, by when.</p>
            <p className="lede">
              Say it in the bar. I'll write the task — title, seats, due — then you can still change it and attach
              files before it hits the board.
            </p>
          </div>
        )}
      </div>
      <form
        className="task-ask"
        onSubmit={(e) => {
          e.preventDefault()
          run(prompt)
        }}
      >
        <textarea
          ref={input}
          rows={1}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={thinking ? 'Writing the task…' : 'Luca and Sofia, guests by 16:00'}
          disabled={thinking}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              run(prompt)
            }
          }}
        />
        <button className="ghost-icon ask-go" type="submit" disabled={!prompt.trim() || thinking} aria-label="Draft task">
          <ArrowUp size={18} />
        </button>
      </form>
      {!draft && (
        <div className="job-new-files">
          <FileAdd files={files} onChange={setFiles} />
          <FileList files={files} onRemove={(id) => setFiles(files.filter((f) => f.id !== id))} />
        </div>
      )}
    </div>
  )
}
