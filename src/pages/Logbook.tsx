import { useState } from 'react'
import { crew } from '../data/crew'
import { dayClock } from '../lib/format'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'

export function Logbook() {
  const { log, addLog, user } = useStore()
  const [text, setText] = useState('')
  if (!user) return null
  const canWrite = user.level === 1 || user.department === 'deck' || user.department === 'engineering'

  return (
    <div className="pad">
      {canWrite && (
        <form
          className="log-form"
          onSubmit={(e) => {
            e.preventDefault()
            addLog(text)
            setText('')
          }}
        >
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Time, place, wind, what we did."
          />
          <button className="btn" disabled={!text.trim()}>
            Enter
          </button>
        </form>
      )}
      <div className="log-list">
        {log.map((e) => {
          const who = crew.find((c) => c.id === e.authorId)
          return (
            <article key={e.id}>
              <small>
                {dayClock(e.at)}
                {who ? ` · ${who.name}` : ''}
              </small>
              <p style={{ marginTop: 8, lineHeight: 1.65, maxWidth: '62ch' }}>{e.text}</p>
              {who && (
                <div style={{ marginTop: 10 }}>
                  <Avatar person={who} size="sm" />
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
