import { useMemo } from 'react'
import { Bell } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { buildNotices, isNoticeSeen } from '../lib/notices'
import { useStore } from '../store'

export function Notices() {
  const { user, tasks, lastRead, seenNotices, roster, expenses, messages } = useStore()

  const unseen = useMemo(() => {
    if (!user) return 0
    return buildNotices({ user, tasks, lastRead, roster, expenses, messages }).filter(
      (n) => !isNoticeSeen(user.id, n.id, seenNotices),
    ).length
  }, [user, tasks, lastRead, roster, expenses, messages, seenNotices])

  if (!user) return null

  return (
    <NavLink
      to="/notifications"
      className={({ isActive }) => `ghost-icon ${isActive ? 'on' : ''}`}
      aria-label={unseen > 0 ? `Notifications ${unseen}` : 'Notifications'}
    >
      <Bell size={18} />
      {unseen > 0 && <span className="badge">{unseen > 9 ? '9+' : unseen}</span>}
    </NavLink>
  )
}
