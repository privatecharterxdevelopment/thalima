import './env'
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
  const env = (process.env.APP_URL || process.env.VITE_APP_URL || '').replace(/\/$/, '')
  if (env) return env
  if (origin && /^https?:\/\/[^\s]+$/i.test(origin)) return origin.replace(/\/$/, '')
  return 'http://localhost:5173'
}

function mailFrom() {
  return process.env.MAIL_FROM || 'Thalima <onboarding@resend.dev>'
}

function wrap(inner: string) {
  return `<!doctype html>
<html><body style="margin:0;background:#f3f4f7;font-family:Inter,Helvetica,Arial,sans-serif;color:#1c2430;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f7;padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:24px;padding:48px 40px;text-align:left;">
        <tr><td style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#8a9099;padding-bottom:24px;">Thalima</td></tr>
        ${inner}
      </table>
    </td></tr>
  </table>
</body></html>`
}

function btn(href: string, label: string) {
  return `<p style="margin:32px 0 0;"><a href="${href}" style="display:inline-block;background:#1c2430;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:15px;">${label}</a></p>`
}

function person(id: string) {
  const row = crew.find((c) => c.id === id)
  return { name: row?.name ?? id, email: row?.email ?? '', first: row?.name.split(' ')[0] ?? id }
}

async function emailFor(id: string) {
  if (supabaseAdminReady()) {
    const { data } = await supabaseAdmin().from('profiles').select('email, name').eq('id', id).maybeSingle()
    if (data?.email) return { email: String(data.email), name: String(data.name || id) }
  }
  const p = person(id)
  return { email: p.email, name: p.name }
}

export function taskJobs(payload: TaskPayload): Promise<MailJob[]> {
  const from = person(payload.fromId).first
  const due = dueLine(payload.due)
  const station = deptLabel[payload.department]
  const href = `${appUrl(payload.origin)}/board/${encodeURIComponent(payload.taskId)}`
  const text = [
    `${payload.title}`,
    '',
    payload.body,
    '',
    `Due: ${due}`,
    `Station: ${station}`,
    `From: ${from}`,
    '',
    `Open: ${href}`,
  ].join('\n')
  const html = wrap(`
    <tr><td style="font-size:28px;line-height:1.25;font-weight:600;padding-bottom:16px;">${esc(payload.title)}</td></tr>
    <tr><td style="font-size:16px;line-height:1.65;color:#4a5160;padding-bottom:28px;max-width:40ch;">${esc(payload.body)}</td></tr>
    <tr><td>
      <p style="margin:0 0 8px;font-size:14px;color:#8a9099;">Due</p>
      <p style="margin:0 0 20px;font-size:18px;">${esc(due)}</p>
      <p style="margin:0 0 8px;font-size:14px;color:#8a9099;">Station</p>
      <p style="margin:0 0 20px;font-size:18px;">${esc(station)} · assigned by ${esc(from)}</p>
      ${btn(href, 'Open task')}
      <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#8a9099;">On the board you can set Open, In progress, Awaiting or Completed.</p>
    </td></tr>
  `)
  return Promise.all(
    payload.assigneeIds.map(async (id) => {
      const to = await emailFor(id)
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

export async function expenseJobs(payload: ExpensePayload): Promise<MailJob[]> {
  const from = person(payload.fromId).first
  const href = `${appUrl(payload.origin)}/accounting/expenses/${encodeURIComponent(payload.expenseId)}`
  const queue = `${appUrl(payload.origin)}/accounting/approvals`
  const to = await emailFor(payload.approverId)
  const text = [
    `Approval needed · ${payload.ref}`,
    payload.vendor,
    payload.amount,
    payload.category,
    payload.description,
    `From: ${from}`,
    `Open: ${href}`,
  ].join('\n')
  const html = wrap(`
    <tr><td style="font-size:28px;line-height:1.25;font-weight:600;padding-bottom:16px;">Approval needed</td></tr>
    <tr><td style="font-size:16px;line-height:1.65;color:#4a5160;padding-bottom:28px;">${esc(from)} submitted ${esc(payload.ref)} for your sign-off.</td></tr>
    <tr><td>
      <p style="margin:0 0 8px;font-size:14px;color:#8a9099;">Vendor</p>
      <p style="margin:0 0 20px;font-size:18px;">${esc(payload.vendor)}</p>
      <p style="margin:0 0 8px;font-size:14px;color:#8a9099;">Amount</p>
      <p style="margin:0 0 20px;font-size:18px;">${esc(payload.amount)}</p>
      <p style="margin:0 0 8px;font-size:14px;color:#8a9099;">Category</p>
      <p style="margin:0 0 20px;font-size:18px;">${esc(payload.category)}</p>
      ${payload.description ? `<p style="margin:0 0 8px;font-size:14px;color:#8a9099;">Note</p><p style="margin:0 0 20px;font-size:16px;line-height:1.6;">${esc(payload.description)}</p>` : ''}
      ${btn(href, 'Review expense')}
      <p style="margin:16px 0 0;font-size:14px;"><a href="${queue}" style="color:#1c2430;">Open approvals inbox</a></p>
      <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#8a9099;">Approve or reject from Accounting. You cannot approve your own claim.</p>
    </td></tr>
  `)
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

export async function chatJobs(payload: ChatPayload): Promise<MailJob[]> {
  const sender = await emailFor(payload.fromId)
  const from = sender.name.split(' ')[0] || 'Crew'
  const href = `${appUrl(payload.origin)}/messages/${encodeURIComponent(payload.channelId)}`
  const room = payload.channelId === 'all' ? 'All crew' : 'you'
  const preview = payload.text.trim()
  const subject = payload.channelId === 'all' ? `Chat · ${from} in All crew` : `Chat · ${from}`
  const html = wrap(`
    <tr><td style="font-size:28px;line-height:1.25;font-weight:600;padding-bottom:16px;">${esc(from)} wrote</td></tr>
    <tr><td style="font-size:16px;line-height:1.65;color:#4a5160;padding-bottom:28px;max-width:40ch;">${esc(preview)}</td></tr>
    <tr><td>
      <p style="margin:0 0 8px;font-size:14px;color:#8a9099;">Conversation</p>
      <p style="margin:0 0 20px;font-size:18px;">${esc(room)}</p>
      ${btn(href, 'Open chat')}
      <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#8a9099;">Reply from Chat on Thalima.</p>
    </td></tr>
  `)
  const text = [`${from} wrote to ${room}:`, '', preview, '', `Open: ${href}`].join('\n')
  return Promise.all(
    payload.toIds.filter((id) => id && id !== payload.fromId).map(async (id) => {
      const to = await emailFor(id)
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
