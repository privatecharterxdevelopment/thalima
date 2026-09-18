import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { channels, crew } from '../data/crew'
import { canPost, visibleChannels } from '../lib/permissions'
import { clock } from '../lib/format'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'

export function Messages() {
  const { channelId } = useParams()
  const nav = useNavigate()
  const { user, messages, addMessage, markRead, lastRead } = useStore()
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)

  const visible = useMemo(() => (user ? visibleChannels(user, channels) : []), [user])
  const current = visible.find((c) => c.id === channelId) ?? visible[0]

  useEffect(() => {
    if (!channelId && current) nav(`/messages/${current.id}`, { replace: true })
  }, [channelId, current, nav])

  useEffect(() => {
    if (current) markRead(current.id)
  }, [current, markRead, messages.length])

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [current?.id, messages.length])

  if (!user || !current) return null

  const thread = messages.filter((m) => m.channelId === current.id)
  const unreadFor = (id: string) => {
    const read = lastRead[`${user.id}:${id}`]
    return messages.filter((m) => m.channelId === id && m.authorId !== user.id && (!read || m.at > read))
      .length
  }

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">Internal</p>
          <h1>Messages</h1>
          <p>Houses, all-crew, and private lines. Captain sees every department channel.</p>
        </div>
      </div>
      <div className="chat">
        <aside className="ch-list">
          {visible.map((ch) => {
            const n = unreadFor(ch.id)
            return (
              <button
                key={ch.id}
                className={`ch-item ${ch.id === current.id ? 'on' : ''}`}
                onClick={() => nav(`/messages/${ch.id}`)}
              >
                <span>
                  {ch.name}
                  <br />
                  <small>{ch.kind === 'dm' ? 'Private' : ch.kind === 'all' ? 'Everyone' : 'Department'}</small>
                </span>
                {n > 0 && <span className="unread">{n}</span>}
              </button>
            )
          })}
        </aside>
        <section className="thread">
          <div className="thread-head">
            <strong>{current.name}</strong>
            <span>
              {current.kind === 'dm'
                ? 'Direct'
                : current.kind === 'all'
                  ? 'All five on board'
                  : 'Department channel'}
            </span>
          </div>
          <div className="msgs">
            {thread.map((m) => {
              const who = crew.find((c) => c.id === m.authorId)
              if (!who) return null
              const mine = m.authorId === user.id
              return (
                <div key={m.id} className={`bubble ${mine ? 'mine' : ''}`}>
                  <Avatar person={who} size="sm" />
                  <div className="txt">
                    {!mine && <strong style={{ fontSize: '0.82rem' }}>{who.name}</strong>}
                    <p>{m.text}</p>
                    <small>{clock(m.at)}</small>
                  </div>
                </div>
              )
            })}
            <div ref={end} />
          </div>
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault()
              if (!canPost(user, current)) return
              addMessage(current.id, text)
              setText('')
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={canPost(user, current) ? 'Write to the crew…' : 'Read only'}
              disabled={!canPost(user, current)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (text.trim()) {
                    addMessage(current.id, text)
                    setText('')
                  }
                }
              }}
            />
            <button className="btn" disabled={!text.trim() || !canPost(user, current)}>
              Send
            </button>
          </form>
        </section>
      </div>
    </>
  )
}
