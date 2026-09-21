import { inventory } from '../data/crew'
import type { Equipment, OpsState, Systems, Task } from '../types'

export function liveHours(eq: Equipment, systems: Systems) {
  if (eq.id === 'main') return systems.engineHours
  if (eq.id === 'genset') return systems.gensetHours
  return eq.hours
}

export function hoursToService(eq: Equipment, systems: Systems) {
  if (!eq.intervalH || !eq.nextServiceH) return null
  return eq.nextServiceH - liveHours(eq, systems)
}

export function certSoon(iso: string, days = 30) {
  const ms = new Date(iso).getTime() - Date.now()
  return ms < days * 86400_000
}

export function certOverdue(iso: string) {
  return new Date(iso).getTime() < Date.now()
}

export type OpsAlert = {
  id: string
  tone: 'hot' | 'soon' | 'ok'
  count: number
  label: string
  to: string
}

export function buildAlerts(input: { tasks: Task[]; ops: OpsState; systems: Systems }): OpsAlert[] {
  const { tasks, ops, systems } = input
  const overdue = tasks.filter((t) => t.status !== 'done' && new Date(t.due).getTime() < Date.now()).length
  const maint = ops.equipment.filter((e) => {
    const left = hoursToService(e, systems)
    return left !== null && left <= 50
  }).length
  const certs = ops.certificates.filter((c) => certSoon(c.expiresAt)).length
  const techLow = inventory.filter((i) => i.stock < i.min).length
  const provLow = ops.provisions.filter((p) => p.stock < p.min).length
  const spareLow = ops.spares.filter((s) => s.stock < s.min).length
  const low = techLow + provLow + spareLow
  const defects = ops.defects.filter((d) => d.status !== 'closed').length
  const purchase = ops.purchases.filter((p) => p.status === 'pending').length

  const row = (id: string, count: number, label: string, to: string): OpsAlert => ({
    id,
    count,
    label,
    to,
    tone: count ? (id === 'overdue' || id === 'certs' || id === 'defects' ? 'hot' : 'soon') : 'ok',
  })

  return [
    row('overdue', overdue, 'Overdue tasks', '/board'),
    row('maint', maint, 'Maintenance due', '/maintenance?tab=schedule'),
    row('certs', certs, 'Certificate expiring', '/cloud?tab=certificates'),
    row('stock', low, 'Low stock', '/inventory?tab=shopping'),
    row('defects', defects, 'Defect open', '/maintenance?tab=defects'),
    row('buy', purchase, 'Purchase pending', '/inventory?tab=shopping'),
  ]
}
