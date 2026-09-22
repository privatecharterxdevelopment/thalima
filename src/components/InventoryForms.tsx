import { useState } from 'react'
import { deptLabel } from '../data/crew'
import { useStore } from '../store'
import type { Department, ProvisionCat, PurchaseCat } from '../types'

const provisionCats: ProvisionCat[] = ['food', 'beverage', 'wine', 'toiletries', 'cleaning', 'laundry']
const purchaseCats: PurchaseCat[] = ['repair', 'provisioning', 'fuel', 'marina', 'crew', 'other']

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function NewStockItem({ onClose }: { onClose: () => void }) {
  const { user, addStockItem } = useStore()
  const [kind, setKind] = useState<'technical' | 'provisioning'>('technical')
  const [dept, setDept] = useState<Department>(user?.department ?? 'deck')
  const [category, setCategory] = useState<ProvisionCat>('food')
  const [item, setItem] = useState('')
  const [stock, setStock] = useState('0')
  const [min, setMin] = useState('1')
  const [unit, setUnit] = useState('pcs')
  const [note, setNote] = useState('')

  return (
    <Modal title="New inventory item" onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!item.trim()) return
          const base = {
            item: item.trim(),
            stock: Math.max(0, Number(stock) || 0),
            min: Math.max(0, Number(min) || 0),
            unit: unit.trim() || 'pcs',
            note: note.trim() || '—',
          }
          if (kind === 'technical') addStockItem({ kind, row: { ...base, dept } })
          else addStockItem({ kind, row: { ...base, category } })
          onClose()
        }}
      >
        <label>
          List
          <select value={kind} onChange={(e) => setKind(e.target.value as 'technical' | 'provisioning')}>
            <option value="technical">Technical</option>
            <option value="provisioning">Provisioning</option>
          </select>
        </label>
        {kind === 'technical' ? (
          <label>
            Station
            <select value={dept} onChange={(e) => setDept(e.target.value as Department)}>
              {(Object.keys(deptLabel) as Department[]).map((d) => (
                <option key={d} value={d}>
                  {deptLabel[d]}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value as ProvisionCat)}>
              {provisionCats.map((c) => (
                <option key={c} value={c}>
                  {cap(c)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Item
          <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Watermaker 5 μm filter" required />
        </label>
        <div className="form-row-3">
          <label>
            In stock
            <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} />
          </label>
          <label>
            Min
            <input type="number" min="0" value={min} onChange={(e) => setMin(e.target.value)} />
          </label>
          <label>
            Unit
            <input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </label>
        </div>
        <label>
          Note / location
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Workshop, under bench" />
        </label>
        <div className="row-btns">
          <button className="btn" type="submit">
            Add item
          </button>
          <button className="btn ghost" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function NewPurchase({ onClose }: { onClose: () => void }) {
  const { addPurchase } = useStore()
  const [title, setTitle] = useState('')
  const [supplier, setSupplier] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [category, setCategory] = useState<PurchaseCat>('repair')
  const [note, setNote] = useState('')

  return (
    <Modal title="New purchase request" onClose={onClose}>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim()) return
          addPurchase({
            title: title.trim(),
            supplier: supplier.trim() || '—',
            amount: Number(amount) || 0,
            currency,
            category,
            note: note.trim(),
          })
          onClose()
        }}
      >
        <label>
          What needs buying
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Cummins raw-water impeller ×2" required />
        </label>
        <label>
          Supplier
          <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Chandlery, marina, online…" />
        </label>
        <div className="form-row-3">
          <label>
            Est. amount
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label>
            Currency
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option>EUR</option>
              <option>USD</option>
              <option>GBP</option>
              <option>CHF</option>
            </select>
          </label>
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value as PurchaseCat)}>
              {purchaseCats.map((c) => (
                <option key={c} value={c}>
                  {cap(c)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Why / note
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="row-btns">
          <button className="btn" type="submit">
            Send request
          </button>
          <button className="btn ghost" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}
