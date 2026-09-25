import { useEffect, useState } from 'react'
import { position } from '../data/yacht'
import { haversineNm } from './geo'
import { reverseGeocode } from './geocode'
import { parseMstHtml } from './aisParse'

export function isSailing(sogKn: number | null | undefined) {
  return (sogKn ?? 0) > 0.4
}

export type BoatFix = {
  lat: number
  lon: number
  accM: number | null
  sogKn: number | null
  cog: number | null
  city: string
  region: string
  country: string
  status: string
  source: 'ais'
  fetchedAt?: string
  provider?: string
}

export type TrackPoint = {
  lat: number
  lon: number
  sogKn: number | null
  cog: number | null
  at: string
}

/** @deprecated AIS boat fix — kept so older imports compile */
export type DeviceFix = BoatFix

const KEY = 'thalima.fix.v4'
const TRACK_KEY = 'thalima.ais.track.v2'
const AIS_URL = '/api/ais'
const MAX_TRACK = 500
/** Discard stale client caches still stuck on Sardinia / Olbia. */
const OLBIA = { lat: 41.0315, lon: 9.52428 }

const fallback: BoatFix = {
  lat: position.lat,
  lon: position.lon,
  accM: null,
  sogKn: position.sog,
  cog: position.cog,
  city: position.place,
  region: position.region,
  country: position.country ?? 'Spain',
  status: position.status,
  source: 'ais',
}

function isStaleSardinia(lat: number, lon: number) {
  return haversineNm({ lat, lon }, OLBIA) < 40
}

function isPlausibleFix(lat: number, lon: number) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false
  if (isStaleSardinia(lat, lon)) return false
  // Keep Med / nearby Atlantic — reject wild garbage
  return lat > 30 && lat < 48 && lon > -10 && lon < 20
}

let last: BoatFix = readCache() ?? fallback
let track: TrackPoint[] = readTrack()
const listeners = new Set<(fix: BoatFix) => void>()
const trackListeners = new Set<(pts: TrackPoint[]) => void>()
let started = false

function readCache(): BoatFix | null {
  try {
    // Drop legacy Olbia-era keys
    sessionStorage.removeItem('thalima.fix.v3')
    sessionStorage.removeItem('thalima.fix.v2')
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BoatFix
    if (parsed.source !== 'ais') return null
    if (typeof parsed.lat !== 'number' || typeof parsed.lon !== 'number') return null
    if (!isPlausibleFix(parsed.lat, parsed.lon)) return null
    return { ...fallback, ...parsed, source: 'ais' }
  } catch {
    return null
  }
}

function readTrack(): TrackPoint[] {
  try {
    localStorage.removeItem('thalima.ais.track.v1')
    const raw = localStorage.getItem(TRACK_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as TrackPoint[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (p) =>
        typeof p?.lat === 'number' &&
        typeof p?.lon === 'number' &&
        typeof p?.at === 'string' &&
        isPlausibleFix(p.lat, p.lon),
    )
  } catch {
    return []
  }
}

function persistTrack(pts: TrackPoint[]) {
  track = pts
  try {
    localStorage.setItem(TRACK_KEY, JSON.stringify(pts))
  } catch {
    /* ignore */
  }
  trackListeners.forEach((fn) => fn(pts))
}

function appendTrack(fix: BoatFix) {
  const at = fix.fetchedAt ?? new Date().toISOString()
  const prev = track[track.length - 1]
  if (prev) {
    const movedM = haversineNm({ lat: prev.lat, lon: prev.lon }, { lat: fix.lat, lon: fix.lon }) * 1852
    const ageMs = Date.parse(at) - Date.parse(prev.at)
    // Skip near-duplicates (< 25 m and < 2 min)
    if (movedM < 25 && Number.isFinite(ageMs) && ageMs < 120_000) return
  }
  const next = [
    ...track,
    { lat: fix.lat, lon: fix.lon, sogKn: fix.sogKn, cog: fix.cog, at },
  ].slice(-MAX_TRACK)
  persistTrack(next)
}

function emit(fix: BoatFix, opts?: { persist?: boolean }) {
  last = fix
  try {
    sessionStorage.setItem(KEY, JSON.stringify(fix))
  } catch {
    /* ignore */
  }
  appendTrack(fix)
  listeners.forEach((fn) => fn(fix))
  if (!opts?.persist) return
  void import('./api')
    .then(({ api }) => {
      const prev = track.length >= 2 ? track[track.length - 2] : null
      const moved =
        !prev ||
        haversineNm({ lat: prev.lat, lon: prev.lon }, { lat: fix.lat, lon: fix.lon }) * 1852 >= 25
      return api.pushBoatFix(
        {
          lat: fix.lat,
          lon: fix.lon,
          sogKn: fix.sogKn,
          cog: fix.cog,
          status: fix.status,
          city: fix.city,
          region: fix.region,
          country: fix.country,
          provider: fix.provider,
          fetchedAt: fix.fetchedAt,
        },
        { track: moved },
      )
    })
    .catch(() => {
      /* offline / signed out */
    })
}

/** @deprecated Prefer JSON /api/ais — kept for fixtures/tests */
export function parseAisHtml(html: string): { lat: number; lon: number; sogKn: number; cog: number | null } | null {
  const parsed = parseMstHtml(html)
  if (!parsed) return null
  return { lat: parsed.lat, lon: parsed.lon, sogKn: parsed.sogKn, cog: parsed.cog }
}

async function placeFor(lat: number, lon: number) {
  if (haversineNm({ lat, lon }, { lat: position.lat, lon: position.lon }) < 1.2) {
    return { city: position.place, region: position.region, country: position.country ?? 'Spain' }
  }
  try {
    return await reverseGeocode(lat, lon)
  } catch {
    return { city: position.place, region: position.region, country: position.country ?? 'Spain' }
  }
}

function asBoatFix(
  raw: {
    lat: number
    lon: number
    sogKn: number
    cog: number | null
    status?: string
    fetchedAt?: string
    provider?: string
  },
  place: { city: string; region: string; country: string },
): BoatFix {
  const sog = raw.sogKn
  return {
    lat: raw.lat,
    lon: raw.lon,
    accM: null,
    sogKn: sog,
    cog: raw.cog ?? last.cog ?? position.cog,
    city: place.city,
    region: place.region,
    country: place.country,
    status: raw.status || (isSailing(sog) ? 'Sailing' : 'At anchor'),
    source: 'ais',
    fetchedAt: raw.fetchedAt,
    provider: raw.provider,
  }
}

export async function fetchAisFix(): Promise<BoatFix> {
  const res = await fetch(AIS_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error('ais')
  const ctype = res.headers.get('content-type') ?? ''
  if (ctype.includes('application/json')) {
    const data = (await res.json()) as {
      lat?: number
      lon?: number
      sogKn?: number
      cog?: number | null
      status?: string
      fetchedAt?: string
      provider?: string
      error?: string
    }
    if (data.error || typeof data.lat !== 'number' || typeof data.lon !== 'number') {
      throw new Error('ais-json')
    }
    const place = await placeFor(data.lat, data.lon)
    return asBoatFix(
      {
        lat: data.lat,
        lon: data.lon,
        sogKn: typeof data.sogKn === 'number' ? data.sogKn : 0,
        cog: typeof data.cog === 'number' ? data.cog : null,
        status: data.status,
        fetchedAt: data.fetchedAt,
        provider: data.provider,
      },
      place,
    )
  }

  // Legacy HTML proxy response
  const html = await res.text()
  const parsed = parseAisHtml(html)
  if (!parsed) throw new Error('ais-parse')
  const place = await placeFor(parsed.lat, parsed.lon)
  return asBoatFix(parsed, place)
}

function start() {
  if (started) return
  started = true
  emit(last.source === 'ais' ? last : fallback)
  void hydrateRemoteTrack()
  const pull = () => {
    fetchAisFix()
      .then((fix) => emit(fix, { persist: true }))
      .catch(() => {
        /* keep last known AIS fix / fallback — still tracked */
      })
  }
  pull()
  window.setInterval(pull, 60_000)
}

async function hydrateRemoteTrack() {
  try {
    const { api } = await import('./api')
    const rows = await api.getBoatTrack(400)
    if (!rows.length) return
    const remote: TrackPoint[] = rows.map((r) => ({
      lat: Number(r.lat),
      lon: Number(r.lon),
      sogKn: r.sog_kn == null ? null : Number(r.sog_kn),
      cog: r.cog == null ? null : Number(r.cog),
      at: String(r.fetched_at),
    }))
    const byAt = new Map<string, TrackPoint>()
    for (const p of [...track, ...remote]) {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) continue
      byAt.set(`${p.at}|${p.lat.toFixed(5)}|${p.lon.toFixed(5)}`, p)
    }
    const merged = [...byAt.values()]
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
      .slice(-MAX_TRACK)
    persistTrack(merged)
  } catch {
    /* signed out / offline */
  }
}

export function currentFix() {
  return last
}

export function currentTrack() {
  return track
}

export function subscribeFix(fn: (fix: BoatFix) => void) {
  listeners.add(fn)
  start()
  fn(last)
  return () => {
    listeners.delete(fn)
  }
}

export function subscribeTrack(fn: (pts: TrackPoint[]) => void) {
  trackListeners.add(fn)
  start()
  fn(track)
  return () => {
    trackListeners.delete(fn)
  }
}

export function useBoatFix() {
  const [fix, setFix] = useState<BoatFix>(last)
  useEffect(() => {
    listeners.add(setFix)
    start()
    return () => {
      listeners.delete(setFix)
    }
  }, [])
  return fix
}

export function useBoatTrack() {
  const [pts, setPts] = useState<TrackPoint[]>(track)
  useEffect(() => subscribeTrack(setPts), [])
  return pts
}

export const useDeviceFix = useBoatFix
