import type { IncomingMessage, ServerResponse } from 'node:http'
import { chatJobs, expenseJobs, mailLookup, sendJobs, taskJobs, type NotifyPayload } from '../server/mail'

function readBody(req: IncomingMessage & { body?: unknown }) {
  if (typeof req.body === 'string') return Promise.resolve(req.body)
  if (req.body && typeof req.body === 'object') return Promise.resolve(JSON.stringify(req.body))
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

export default async function handler(req: IncomingMessage & { body?: unknown }, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end('')
    return
  }
  if (req.method !== 'POST') {
    send(res, 405, { error: 'POST only.' })
    return
  }
  const header = String(req.headers.authorization ?? '')
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const lookup = mailLookup(token)
  if (!lookup) {
    send(res, 401, { error: 'Sign in required.' })
    return
  }
  const { data, error } = await lookup.auth.getUser(token)
  if (error || !data.user) {
    send(res, 401, { error: 'Sign in required.' })
    return
  }
  let body: NotifyPayload
  try {
    const raw = await readBody(req)
    body = raw ? (JSON.parse(raw) as NotifyPayload) : (null as unknown as NotifyPayload)
  } catch {
    send(res, 400, { error: 'Invalid notification.' })
    return
  }
  if (!body || (body.kind !== 'task' && body.kind !== 'expense' && body.kind !== 'chat')) {
    send(res, 400, { error: 'Invalid notification.' })
    return
  }
  const jobs =
    body.kind === 'expense'
      ? await expenseJobs(body, lookup)
      : body.kind === 'chat'
        ? await chatJobs(body, lookup)
        : await taskJobs(body, lookup)
  const sent = await sendJobs(jobs)
  send(res, 200, { ok: true, sent: sent.length })
}
