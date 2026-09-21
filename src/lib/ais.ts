import { useEffect, useState } from 'react'
import { position } from '../data/yacht'
import { haversineNm } from './geo'
import { reverseGeocode } from './geocode'

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
}

/** @deprecated AIS boat fix — kept so older imports compile */
export type DeviceFix = BoatFix

const KEY = 'thalima.fix.v3'
const AIS_URL = '/api/ais'

const fallback: BoatFix = {
  lat: position.lat,
  lon: position.lon,
  accM: null,
  sogKn: position.sog,
  cog: position.cog,
  city: position.place,
  region: position.region,
  country: 'Italy',
  status: position.status,
  source: 'ais',
}

let last: BoatFix = readCache() ?? fallback
const listeners = new Set<(fix: BoatFix) => void>()
let started = false

function readCache(): BoatFix | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as BoatFix
    if (parsed.source !== 'ais') return null
    if (typeof parsed.lat !== 'number' || typeof parsed.lon !== 'number') return null
    return { ...fallback, ...parsed, source: 'ais' }
  } catch {
    return null
  }
}

function emit(fix: BoatFix) {
  last = fix
  try {
    sessionStorage.setItem(KEY, JSON.stringify(fix))
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn(fix))
}

export function parseAisHtml(html: string): { lat: number; lon: number; sogKn: number; cog: number | null } | null {
  const coord =
    html.match(/coordinates\s*<strong>\s*(-?\d+(?:\.\d+)?)\s*(?:°|&deg;)?\s*\/\s*(-?\d+(?:\.\d+)?)/i) ||
    html.match(/canvas_map_generate\(\s*"[^"]+"\s*,\s*[\d.]+\s*,\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/)
  if (!coord) return null
  const lat = Number(coord[1])
  const lon = Number(coord[2])
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

  const sogMatch = html.match(/current speed is\s*<strong>\s*([\d.]+)\s*Knots/i)
  const canvas = html.match(
    /canvas_map_generate\(\s*"[^"]+"\s*,\s*[\d.]+\s*,\s*-?\d+\.\d+\s*,\s*-?\d+\.\d+\s*,\s*([\d.]+)\s*,\s*([\d.]+)/,
  )
  const heading = canvas ? Number(canvas[1]) : NaN
  const canvasSog = canvas ? Number(canvas[2]) : NaN
  const sogKn = sogMatch ? Number(sogMatch[1]) : Number.isFinite(canvasSog) ? canvasSog : 0
  const cog = Number.isFinite(heading) && heading < 360 ? heading : null
  return { lat, lon, sogKn: Number.isFinite(sogKn) ? sogKn : 0, cog }
}

async function placeFor(lat: number, lon: number) {
  if (haversineNm({ lat, lon }, { lat: position.lat, lon: position.lon }) < 1.2) {
    return { city: position.place, region: position.region, country: 'Italy' }
  }
  try {
    return await reverseGeocode(lat, lon)
  } catch {
    return { city: position.place, region: position.region, country: 'Italy' }
  }
}

export async function fetchAisFix(): Promise<BoatFix> {
  const res = await fetch(AIS_URL, { cache: 'no-store' })
  if (!res.ok) throw new Error('ais')
  const html = await res.text()
  const parsed = parseAisHtml(html)
  if (!parsed) throw new Error('ais-parse')
  const place = await placeFor(parsed.lat, parsed.lon)
  const sog = parsed.sogKn
  return {
    lat: parsed.lat,
    lon: parsed.lon,
    accM: null,
    sogKn: sog,
    cog: parsed.cog ?? last.cog ?? position.cog,
    city: place.city,
    region: place.region,
    country: place.country,
    status: sog > 0.4 ? 'Under way' : position.status,
    source: 'ais',
  }
}

function start() {
  if (started) return
  started = true
  emit(last.source === 'ais' ? last : fallback)
  const pull = () => {
    fetchAisFix()
      .then(emit)
      .catch(() => {
        if (last.source !== 'ais') emit(fallback)
      })
  }
  pull()
  window.setInterval(pull, 60_000)
}

export function currentFix() {
  return last
}

export function subscribeFix(fn: (fix: BoatFix) => void) {
  listeners.add(fn)
  start()
  fn(last)
  return () => {
    listeners.delete(fn)
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

export const useDeviceFix = useBoatFix
