import type { IncomingMessage, ServerResponse } from 'node:http'

const MST = 'https://www.myshiptracking.com/vessels/thalima-mmsi-235077622-imo-9590278'

export async function handleAis(_req: IncomingMessage, res: ServerResponse) {
  try {
    const r = await fetch(MST, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ThalimaCrew/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    })
    const html = await r.text()
    res.statusCode = r.ok ? 200 : 502
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(html)
  } catch {
    res.statusCode = 502
    res.end('')
  }
}
