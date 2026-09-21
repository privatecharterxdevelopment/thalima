import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SectionTabs } from '../components/SectionTabs'
import { deptLabel, inventory } from '../data/crew'
import { canAdminCalendar } from '../lib/permissions'
import { dayClock } from '../lib/format'
import { useStore } from '../store'
import type { Department } from '../types'

const tabs = [
  { id: 'technical', label: 'Technical' },
  { id: 'provisioning', label: 'Provisioning' },
  { id: 'shopping', label: 'Shopping / purchases' },
] as const

type Tab = (typeof tabs)[number]['id']

const houses: { id: 'all' | Department; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'deck', label: 'Deck' },
  { id: 'engineering', label: 'Plant' },
  { id: 'interior', label: 'House' },
  { id: 'galley', label: 'Galley' },
  { id: 'bridge', label: 'Bridge' },
]

export function Inventory() {
  const { user, ops, setPurchaseStatus } = useStore()
  const [params, setParams] = useSearchParams()
  const tab = (tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'technical') as Tab
  const house = (houses.some((h) => h.id === params.get('house')) ? params.get('house') : 'all') as (typeof houses)[number]['id']
  const admin = user ? canAdminCalendar(user) : false

  const tech = useMemo(
    () => (house === 'all' ? inventory : inventory.filter((i) => i.dept === house)),
    [house],
  )
  const shop = useMemo(() => {
    const lowTech = inventory.filter((i) => i.stock < i.min).map((i) => ({
      id: i.id,
      name: i.item,
      have: `${i.stock} ${i.unit}`,
      need: `${i.min} ${i.unit}`,
      where: deptLabel[i.dept],
    }))
    const lowProv = ops.provisions
      .filter((p) => p.stock < p.min)
      .map((p) => ({
        id: p.id,
        name: p.item,
        have: `${p.stock} ${p.unit}`,
        need: `${p.min} ${p.unit}`,
        where: p.category,
      }))
    const lowSpare = ops.spares
      .filter((s) => s.stock < s.min)
      .map((s) => ({
        id: s.id,
        name: s.name,
        have: `${s.stock} ${s.unit}`,
        need: `${s.min} ${s.unit}`,
        where: s.location,
      }))
    return [...lowTech, ...lowProv, ...lowSpare]
  }, [ops.provisions, ops.spares])

  if (!user) return null

  return (
    <div className="pad inv">
      <div className="inv-head">
        <div>
          <p className="inv-kicker">Stores</p>
          <p className="inv-copy">Technical stock, provisioning, and the shopping list that feeds “below min”.</p>
        </div>
        <SectionTabs value={tab} onChange={(id) => setParams({ tab: id })} tabs={[...tabs]} />
      </div>

      {tab === 'technical' && (
        <>
          <div className="filters" style={{ marginBottom: 18 }}>
            {houses.map((h) => (
              <button
                key={h.id}
                className={house === h.id ? 'on' : ''}
                onClick={() => setParams({ tab, house: h.id })}
              >
                {h.label}
              </button>
            ))}
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
              {tech.map((i) => (
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
        </>
      )}

      {tab === 'provisioning' && (
        <table className="table inv-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Item</th>
              <th>Stock</th>
              <th>Min</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {ops.provisions.map((p) => (
              <tr key={p.id}>
                <td>{p.category}</td>
                <td>{p.item}</td>
                <td className={p.stock < p.min ? 'low' : ''}>
                  {p.stock} {p.unit}
                </td>
                <td>
                  {p.min} {p.unit}
                </td>
                <td className="muted">{p.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === 'shopping' && (
        <div className="ops-stack">
          <table className="table inv-table">
            <thead>
              <tr>
                <th>Low stock</th>
                <th>Have</th>
                <th>Min</th>
                <th>Where</th>
              </tr>
            </thead>
            <tbody>
              {shop.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td className="low">{row.have}</td>
                  <td>{row.need}</td>
                  <td className="muted">{row.where}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="inv-kicker">Purchase requests</p>
          <table className="table inv-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Supplier</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ops.purchases.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.title}
                    <div className="muted">{p.note}</div>
                  </td>
                  <td>{p.supplier}</td>
                  <td>
                    {p.amount ? `${p.amount} ${p.currency}` : '—'}
                    <div className="muted">{p.category}</div>
                  </td>
                  <td className={p.status === 'pending' ? 'low' : ''}>{p.status}</td>
                  <td>
                    {admin && p.status === 'pending' && (
                      <button className="text-link" type="button" onClick={() => setPurchaseStatus(p.id, 'approved')}>
                        Approve
                      </button>
                    )}
                    <div className="muted">
                      {dayClock(p.at)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
