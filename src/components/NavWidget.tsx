import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import mapboxgl from '../lib/mapbox'
import { Expand, Minimize2 } from 'lucide-react'
import { position, yacht } from '../data/yacht'
import { useStore } from '../store'
import { useUi } from '../ui'
import { canPlotRoute } from '../lib/permissions'
import { useBoatFix } from '../lib/ais'
import { bearingDeg, describePassage, haversineNm, rhumbLine, type Place } from '../lib/geo'
import { formatLatLon } from '../lib/format'
import { applyMapTheme, dressMap, mapStyle } from '../lib/mapStyle'

const KEY = 'thalima.route.v2'

type Saved = {
  from: Place
  to: Place | null
  active: boolean
  mode: '3d' | '2d'
}

function loadSaved(): Saved {
  const ais: Place = { name: `Thalima · ${position.place}`, lat: position.lat, lon: position.lon }
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Saved
      return { ...parsed, mode: '3d' }
    }
  } catch {
    /* ignore */
  }
  return { from: ais, to: null, active: false, mode: '3d' as const }
}

function boatEl() {
  const el = document.createElement('div')
  el.className = 'boat-mark'
  el.innerHTML =
    '<span class="boat-pulse" aria-hidden="true"></span><span class="boat-pulse" aria-hidden="true"></span><svg viewBox="0 0 24 42" width="26" height="44" aria-hidden="true"><path d="M12 1.5C14.2 8 19 16.5 19 27c0 7.2-4.4 12.2-7 13.5C9.4 39.2 5 34.2 5 27 5 16.5 9.8 8 12 1.5Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.2"/></svg>'
  return el
}

function destEl() {
  const el = document.createElement('div')
  el.className = 'dock-mark'
  return el
}

function emptyLine() {
  return { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: [] as [number, number][] } }
}

export function NavWidget({ variant = 'strip' }: { variant?: 'strip' | 'page' | 'window' }) {
  const { user, theme } = useStore()
  const fix = useBoatFix()
  const here: Place = useMemo(
    () => ({ name: `Thalima · ${fix.city}`, lat: fix.lat, lon: fix.lon }),
    [fix.city, fix.lat, fix.lon],
  )
  const hereRef = useRef(here)
  hereRef.current = here
  const themeRef = useRef(theme)
  themeRef.current = theme
  const { navFull, setNavFull } = useUi()
  const nav = useNavigate()
  const mapDiv = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const boatRef = useRef<mapboxgl.Marker | null>(null)
  const destRef = useRef<mapboxgl.Marker | null>(null)
  const followRef = useRef<{ lat: number; lon: number } | null>(null)
  const camSigRef = useRef('')
  const [saved, setSaved] = useState(loadSaved)
  const savedRef = useRef(saved)
  const [clock, setClock] = useState(() =>
    new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }),
  )
  const captain = user ? canPlotRoute(user) : false
  const windowed = variant === 'window'
  const full = navFull || variant === 'page'
  const camSig = `3d|${Number(saved.active)}|${saved.to?.name ?? ''}`

  useEffect(() => {
    const t = setInterval(() => {
      setClock(
        new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' }),
      )
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const legs = useMemo(() => {
    if (!saved.to) return null
    const nm = haversineNm(here, saved.to)
    const kn = (fix.sogKn ?? 0) > 0.4 ? fix.sogKn! : yacht.cruiseKn
    const pass = describePassage(nm, kn)
    const brg = bearingDeg(here, saved.to)
    const line = rhumbLine(here, saved.to)
    return { nm, kn, brg, line, pass }
  }, [saved.to, here, fix.sogKn])

  savedRef.current = saved

  useEffect(() => {
    sessionStorage.setItem(KEY, JSON.stringify(saved))
  }, [saved])

  useEffect(() => {
    if (!mapDiv.current || mapRef.current) return
    const start = hereRef.current
    const map = new mapboxgl.Map({
      container: mapDiv.current,
      style: mapStyle(theme),
      center: [start.lon, start.lat],
      zoom: windowed ? 12 : 12.4,
      pitch: windowed ? 46 : 48,
      bearing: 70,
      antialias: true,
      attributionControl: true,
      maxPitch: 85,
    })
    mapRef.current = map
    const attach = () => {
      if (!map.getSource('route')) {
        map.addSource('route', { type: 'geojson', data: emptyLine() })
        map.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#a78bfa', 'line-width': 18, 'line-opacity': 0.45, 'line-blur': 2 },
        })
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#e0e7ff', 'line-width': 5, 'line-opacity': 1 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        })
      }
      if (!boatRef.current) {
        boatRef.current = new mapboxgl.Marker({ element: boatEl(), rotationAlignment: 'map', pitchAlignment: 'viewport' })
          .setLngLat([start.lon, start.lat])
          .addTo(map)
      }
      if (!destRef.current) {
        destRef.current = new mapboxgl.Marker({ element: destEl() }).setLngLat([start.lon, start.lat])
      }
      dressMap(map, themeRef.current)
      draw(map)
      frame(map, true)
      const safeResize = () => {
        if (mapRef.current === map) map.resize()
      }
      window.setTimeout(safeResize, 60)
      window.setTimeout(safeResize, 400)
    }
    map.on('load', attach)
    map.on('style.load', attach)
    const ro = new ResizeObserver(() => map.resize())
    ro.observe(mapDiv.current)
    return () => {
      ro.disconnect()
      boatRef.current?.remove()
      destRef.current?.remove()
      map.remove()
      mapRef.current = null
      boatRef.current = null
      destRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (map) draw(map)
  }, [saved, legs, here])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const run = () => {
      if (!map.isStyleLoaded()) return
      const prev = followRef.current
      const movedM = prev ? haversineNm(prev, here) * 1852 : Infinity
      const sigChanged = camSig !== camSigRef.current
      if (prev && movedM < 30 && !sigChanged) return
      camSigRef.current = camSig
      followRef.current = { lat: here.lat, lon: here.lon }
      frame(map, !prev || movedM > 8_000)
    }
    run()
    map.on('load', run)
    return () => {
      map.off('load', run)
    }
  }, [here.lat, here.lon, camSig])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    applyMapTheme(map, theme)
  }, [theme])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const t = window.setTimeout(() => map.resize(), 80)
    return () => window.clearTimeout(t)
  }, [full, navFull])

  function draw(map: mapboxgl.Map) {
    if (!map.isStyleLoaded()) return
    const s = savedRef.current
    const origin = hereRef.current
    const dest = s.to
    const g = dest
      ? {
          line: rhumbLine(origin, dest),
          brg: bearingDeg(origin, dest),
        }
      : null
    const src = map.getSource('route') as mapboxgl.GeoJSONSource | undefined
    if (src) {
      src.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: s.active && g ? g.line : [],
        },
      })
    }
    const rot = s.active && g ? g.brg : (fix.cog ?? position.cog)
    boatRef.current?.setLngLat([origin.lon, origin.lat]).setRotation(rot)
    if (dest && destRef.current) {
      destRef.current.setLngLat([dest.lon, dest.lat]).addTo(map)
    } else {
      destRef.current?.remove()
    }
  }

  function frame(map: mapboxgl.Map, jump: boolean) {
    if (!map.isStyleLoaded()) return
    map.stop()
    const s = savedRef.current
    const origin = hereRef.current
    const dest = s.to
    const g = dest
      ? {
          line: rhumbLine(origin, dest),
          brg: bearingDeg(origin, dest),
        }
      : null
    const pitch = windowed ? 46 : 48
    const go = jump
      ? (opts: { center: [number, number]; zoom: number; pitch: number; bearing: number }) => map.jumpTo(opts)
      : (opts: { center: [number, number]; zoom: number; pitch: number; bearing: number }) =>
          map.easeTo({ ...opts, duration: 900 })
    if (s.active && g && dest) {
      go({
        center: [origin.lon, origin.lat],
        zoom: 12.4,
        pitch,
        bearing: g.brg,
      })
    } else {
      go({
        center: [origin.lon, origin.lat],
        zoom: windowed ? 12 : 12.6,
        pitch,
        bearing: 70,
      })
    }
  }

  function stop() {
    if (!captain) return
    setSaved((s) => ({ ...s, to: null, active: false }))
  }

  const eta = legs && saved.active ? legs.pass : null
  const sog = fix.sogKn ?? 0
  const locLabel = saved.active && saved.to ? saved.to.name : `${fix.city} · AIS`

  return (
    <section
      className={`nav-widget ${full ? 'full' : windowed ? 'window' : 'strip'} ${variant}`}
      onClick={windowed ? () => nav('/position') : undefined}
    >
      <div className="nav-map">
        <div ref={mapDiv} className="nav-map-el" />
        {full && (
          <div className="nav-hud" onClick={(e) => e.stopPropagation()}>
            <div className="hud-chip">
              <strong>{clock}</strong>
              <span>{sog.toFixed(1)} kn</span>
              {eta ? (
                <em>
                  ETA {eta.arrive} · {eta.label} · {eta.nm}
                </em>
              ) : (
                <em>{formatLatLon(here.lat, here.lon)}</em>
              )}
            </div>
            <span className="hud-ghost">{locLabel}</span>
            {captain && saved.active && (
              <button className="hud-pill" type="button" onClick={stop}>
                Clear
              </button>
            )}
          </div>
        )}
        {(windowed || navFull) && (
          <button
            className="nav-expand"
            onClick={(e) => {
              e.stopPropagation()
              setNavFull(!navFull)
            }}
            aria-label={navFull ? 'Exit fullscreen' : 'Fullscreen chart'}
          >
            {navFull ? <Minimize2 size={15} strokeWidth={1.75} /> : <Expand size={15} strokeWidth={1.75} />}
          </button>
        )}
      </div>
    </section>
  )
}
