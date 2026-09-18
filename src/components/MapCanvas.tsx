import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { nearby, position } from '../data/yacht'
import { useStore } from '../store'

const yachtSvg = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="20" fill="#1f4a5c" fill-opacity="0.18" stroke="#1f4a5c" stroke-width="1.2"/>
    <path d="M14 30h16M16 30 L22 10 L24.5 30" fill="none" stroke="#1f4a5c" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M22 14 L30 28" fill="none" stroke="#1f4a5c" stroke-width="1.5"/>
  </svg>`,
)

export function MapCanvas({ heightClass = 'map-full' }: { heightClass?: string }) {
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const { theme } = useStore()

  useEffect(() => {
    if (!el.current || mapRef.current) return

    const map = L.map(el.current, {
      zoomControl: false,
      attributionControl: true,
    }).setView([position.lat, position.lon], 12)

    L.control.zoom({ position: 'topright' }).addTo(map)

    const light = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    })
    const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    })

    const base = theme === 'dark' ? dark : light
    base.addTo(map)
    requestAnimationFrame(() => map.invalidateSize())

    const icon = L.icon({
      iconUrl: `data:image/svg+xml,${yachtSvg}`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    })

    L.marker([position.lat, position.lon], { icon })
      .addTo(map)
      .bindPopup(
        `<strong>Thalima</strong><br/>${position.status}<br/>${position.place}<br/>SOG ${position.sog} kn`,
      )

    L.circle([position.lat, position.lon], {
      radius: 180,
      color: '#1f4a5c',
      weight: 1,
      fillOpacity: 0.06,
    }).addTo(map)

    for (const n of nearby) {
      L.circleMarker([n.lat, n.lon], {
        radius: 4,
        color: '#9a6b3a',
        weight: 1,
        fillOpacity: 0.8,
      })
        .addTo(map)
        .bindTooltip(n.name)
    }

    mapRef.current = map
    ;(map as L.Map & { _light?: L.TileLayer; _dark?: L.TileLayer })._light = light
    ;(map as L.Map & { _dark?: L.TileLayer })._dark = dark

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current as
      | (L.Map & { _light?: L.TileLayer; _dark?: L.TileLayer })
      | null
    if (!map?._light || !map._dark) return
    if (theme === 'dark') {
      if (map.hasLayer(map._light)) map.removeLayer(map._light)
      if (!map.hasLayer(map._dark)) map._dark.addTo(map)
    } else {
      if (map.hasLayer(map._dark)) map.removeLayer(map._dark)
      if (!map.hasLayer(map._light)) map._light.addTo(map)
    }
  }, [theme])

  return <div ref={el} className={heightClass} />
}
