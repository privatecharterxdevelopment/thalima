export type Place = { name: string; lat: number; lon: number }

export function toRad(d: number) {
  return (d * Math.PI) / 180
}

export function toDeg(r: number) {
  return (r * 180) / Math.PI
}

export function haversineNm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 3440.065
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

export function bearingDeg(a: Place, b: Place) {
  const y = Math.sin(toRad(b.lon - a.lon)) * Math.cos(toRad(b.lat))
  const x =
    Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lon - a.lon))
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/** Rhumb line as [lng, lat][] for MapLibre */
export function rhumbLine(a: Place, b: Place, steps = 80): [number, number][] {
  const pts: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const lat = a.lat + (b.lat - a.lat) * t
    let dLon = b.lon - a.lon
    if (dLon > 180) dLon -= 360
    if (dLon < -180) dLon += 360
    const lon = a.lon + dLon * t
    pts.push([lon, lat])
  }
  return pts
}

export function etaHours(nm: number, kn: number) {
  const speed = kn > 0.4 ? kn : 11
  return nm / speed
}

export function describePassage(nm: number, kn: number, at = new Date()) {
  const hrs = etaHours(nm, kn)
  let h = Math.floor(hrs)
  let m = Math.round((hrs % 1) * 60)
  if (m === 60) {
    h += 1
    m = 0
  }
  const arrive = new Date(at.getTime() + hrs * 3600_000)
  const clock = arrive.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  })
  const day = arrive.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Europe/Rome' })
  const today = at.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'Europe/Rome' })
  return {
    hrs,
    label: `${h} h ${String(m).padStart(2, '0')} m`,
    nm: `${nm.toFixed(1)} nm`,
    arrive: day === today ? clock : `${day} ${clock}`,
  }
}
