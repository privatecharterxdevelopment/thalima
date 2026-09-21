import { useMemo, useState } from 'react'
import { deptLabel, inventory } from '../data/crew'
import { useStore } from '../store'
import type { Department } from '../types'

const houses: { id: 'all' | Department; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'deck', label: 'Deck' },
  { id: 'engineering', label: 'Plant' },
  { id: 'interior', label: 'House' },
  { id: 'galley', label: 'Galley' },
  { id: 'bridge', label: 'Bridge' },
]

export function Inventory() {
  const { user } = useStore()
  const [house, setHouse] = useState<(typeof houses)[number]['id']>('all')
  const rows = useMemo(
    () => (house === 'all' ? inventory : inventory.filter((i) => i.dept === house)),
    [house],
  )
  if (!user) return null

  return (
    <div className="pad inv">
      <div className="inv-head">
        <div>
          <p className="inv-kicker">Onboard</p>
          <p className="inv-copy">Whole-yacht stores. Every seat can see stock, mins, and where it lives.</p>
        </div>
        <div className="filters">
          {houses.map((h) => (
            <button key={h.id} className={house === h.id ? 'on' : ''} onClick={() => setHouse(h.id)}>
              {h.label}
            </button>
          ))}
        </div>
      </div>
      <table className="table inv-table">
        <thead>
          <tr>
            <th>House</th>
            <th>Item</th>
            <th>Stock</th>
            <th>Min</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((i) => (
            <tr key={i.id}>
              <td>{deptLabel[i.dept]}</td>
              <td>{i.item}</td>
              <td className={i.stock < i.min ? 'low' : ''}>
                {i.stock} {i.unit}
              </td>
              <td>
                {i.min} {i.unit}
              </td>
              <td className="muted">{i.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
