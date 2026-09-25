/** Pure AIS HTML parsers — safe for browser + Node. */

export function parseMagicPortHtml(html: string): {
  lat: number
  lon: number
  sogKn: number
  cog: number | null
  status: string
  destination: string | null
} | null {
  const loc =
    html.match(/portcall\/\d+\?lat=(-?\d+(?:\.\d+)?)&lng=(-?\d+(?:\.\d+)?)/i) ||
    html.match(/[?&]lat=(-?\d+(?:\.\d+)?)&lng=(-?\d+(?:\.\d+)?)/i)
  if (!loc) return null
  const lat = Number(loc[1])
  const lon = Number(loc[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null

  const sogMatch = html.match(/Speed<\/th>\s*<td>([\d.]+)\s*knots<\/td>/i)
  const sogKn = sogMatch ? Number(sogMatch[1]) : 0

  const cogMatch = html.match(/Course<\/th>\s*<td>([\d.]+)\s*º?<\/td>/i)
  let cog: number | null = null
  if (cogMatch) {
    const c = Number(cogMatch[1])
    if (Number.isFinite(c) && c >= 0 && c < 360) cog = c
  }

  const destMatch =
    html.match(/destination of\s+([A-Z][A-Za-z0-9 .'/()-]+?)\s+port/i) ||
    html.match(/Making port at\s+([A-Z][A-Za-z0-9 .'/()-]+)/i)
  const destination = destMatch ? destMatch[1].trim() : null

  const statusMatch = html.match(/Navigation Status<\/th>\s*<td>([^<]+)<\/td>/i)
  const rawStatus = statusMatch ? statusMatch[1].trim() : ''
  const sog = Number.isFinite(sogKn) ? sogKn : 0
  let status = 'At anchor'
  if (destination) status = `Making port at ${destination}`
  else if (rawStatus && rawStatus !== 'Unknown') status = rawStatus
  else if (sog > 0.4) status = 'Sailing'

  return { lat, lon, sogKn: sog, cog, status, destination }
}

export function parseMstHtml(html: string): {
  lat: number
  lon: number
  sogKn: number
  cog: number | null
  status: string
  destination: string | null
} | null {
  const coord =
    html.match(/coordinates\s*<strong>\s*(-?\d+(?:\.\d+)?)\s*(?:°|&deg;)?\s*\/\s*(-?\d+(?:\.\d+)?)/i) ||
    html.match(
      /canvas_map_generate\(\s*['"][^'"]+['"]\s*,\s*[\d.]+\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/,
    )
  if (!coord) return null
  const lat = Number(coord[1])
  const lon = Number(coord[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  const sogMatch = html.match(/current speed is\s*<strong>\s*([\d.]+)\s*Knots/i)
  const canvas = html.match(
    /canvas_map_generate\(\s*['"][^'"]+['"]\s*,\s*[\d.]+\s*,\s*-?\d+\.\d+\s*,\s*-?\d+\.\d+\s*,\s*([\d.]+)\s*,\s*([\d.]+)/,
  )
  const heading = canvas ? Number(canvas[1]) : NaN
  const canvasSog = canvas ? Number(canvas[2]) : NaN
  const sogKn = sogMatch ? Number(sogMatch[1]) : Number.isFinite(canvasSog) ? canvasSog : 0
  const cog = Number.isFinite(heading) && heading >= 0 && heading < 360 ? heading : null

  const destMatch = html.match(/Making port at\s+([A-Z][A-Za-z0-9 .'/()-]+)/i)
  const destination = destMatch ? destMatch[1].trim() : null
  const sog = Number.isFinite(sogKn) ? sogKn : 0
  const status = destination
    ? `Making port at ${destination}`
    : sog > 0.4
      ? 'Sailing'
      : 'At anchor'

  return { lat, lon, sogKn: sog, cog, status, destination }
}
