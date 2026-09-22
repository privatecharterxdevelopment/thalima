import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarPlus, ChevronDown, Package, Plus, Receipt, Ship, ShoppingCart, Siren } from 'lucide-react'
import { canSubmitAccounting } from '../lib/accounting'
import { useStore } from '../store'

export function CreateMenu() {
  const nav = useNavigate()
  const { user } = useStore()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function go(to: string) {
    setOpen(false)
    nav(to)
  }

  return (
    <div className="create-menu" ref={box}>
      <button type="button" className="create-main" onClick={() => go('/new')}>
        <Plus size={15} strokeWidth={2} />
        Create task
      </button>
      <button
        type="button"
        className="create-more"
        aria-label="More create options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronDown size={15} strokeWidth={2} />
      </button>
      {open ? (
        <div className="create-drop" role="menu">
          <button type="button" role="menuitem" onClick={() => go('/calendar?new=event')}>
            <Ship size={15} strokeWidth={1.75} />
            Create event
          </button>
          <button type="button" role="menuitem" onClick={() => go('/calendar?new=1')}>
            <CalendarPlus size={15} strokeWidth={1.75} />
            Create diary entry
          </button>
          <i className="create-sep" aria-hidden="true" />
          <button type="button" role="menuitem" onClick={() => go('/inventory?new=item')}>
            <Package size={15} strokeWidth={1.75} />
            Add inventory item
          </button>
          <button type="button" role="menuitem" onClick={() => go('/inventory?tab=shopping&new=purchase')}>
            <ShoppingCart size={15} strokeWidth={1.75} />
            Purchase request
          </button>
          {user && canSubmitAccounting(user) ? (
            <button type="button" role="menuitem" onClick={() => go('/accounting/new')}>
              <Receipt size={15} strokeWidth={1.75} />
              Add accounting entry
            </button>
          ) : null}
          <i className="create-sep" aria-hidden="true" />
          <button type="button" role="menuitem" className="is-danger" onClick={() => go('/new?urgency=emergency')}>
            <Siren size={15} strokeWidth={1.75} />
            Create emergency
          </button>
        </div>
      ) : null}
    </div>
  )
}
