import type { IncomingMessage, ServerResponse } from 'node:http'
import { parseMagicPortHtml, parseMstHtml } from '../src/lib/aisParse'

const MAGICPORT =
  'https://magicport.ai/vessels/pleasure-craft/thalima-mmsi-235077622'
const MST =
  'https://www.myshiptracking.com/vessels/thalima-mmsi-235077622-imo-9590278'

const UA = 'Mozilla/5.0 (compatible; ThalimaCrew/1.0; +https://thalima.vercel.app)'

export type AisPayload = {
  lat: number
  lon: number
  sogKn: number
  cog: number | null
  status: string
  destination: string | null
  fetchedAt: string
  provider: 'magicport' | 'myshiptracking'
}

async function fetchText(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  })
  if (!r.ok) throw new Error(`http ${r.status}`)
  return r.text()
}

export async function fetchLiveAis(): Promise<AisPayload> {
  const fetchedAt = new Date().toISOString()

  try {
    const html = await fetchText(MAGICPORT)
    const parsed = parseMagicPortHtml(html)
    if (parsed) return { ...parsed, fetchedAt, provider: 'magicport' }
  } catch {
    /* fall through to MST */
  }

  const html = await fetchText(MST)
  const parsed = parseMstHtml(html)
  if (!parsed) throw new Error('ais-parse')
  return { ...parsed, fetchedAt, provider: 'myshiptracking' }
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.end(JSON.stringify(body))
}

export async function handleAis(_req: IncomingMessage, res: ServerResponse) {
  try {
    const fix = await fetchLiveAis()
    sendJson(res, 200, fix)
  } catch (err) {
    sendJson(res, 502, {
      error: 'ais-unavailable',
      message: err instanceof Error ? err.message : 'ais fetch failed',
    })
  }
}
