import type { Map } from 'mapbox-gl'

export function mapStyle(theme: 'light' | 'dark') {
  return theme === 'dark'
    ? 'https://tiles.openfreemap.org/styles/dark'
    : 'https://tiles.openfreemap.org/styles/positron'
}

export function applyMapTheme(map: Map, theme: 'light' | 'dark') {
  map.setStyle(mapStyle(theme))
}

export function dressMap(map: Map) {
  try {
    if (!map.getSource('terrain')) {
      map.addSource('terrain', {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 15,
        encoding: 'terrarium',
      })
    }
    map.setTerrain({ source: 'terrain', exaggeration: 1.05 })
  } catch {
    /* style still paints without DEM */
  }
}
