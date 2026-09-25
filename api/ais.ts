import { fetchLiveAis } from '../server/ais'

export default async function handler(
  _req: { method?: string },
  res: {
    statusCode: number
    setHeader: (k: string, v: string) => void
    end: (body: string) => void
  },
) {
  try {
    const fix = await fetchLiveAis()
    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.end(JSON.stringify(fix))
  } catch (err) {
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(
      JSON.stringify({
        error: 'ais-unavailable',
        message: err instanceof Error ? err.message : 'ais fetch failed',
      }),
    )
  }
}
