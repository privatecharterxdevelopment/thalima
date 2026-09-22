import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Users } from 'lucide-react'
import { crew } from '../data/crew'
import { canPost, visibleChannels } from '../lib/permissions'
import { firstName, lastInChannel, otherInChannel, sortChats } from '../lib/chat'
import { clock } from '../lib/format'
import { useStore } from '../store'
import { Avatar } from '../components/Avatar'
import type { CrewMember } from '../types'

export function Messages() {
  const { channelId } = useParams()
  const nav = useNavigate()
  const { user, messages, addMessage, markRead, lastRead, refreshPeople } = useStore()
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void refreshPeople()
  }, [refreshPeople])

  const visible = useMemo(() => (user ? sortChats(visibleChannels(user), messages) : []), [user, messages])
  const current = visible.find((c) => c.id === channelId)
  const peer = user && current ? otherInChannel(current, user.id) : null

  useEffect(() => {
    if (channelId && current) markRead(channelId)
  }, [channelId, current?.id, markRead, messages.length])

  useEffect(() => {
    setText('')
  }, [current?.id])

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth' })
  }, [current?.id, messages.length])

  if (!user) return null

  const thread = current
    ? messages.filter((m) => m.channelId === current.id).sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id))
    : []
  const unreadFor = (id: string) => {
    const read = lastRead[`${user.id}:${id}`]
    return messages.filter((m) => m.channelId === id && m.authorId !== user.id && (!read || m.at > read)).length
  }

  const send = () => {
    if (!current || !canPost(user, current) || !text.trim()) return
    addMessage(current.id, text)
    setText('')
  }

  const whoLabel = current ? (peer ? firstName(peer.name) : 'everyone') : 'crew'
  const headName = peer ? peer.name : 'All crew'
  const headSub = peer
    ? peer.title
    : crew
        .filter((c) => c.id !== user.id && c.active !== false)
        .map((c) => firstName(c.name))
        .join(', ')

  return (
    <div className="pad chat-wrap">
      <div className="chat">
        <aside className="ch-list">
          {visible.map((ch) => {
            const n = unreadFor(ch.id)
            const other = otherInChannel(ch, user.id)
            const last = lastInChannel(messages, ch.id)
            const who = last ? authorOf(last.authorId) : null
            const label = other ? firstName(other.name) : 'All crew'
            const preview = last
              ? `${last.authorId === user.id ? 'You: ' : last.channelId === 'all' ? `${firstName(who?.name ?? 'Crew')}: ` : ''}${last.text}`
              : other
                ? other.title
                : 'Everyone on board'
            return (
              <button
                key={ch.id}
                className={`ch-item ${ch.id === current?.id ? 'on' : ''}`}
                onClick={() => nav(`/messages/${ch.id}`)}
              >
                {other ? (
                  <Avatar person={other} size="lg" />
                ) : (
                  <span className="ch-group" aria-hidden>
                    <Users size={16} strokeWidth={2} />
                  </span>
                )}
                <span className="ch-meta">
                  <strong>{label}</strong>
                  <small>{preview}</small>
                </span>
                <span className="ch-aside">
                  {last && <time>{clock(last.at)}</time>}
                  {n > 0 && <span className="unread">{n}</span>}
                </span>
              </button>
            )
          })}
        </aside>
        {current ? (
          <section className="thread">
            <div className="thread-head">
              {peer ? (
                <Avatar person={peer} size="lg" />
              ) : (
                <span className="ch-group" aria-hidden>
                  <Users size={16} strokeWidth={2} />
                </span>
              )}
              <div>
                <strong>{headName}</strong>
                <span>{headSub}</span>
              </div>
            </div>
            <div className="msgs">
              {thread.length === 0 ? (
                <div className="chat-empty">
                  {peer ? (
                    <Avatar person={peer} size="lg" />
                  ) : (
                    <span className="ch-group" aria-hidden>
                      <Users size={20} strokeWidth={1.75} />
                    </span>
                  )}
                  <p>No messages yet. Write to {whoLabel}.</p>
                </div>
              ) : (
                thread.map((m) => {
                  const who = authorOf(m.authorId)
                  const mine = m.authorId === user.id
                  return (
                    <div key={m.id} className={`bubble ${mine ? 'mine' : ''}`}>
                      {who ? (
                        <Avatar person={who} size="sm" />
                      ) : (
                        <span className="ch-group" aria-hidden>
                          {(m.authorId || '?').slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <div className="txt">
                        {!mine && <strong>{firstName(who?.name ?? 'Crew')}</strong>}
                        <p>{m.text}</p>
                        <small>{clock(m.at)}</small>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={end} />
            </div>
            <form
              className="composer"
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Message ${whoLabel}…`}
                disabled={!canPost(user, current)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
              />
              <button className="btn" disabled={!text.trim() || !canPost(user, current)}>
                Send
              </button>
            </form>
          </section>
        ) : (
          <section className="thread is-idle">
            <div className="msgs">
              <div className="chat-empty">
                <span className="ch-group" aria-hidden>
                  <Users size={20} strokeWidth={1.75} />
                </span>
                <p>Pick a conversation to read or write.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function authorOf(id: string): CrewMember | undefined {
  return crew.find((c) => c.id === id)
}
