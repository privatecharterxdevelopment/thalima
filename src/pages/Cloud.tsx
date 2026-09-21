import { FileAdd } from '../components/FileList'
import { crew } from '../data/crew'
import { dayClock } from '../lib/format'
import { canAdminCalendar } from '../lib/permissions'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'
import type { CloudDoc } from '../types'
import { uid } from '../lib/format'

export function Cloud() {
  const { user, docs, addDoc, removeDoc } = useStore()
  if (!user) return null
  const admin = canAdminCalendar(user)
  const rows = [...docs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="pad cloud">
      <p className="lede" style={{ maxWidth: '48ch', marginBottom: 28 }}>
        Standing orders, SMS notes, guest papers. Master puts them here; the rest of the crew can open them.
      </p>
      {admin && (
        <div className="cloud-add">
          <FileAdd
            files={[]}
            label="Add documents"
            onChange={(files) => {
              for (const f of files) {
                const doc: CloudDoc = {
                  ...f,
                  id: uid('d'),
                  title: f.name.replace(/\.[^.]+$/, ''),
                  createdBy: user.id,
                  createdAt: new Date().toISOString(),
                }
                addDoc(doc)
              }
            }}
          />
        </div>
      )}
      <ul className="cloud-list">
        {rows.length === 0 ? (
          <li className="hint">Nothing in the cloud yet.</li>
        ) : (
          rows.map((d) => {
            const who = crew.find((c) => c.id === d.createdBy)
            return (
              <li key={d.id} className="cloud-row">
                <a href={d.dataUrl} download={d.name}>
                  <strong>{d.title}</strong>
                  <span>{d.name}</span>
                </a>
                <small>
                  {who && <Avatar person={who} size="sm" />}
                  {who?.name.split(' ')[0]} · {dayClock(d.createdAt)}
                </small>
                {admin && (
                  <button className="text-link" type="button" onClick={() => removeDoc(d.id)}>
                    Remove
                  </button>
                )}
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}
