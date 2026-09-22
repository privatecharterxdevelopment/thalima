import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { api, type ActivityRow, type LiveUser } from '../lib/api'
import { canManageUsers, stationsOf } from '../lib/format'
import { useStore } from '../store'
import type { AccountingRole, Department, Role } from '../types'

const roles: { id: Role; label: string }[] = [
  { id: 'captain', label: 'Captain' },
  { id: 'first_officer', label: 'First officer' },
  { id: 'bosun', label: 'Bosun' },
  { id: 'deckhand', label: 'Deckhand' },
  { id: 'engineer', label: 'Chief engineer' },
  { id: 'second_engineer', label: 'Second engineer' },
  { id: 'eto', label: 'ETO' },
  { id: 'purser', label: 'Purser' },
  { id: 'stewardess', label: 'Chief stew' },
  { id: 'second_stew', label: 'Stew' },
  { id: 'chef', label: 'Chef' },
  { id: 'sous', label: 'Sous' },
]

const depts: { id: Department; label: string }[] = [
  { id: 'bridge', label: 'Bridge' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'deck', label: 'Deck' },
  { id: 'interior', label: 'Interior' },
  { id: 'galley', label: 'Galley' },
]

const accounting: { id: AccountingRole; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'submitter', label: 'Submitter' },
  { id: 'accountant', label: 'Accountant' },
  { id: 'captain', label: 'Captain' },
]

const actionLabel: Record<string, string> = {
  seed: 'Seed',
  login: 'Sign in',
  logout: 'Sign out',
  login_failed: 'Failed sign-in',
  user_create: 'User created',
  user_update: 'User updated',
  user_activate: 'User activated',
  user_deactivate: 'User deactivated',
  task_create: 'Task',
  expense_submit: 'Expense submitted',
  expense_approve: 'Expense approved',
  expense_reject: 'Expense rejected',
  deck_log: 'Deck log',
  roster_decide: 'Roster',
}

function emptyForm() {
  return {
    name: '',
    email: '',
    password: '',
    title: '',
    role: 'deckhand' as Role,
    departments: ['deck'] as Department[],
    level: 3 as 1 | 2 | 3,
    accounting: 'none' as AccountingRole,
    phone: '',
    watch: '',
    access: 'crew' as 'owner' | 'crew',
  }
}

function toggleStation(current: Department[], id: Department) {
  if (current.includes(id)) {
    if (current.length === 1) return current
    return current.filter((d) => d !== id)
  }
  return [...current, id]
}

function StationPicks({
  value,
  onChange,
}: {
  value: Department[]
  onChange: (next: Department[]) => void
}) {
  return (
    <div className="admin-stations">
      {depts.map((d) => (
        <button
          key={d.id}
          type="button"
          className={value.includes(d.id) ? 'on' : ''}
          onClick={() => onChange(toggleStation(value, d.id))}
        >
          {d.label}
        </button>
      ))}
    </div>
  )
}

export function Admin() {
  const { user, refreshPeople } = useStore()
  const [tab, setTab] = useState<'users' | 'logs'>('users')
  const [people, setPeople] = useState<LiveUser[]>([])
  const [logs, setLogs] = useState<ActivityRow[]>([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [pw, setPw] = useState<Record<string, string>>({})

  async function loadUsers() {
    const { users } = await api.users(true)
    setPeople(users)
    await refreshPeople()
  }

  async function loadLogs() {
    const { logs: rows } = await api.activity()
    setLogs(rows)
  }

  useEffect(() => {
    void loadUsers().catch((err: Error) => setError(err.message))
    void loadLogs().catch(() => {})
  }, [])

  if (!user) return null
  if (!canManageUsers(user)) return <Navigate to="/app" replace />

  const isOwner = user.access === 'owner'

  async function create(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const stations = form.departments.length ? form.departments : (['deck'] as Department[])
      await api.createUser({
        ...form,
        department: stations[0],
        departments: stations,
        access: isOwner ? form.access : 'crew',
      })
      setForm(emptyForm())
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create user.')
    } finally {
      setBusy(false)
    }
  }

  async function patch(id: string, input: Record<string, unknown>) {
    setError('')
    try {
      await api.patchUser(id, input)
      await loadUsers()
      if (input.password) setPw((s) => ({ ...s, [id]: '' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.')
    }
  }

  return (
    <div className="admin-page">
      <nav className="ops-views">
        <button className={tab === 'users' ? 'on' : ''} type="button" onClick={() => { setTab('users'); void loadUsers() }}>
          Users
        </button>
        <button className={tab === 'logs' ? 'on' : ''} type="button" onClick={() => { setTab('logs'); void loadLogs() }}>
          Activity
        </button>
      </nav>

      {error ? <p className="acct-warn">{error}</p> : null}

      {tab === 'users' ? (
        <>
          <form className="admin-create" onSubmit={(e) => void create(e)}>
            <h2>New user</h2>
            <p className="admin-lead">
              They sign in with this email and password. Stations decide which jobs they see — two people on Bridge both
              see Bridge work. One person can hold more than one station.
            </p>
            <div className="admin-grid">
              <label>
                Name
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6}
                  required
                />
              </label>
              <label>
                Title
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Bosun, Chef…"
                  required
                />
              </label>
              <label>
                Role
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Level
                <select
                  value={form.level}
                  onChange={(e) => setForm({ ...form, level: Number(e.target.value) as 1 | 2 | 3 })}
                >
                  <option value={1}>1 · Command</option>
                  <option value={2}>2 · Head of department</option>
                  <option value={3}>3 · Crew</option>
                </select>
              </label>
              <label>
                Accounting
                <select
                  value={form.accounting}
                  onChange={(e) => setForm({ ...form, accounting: e.target.value as AccountingRole })}
                >
                  {accounting.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </label>
              {isOwner ? (
                <label>
                  Access
                  <select
                    value={form.access}
                    onChange={(e) => setForm({ ...form, access: e.target.value as 'owner' | 'crew' })}
                  >
                    <option value="crew">Crew</option>
                    <option value="owner">Master admin</option>
                  </select>
                </label>
              ) : null}
              <label>
                Phone
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label>
                Watch
                <input value={form.watch} onChange={(e) => setForm({ ...form, watch: e.target.value })} />
              </label>
            </div>
            <label className="admin-stations-label">
              Stations
              <StationPicks
                value={form.departments}
                onChange={(departments) => setForm({ ...form, departments })}
              />
            </label>
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Add user'}
            </button>
          </form>

          <section className="admin-panel">
            <h2>Seats</h2>
            <table className="acct-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Title</th>
                  <th>Stations</th>
                  <th>Access</th>
                  <th>Status</th>
                  <th>Password</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {people.map((person) => {
                  const stations = stationsOf(person)
                  return (
                    <tr key={person.id}>
                      <td>{person.name}</td>
                      <td>{person.email}</td>
                      <td>{person.title}</td>
                      <td>
                        <StationPicks
                          value={stations}
                          onChange={(next) =>
                            void patch(person.id, { department: next[0], departments: next })
                          }
                        />
                      </td>
                      <td>{person.access === 'owner' ? 'Owner' : 'Crew'}</td>
                      <td>{person.active ? 'Active' : 'Off'}</td>
                      <td>
                        <span className="admin-pw">
                          <input
                            type="text"
                            value={pw[person.id] ?? ''}
                            placeholder="Reset…"
                            onChange={(e) => setPw((s) => ({ ...s, [person.id]: e.target.value }))}
                          />
                          <button
                            className="btn ghost"
                            type="button"
                            disabled={!pw[person.id] || pw[person.id].length < 6}
                            onClick={() => void patch(person.id, { password: pw[person.id] })}
                          >
                            Set
                          </button>
                        </span>
                      </td>
                      <td>
                        {person.id === user.id ? null : (
                          <button
                            className="btn ghost"
                            type="button"
                            onClick={() => void patch(person.id, { active: !person.active })}
                          >
                            {person.active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        </>
      ) : (
        <section className="admin-panel">
          <h2>Activity</h2>
          {logs.length ? (
            <table className="acct-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>Action</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {new Date(row.at).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Europe/Rome',
                      })}
                    </td>
                    <td>{row.actor}</td>
                    <td>{actionLabel[row.action] ?? row.action}</td>
                    <td>{row.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="acct-empty">No activity yet.</p>
          )}
        </section>
      )}
    </div>
  )
}
