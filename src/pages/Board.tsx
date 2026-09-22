import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { crew, deptLabel, statusLabel } from '../data/crew'
import { canSeeTask, sortTasks, stationsOf, taskAssignees } from '../lib/format'
import { isOpenStatus } from '../lib/opsTasks'
import { useStore } from '../store'
import { TaskCard } from '../components/TaskCard'
import type { Department, TaskStatus } from '../types'

const deptsAll: Array<Department | 'all'> = ['all', 'bridge', 'engineering', 'deck', 'interior', 'galley']

export function Board() {
  const { user, tasks, ops, addTask, markTasksSeen } = useStore()
  const [params, setParams] = useSearchParams()
  const view = params.get('view') === 'defects' ? 'defects' : 'tasks'
  const [dept, setDept] = useState<Department | 'all'>('all')
  const [status, setStatus] = useState<TaskStatus | 'active'>('active')
  const [assignee, setAssignee] = useState('all')
  const [q, setQ] = useState('')

  useEffect(() => {
    markTasksSeen()
  }, [markTasksSeen])

  const visibleBase = useMemo(() => {
    if (!user) return []
    return tasks.filter((t) => canSeeTask(user, t))
  }, [user, tasks])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return visibleBase
      .filter((t) => dept === 'all' || t.department === dept)
      .filter((t) => (assignee === 'all' ? true : taskAssignees(t).includes(assignee)))
      .filter((t) => !query || `${t.title} ${t.body}`.toLowerCase().includes(query))
      .filter((t) => (status === 'active' ? isOpenStatus(t.status) : t.status === status))
      .sort(sortTasks)
  }, [visibleBase, dept, assignee, q, status])

  if (!user) return null

  const deptOpts: Array<Department | 'all'> =
    user.level === 1 ? deptsAll : ['all', ...stationsOf(user).filter((d, i, all) => all.indexOf(d) === i)]
  const canCreate = user.level <= 2
  const defects = ops.defects.filter((d) => d.status !== 'closed')
  const defectList = defects.filter((d) => {
    if (dept === 'all') return true
    const eq = ops.equipment.find((e) => e.id === d.assetId)
    return (eq?.department ?? 'engineering') === dept
  })

  return (
    <div className="board-modern">
      <div className="ops-top">
        <div className="ops-views">
          <button
            className={view === 'tasks' ? 'on' : ''}
            onClick={() => {
              setDept('all')
              setParams({})
            }}
          >
            Tasks
          </button>
          <button
            className={view === 'defects' ? 'on' : ''}
            onClick={() => {
              setDept('all')
              setParams({ view: 'defects' })
            }}
          >
            Defects
          </button>
        </div>
        {canCreate && (
          <Link className="btn" to="/new">
            New task
          </Link>
        )}
      </div>

      <div className="ops-toolbar">
        <label className="ops-search">
          <Search size={15} strokeWidth={1.75} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" />
        </label>
        <select value={dept} onChange={(e) => setDept(e.target.value as Department | 'all')}>
          {deptOpts.map((d) => (
            <option key={d} value={d}>
              {d === 'all' ? 'All stations' : deptLabel[d]}
            </option>
          ))}
        </select>
        {view === 'tasks' && (
          <>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus | 'active')}
            >
              <option value="active">Open</option>
              <option value="doing">{statusLabel.doing}</option>
              <option value="waiting">{statusLabel.waiting}</option>
              <option value="done">{statusLabel.done}</option>
            </select>
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="all">Everyone</option>
              {crew.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.split(' ')[0]}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <section className="ops-list">
        {view === 'defects'
          ? defectList.map((d) => {
              const eq = ops.equipment.find((e) => e.id === d.assetId)
              const who = crew.find((c) => c.id === d.by)
              const hasTask = tasks.some((t) => t.kind === 'defect' && t.title === d.title)
              return (
                <article key={d.id} className="task ops-card">
                  <div>
                    <h3>{d.title}</h3>
                    <p className="ops-meta">
                      {who?.name.split(' ')[0] ?? 'Engineering'}
                      {eq ? ` · ${deptLabel[eq.department]}` : ''}
                      {` · ${d.status === 'open' ? 'Open' : 'On watch'}`}
                    </p>
                    {canCreate && !hasTask && (
                      <button
                        className="btn ghost"
                        type="button"
                        onClick={() =>
                          addTask({
                            title: d.title,
                            body: d.body,
                            department: eq?.department ?? 'engineering',
                            assigneeId: who?.id ?? 'marco',
                            urgency: d.status === 'open' ? 'now' : 'soon',
                            due: new Date(Date.now() + 4 * 3600_000).toISOString(),
                            kind: 'defect',
                            awaitReason: d.id === 'df2' ? 'spare' : undefined,
                          })
                        }
                      >
                        Make task
                      </button>
                    )}
                  </div>
                </article>
              )
            })
          : filtered.map((t) => <TaskCard key={t.id} task={t} />)}

        {view === 'defects' && defectList.length === 0 && <p className="ops-empty">No open defects.</p>}
        {view === 'tasks' && filtered.length === 0 && <p className="ops-empty">Nothing here.</p>}
      </section>
    </div>
  )
}
