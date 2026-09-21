import type { Place } from './geo'

type PhotonHit = {
  geometry: { coordinates: [number, number] }
  properties: { name?: string; city?: string; country?: string; osm_value?: string }
}

export async function reverseGeocode(lat: number, lon: number) {
  const url = new URL('https://photon.komoot.io/reverse')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lon))
  const res = await fetch(url)
  if (!res.ok) return { city: 'On station', region: '', country: '' }
  const data = (await res.json()) as { features?: PhotonHit[] }
  const p = data.features?.[0]?.properties ?? {}
  return {
    city: p.city || p.name || 'On station',
    region: '',
    country: p.country || '',
  }
}

export async function geocode(q: string, near: Place): Promise<Place[]> {
  const url = new URL('https://photon.komoot.io/api/')
  url.searchParams.set('q', q)
  url.searchParams.set('lat', String(near.lat))
  url.searchParams.set('lon', String(near.lon))
  url.searchParams.set('limit', '6')
  const res = await fetch(url)
  if (!res.ok) return []
  const data = (await res.json()) as { features?: PhotonHit[] }
  return (data.features ?? []).map((f) => {
    const [lon, lat] = f.geometry.coordinates
    const bits = [f.properties.name, f.properties.city, f.properties.country].filter(Boolean)
    return { name: bits.join(', '), lat, lon }
  })
}
