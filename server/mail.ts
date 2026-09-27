import './env'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { crew, deptLabel } from '../src/data/crew'
import { dueLine } from '../src/lib/format'
import type { Department } from '../src/types'
import { supabaseAdmin, supabaseAdminReady } from './supabaseAdmin'

type TaskPayload = {
  kind: 'task'
  taskId: string
  title: string
  body: string
  due: string
  department: Department
  assigneeIds: string[]
  fromId: string
  origin?: string
}

type ExpensePayload = {
  kind: 'expense'
  expenseId: string
  ref: string
  vendor: string
  amount: string
  category: string
  description: string
  approverId: string
  fromId: string
  origin?: string
}

type ChatPayload = {
  kind: 'chat'
  channelId: string
  text: string
  fromId: string
  toIds: string[]
  origin?: string
}

type MailJob = {
  to: string
  toName: string
  subject: string
  html: string
  text: string
}

function appUrl(origin?: string) {
  const clean = (value: string) => value.replace(/\/$/, '')
  if (origin && /^https?:\/\/[^\s]+$/i.test(origin) && !/localhost|127\.0\.0\.1/i.test(origin)) return clean(origin)
  const env = (process.env.APP_URL || process.env.VITE_APP_URL || '').replace(/\/$/, '')
  if (env && !/localhost|127\.0\.0\.1/i.test(env)) return env
  if (origin && /^https?:\/\/[^\s]+$/i.test(origin)) return clean(origin)
  return 'https://thalima.vercel.app'
}

function mailFrom() {
  return process.env.MAIL_FROM || 'Thalima <onboarding@resend.dev>'
}

function wrap(base: string, inner: string) {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f5f8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f8;">
    <tr><td align="center" style="padding:48px 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e7e9ee;border-radius:22px;">
        <tr><td style="padding:40px 40px 36px;font-family:Inter,Helvetica,Arial,sans-serif;color:#2c3140;text-align:left;">
          <img src="${esc(base)}/logo.png" alt="Thalima" width="128" style="display:block;width:128px;height:auto;margin:0 0 32px;border:0;">
          ${inner}
          <p style="margin:36px 0 0;padding-top:22px;border-top:1px solid #e7e9ee;font-size:12px;line-height:1.6;color:#8b909a;">Thalima crew ops. The button opens this item when you are signed in.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function actions(primary: { href: string; label: string }, secondary?: { href: string; label: string }) {
  const main = `<a href="${esc(primary.href)}" style="display:inline-block;background:#6d5cff;color:#ffffff;text-decoration:none;font-family:Inter,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:-0.02em;padding:14px 22px;border-radius:999px;">${esc(primary.label)}</a>`
  const alt = secondary
    ? `<a href="${esc(secondary.href)}" style="display:inline-block;background:#ffffff;color:#2c3140;text-decoration:none;font-family:Inter,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:-0.02em;padding:13px 18px;border-radius:999px;border:1px solid #e7e9ee;">${esc(secondary.label)}</a>`
    : ''
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr><td style="padding:0 10px 8px 0;">${main}</td>${alt ? `<td style="padding:0 0 8px 0;">${alt}</td>` : ''}</tr></table>`
}

function kicker(label: string) {
  return `<p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#8b909a;">${esc(label)}</p>`
}

function title(value: string) {
  return `<p style="margin:0 0 14px;font-size:26px;line-height:1.25;font-weight:600;letter-spacing:-0.04em;color:#2c3140;">${esc(value)}</p>`
}

function copy(value: string) {
  return `<p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#5c6470;">${esc(value)}</p>`
}

function meta(label: string, value: string) {
  return `<p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8b909a;">${esc(label)}</p><p style="margin:0 0 16px;font-size:16px;line-height:1.45;color:#2c3140;">${esc(value)}</p>`
}

function person(id: string) {
  const row = crew.find((c) => c.id === id)
  return { name: row?.name ?? id, email: row?.email ?? '', first: row?.name.split(' ')[0] ?? id }
}

export function mailLookup(token: string) {
  const url = process.env.VITE_SUPABASE_URL || ''
  const anon = process.env.VITE_SUPABASE_ANON_KEY || ''
  if (!token || !url || !anon) return null
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function emailFor(id: string, db?: SupabaseClient | null) {
  const read = async (client: SupabaseClient) => {
    const { data } = await client.from('profiles').select('email, name').eq('id', id).maybeSingle()
    if (data?.email) return { email: String(data.email), name: String(data.name || id) }
    return null
  }
  if (db) {
    const hit = await read(db)
    if (hit) return hit
  }
  if (supabaseAdminReady()) {
    const hit = await read(supabaseAdmin())
    if (hit) return hit
  }
  const p = person(id)
  return { email: p.email, name: p.name }
}

export async function taskJobs(payload: TaskPayload, db?: SupabaseClient | null): Promise<MailJob[]> {
  const fromWho = await emailFor(payload.fromId, db)
  const from = fromWho.name.split(' ')[0] || 'Crew'
  const due = dueLine(payload.due)
  const station = deptLabel[payload.department]
  const base = appUrl(payload.origin)
  const href = `${base}/board/${encodeURIComponent(payload.taskId)}`
  const notes = `${base}/notifications`
  const text = [
    `${payload.title}`,
    '',
    payload.body,
    '',
    `Due: ${due}`,
    `Station: ${station}`,
    `From: ${from}`,
    '',
    `Open task: ${href}`,
    `Notifications: ${notes}`,
  ].join('\n')
  const html = wrap(
    base,
    `${kicker('Task')}
    ${title(payload.title)}
    ${payload.body ? copy(payload.body) : ''}
    ${meta('Due', due)}
    ${meta('Station', `${station} · assigned by ${from}`)}
    ${actions({ href, label: 'Open task' }, { href: notes, label: 'Notifications' })}`,
  )
  return Promise.all(
    payload.assigneeIds.map(async (id) => {
      const to = await emailFor(id, db)
      return {
        to: to.email,
        toName: to.name,
        subject: `Task · ${payload.title} · ${due}`,
        html,
        text: `Hi ${to.name.split(' ')[0]},\n\n${text}`,
      }
    }),
  )
}

export async function expenseJobs(payload: ExpensePayload, db?: SupabaseClient | null): Promise<MailJob[]> {
  const fromWho = await emailFor(payload.fromId, db)
  const from = fromWho.name.split(' ')[0] || 'Crew'
  const base = appUrl(payload.origin)
  const href = `${base}/accounting/expenses/${encodeURIComponent(payload.expenseId)}`
  const queue = `${base}/accounting/approvals`
  const to = await emailFor(payload.approverId, db)
  const text = [
    `Approval needed · ${payload.ref}`,
    payload.vendor,
    payload.amount,
    payload.category,
    payload.description,
    `From: ${from}`,
    `Open: ${href}`,
  ].join('\n')
  const html = wrap(
    base,
    `${kicker('Approval')}
    ${title('Approval needed')}
    ${copy(`${from} submitted ${payload.ref} for your sign-off.`)}
    ${meta('Vendor', payload.vendor)}
    ${meta('Amount', payload.amount)}
    ${meta('Category', payload.category)}
    ${payload.description ? meta('Note', payload.description) : ''}
    ${actions({ href, label: 'Open expense' }, { href: queue, label: 'Approvals' })}`,
  )
  return [
    {
      to: to.email,
      toName: to.name,
      subject: `Approval · ${payload.ref} · ${payload.amount}`,
      html,
      text: `Hi ${to.name.split(' ')[0]},\n\n${text}`,
    },
  ]
}

export async function chatJobs(payload: ChatPayload, db?: SupabaseClient | null): Promise<MailJob[]> {
  const sender = await emailFor(payload.fromId, db)
  const from = sender.name.split(' ')[0] || 'Crew'
  const base = appUrl(payload.origin)
  const href = `${base}/messages/${encodeURIComponent(payload.channelId)}`
  const notes = `${base}/notifications`
  const room = payload.channelId === 'all' ? 'All crew' : 'you'
  const preview = payload.text.trim()
  const subject = payload.channelId === 'all' ? `Chat · ${from} in All crew` : `Chat · ${from}`
  const html = wrap(
    base,
    `${kicker('Chat')}
    ${title(`${from} wrote`)}
    ${copy(preview)}
    ${meta('Conversation', room)}
    ${actions({ href, label: 'Open chat' }, { href: notes, label: 'Notifications' })}`,
  )
  const text = [`${from} wrote to ${room}:`, '', preview, '', `Open chat: ${href}`, `Notifications: ${notes}`].join('\n')
  return Promise.all(
    payload.toIds.filter((id) => id && id !== payload.fromId).map(async (id) => {
      const to = await emailFor(id, db)
      return {
        to: to.email,
        toName: to.name,
        subject,
        html,
        text: `Hi ${to.name.split(' ')[0]},\n\n${text}`,
      }
    }),
  )
}

function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendJobs(jobs: MailJob[]) {
  const key = process.env.RESEND_API_KEY || ''
  const bcc = (process.env.MAIL_BCC || '').trim()
  const sent: string[] = []
  for (const job of jobs) {
    if (!job.to || !job.to.includes('@')) continue
    if (!key) {
      console.warn(`[mail] skip ${job.to} · ${job.subject} (no RESEND_API_KEY)`)
      continue
    }
    const body: Record<string, unknown> = {
      from: mailFrom(),
      to: [job.to],
      subject: job.subject,
      html: job.html,
      text: job.text,
    }
    if (bcc && bcc !== job.to) body.bcc = [bcc]
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.text()
      console.warn(`[mail] fail ${job.to}: ${err.slice(0, 200)}`)
      continue
    }
    sent.push(job.to)
  }
  return sent
}

export type NotifyPayload = TaskPayload | ExpensePayload | ChatPayload
