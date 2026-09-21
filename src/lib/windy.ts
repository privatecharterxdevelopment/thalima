import type { BoatFix } from './ais'

export function windyUrl(fix: BoatFix, compact = false) {
  const lat = fix.lat.toFixed(5)
  const lon = fix.lon.toFixed(5)
  const p = new URLSearchParams({
    type: 'map',
    location: 'coordinates',
    metricWind: 'kt',
    metricTemp: '°C',
    metricRain: 'mm',
    overlay: 'wind',
    product: 'ecmwf',
    level: 'surface',
    lat,
    lon,
    detailLat: lat,
    detailLon: lon,
    zoom: compact ? '8' : '7',
    pressure: 'true',
    marker: 'true',
    calendar: 'now',
    detail: 'false',
    message: 'false',
  })
  return `https://embed.windy.com/embed.html?${p.toString()}`
}
