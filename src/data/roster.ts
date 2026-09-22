import { rosterAudit } from '../lib/roster'
import type { RosterEntry } from '../types'

function entry(input: Omit<RosterEntry, 'notes'> & { note: string }): RosterEntry {
  const created = rosterAudit(input.requestedBy, 'created', input.note)
  created.at = input.requestedAt
  const first: RosterEntry['notes'] = [created]
  if (input.status === 'approved' && input.decidedBy && input.decidedAt) {
    const decided = rosterAudit(
      input.decidedBy,
      input.requestedBy === input.decidedBy ? 'admin_change' : 'approved',
      'Approved',
    )
    decided.at = input.decidedAt
    first.push(decided)
  }
  return { ...input, notes: first }
}

export function rosterSeed(): RosterEntry[] {
  return [
    entry({
      id: 'rs-luca-pending',
      crewId: 'luca',
      from: '2026-09-21',
      to: '2026-09-28',
      kind: 'offboard',
      presence: 'offboard',
      duty: 'leave',
      reason: 'personal',
      comment: 'Personal leave',
      status: 'pending',
      requestedBy: 'luca',
      requestedAt: '2026-09-20T16:40:00+02:00',
      note: 'Request created',
    }),
    entry({
      id: 'rs-julien-duty',
      crewId: 'julien',
      from: '2026-09-22',
      to: '2026-09-22',
      kind: 'off_duty',
      presence: 'onboard',
      duty: 'off_duty',
      reason: 'personal',
      comment: 'After guest dinner — off duty, still on board.',
      status: 'approved',
      requestedBy: 'julien',
      requestedAt: '2026-09-18T11:00:00+02:00',
      decidedBy: 'eddy',
      decidedAt: '2026-09-18T14:20:00+02:00',
      note: 'Request created',
    }),
    entry({
      id: 'rs-marco-sick',
      crewId: 'marco',
      from: '2026-09-30',
      to: '2026-09-30',
      kind: 'sick',
      presence: 'onboard',
      duty: 'sick',
      reason: 'medical',
      comment: 'In cabin. Engineering covered by Max for watches only.',
      status: 'approved',
      requestedBy: 'marco',
      requestedAt: '2026-09-19T08:10:00+02:00',
      decidedBy: 'eddy',
      decidedAt: '2026-09-19T08:40:00+02:00',
      note: 'Request created',
    }),
    entry({
      id: 'rs-sofia-leave',
      crewId: 'sofia',
      from: '2026-10-09',
      to: '2026-10-19',
      kind: 'leave',
      presence: 'offboard',
      duty: 'leave',
      reason: 'leave',
      comment: 'Home. Interior covered by Max + Julien for service only.',
      status: 'approved',
      requestedBy: 'sofia',
      requestedAt: '2026-09-01T10:00:00+02:00',
      decidedBy: 'eddy',
      decidedAt: '2026-09-02T09:15:00+02:00',
      note: 'Request created',
    }),
    entry({
      id: 'rs-luca-rotation',
      crewId: 'luca',
      from: '2026-10-31',
      to: '2026-11-15',
      kind: 'leave',
      presence: 'offboard',
      duty: 'leave',
      reason: 'leave',
      comment: 'Relief bosun TBC. Handover before Olbia.',
      status: 'approved',
      requestedBy: 'luca',
      requestedAt: '2026-08-20T12:00:00+02:00',
      decidedBy: 'eddy',
      decidedAt: '2026-08-21T09:00:00+02:00',
      note: 'Request created',
    }),
    entry({
      id: 'rs-julien-train',
      crewId: 'julien',
      from: '2026-10-02',
      to: '2026-10-03',
      kind: 'training',
      presence: 'offboard',
      duty: 'training',
      reason: 'other',
      comment: 'Allergen course in Olbia. Galley cold plates those two days.',
      status: 'approved',
      requestedBy: 'julien',
      requestedAt: '2026-09-10T09:00:00+02:00',
      decidedBy: 'eddy',
      decidedAt: '2026-09-10T11:30:00+02:00',
      note: 'Request created',
    }),
  ]
}
