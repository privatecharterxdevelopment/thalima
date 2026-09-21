import { Anchor, Sailboat } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { isSailing, useBoatFix } from '../lib/ais'

export function ShipBadge() {
  const fix = useBoatFix()
  const nav = useNavigate()
  const sailing = isSailing(fix.sogKn)

  return (
    <button
      type="button"
      className={`ship-badge ${sailing ? 'is-sail' : 'is-anchor'}`}
      onClick={() => nav('/position')}
      aria-label={sailing ? 'Sailing' : 'At anchor'}
    >
      <span className="ship-badge-ico" aria-hidden="true">
        {sailing ? <Sailboat size={13} strokeWidth={2.3} /> : <Anchor size={13} strokeWidth={2.3} />}
      </span>
      <span>{sailing ? 'Sailing' : 'At anchor'}</span>
    </button>
  )
}
