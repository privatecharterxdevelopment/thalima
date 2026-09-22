import type { Map } from 'mapbox-gl'

type Theme = 'light' | 'dark'

const palette = {
  light: {
    land: '#eef0f4',
    green: '#e6ebe7',
    water: '#d3dce8',
    road: '#ffffff',
    label: '#6b7280',
    halo: '#eef0f4',
    waterLabel: '#8193ab',
    sky: '#eef0f5',
  },
  dark: {
    land: '#1b2533',
    green: '#1a2830',
    water: '#0f1823',
    road: '#2a3748',
    label: '#8b95a3',
    halo: '#16202c',
    waterLabel: '#50667f',
    sky: '#121a24',
  },
} as const

const hiddenSymbols = new Set(['transportation_name', 'transportation', 'aerodrome_label', 'waterway', 'poi', 'housenumber', 'mountain_peak'])

export function mapStyle(theme: Theme) {
  return theme === 'dark'
    ? 'https://tiles.openfreemap.org/styles/dark'
    : 'https://tiles.openfreemap.org/styles/positron'
}

export function applyMapTheme(map: Map, theme: Theme) {
  map.setStyle(mapStyle(theme), { diff: false })
}

function hide(map: Map, id: string) {
  map.setLayoutProperty(id, 'visibility', 'none')
}

function paint(map: Map, id: string, prop: string, value: unknown) {
  try {
    map.setPaintProperty(id, prop as never, value as never)
  } catch {
    /* layer without this property */
  }
}

function tint(map: Map, theme: Theme) {
  const c = palette[theme]
  for (const layer of map.getStyle()?.layers ?? []) {
    const { id, type } = layer
    const src = 'source-layer' in layer ? layer['source-layer'] : undefined
    try {
      if (type === 'background') {
        paint(map, id, 'background-color', c.land)
      } else if (type === 'fill-extrusion' || type === 'hillshade') {
        hide(map, id)
      } else if (type === 'fill') {
        if (src === 'water') {
          paint(map, id, 'fill-color', c.water)
          paint(map, id, 'fill-opacity', 1)
        } else if (src === 'building' || src === 'aeroway' || src === 'transportation') {
          hide(map, id)
        } else if (src === 'park' || id.includes('wood') || id.includes('park')) {
          paint(map, id, 'fill-pattern', undefined)
          paint(map, id, 'fill-color', c.green)
          paint(map, id, 'fill-opacity', 1)
        } else {
          paint(map, id, 'fill-color', c.land)
        }
      } else if (type === 'line') {
        if (src === 'waterway') {
          paint(map, id, 'line-color', c.water)
        } else if (src === 'transportation' && !id.includes('casing') && !id.startsWith('railway')) {
          paint(map, id, 'line-color', c.road)
          paint(map, id, 'line-opacity', id.includes('major') || id.includes('motorway') ? 0.95 : 0.55)
        } else {
          hide(map, id)
        }
      } else if (type === 'symbol') {
        if (src && hiddenSymbols.has(src)) {
          hide(map, id)
        } else if (src === 'water_name') {
          paint(map, id, 'text-color', c.waterLabel)
          paint(map, id, 'text-halo-color', c.water)
        } else if (src === 'place') {
          paint(map, id, 'text-color', c.label)
          paint(map, id, 'text-halo-color', c.halo)
          paint(map, id, 'text-halo-width', 1.2)
        }
      }
    } catch {
      /* keep the stock look for this layer */
    }
  }
  try {
    map.setFog({
      color: c.sky,
      'high-color': c.sky,
      'space-color': c.sky,
      'horizon-blend': 0.12,
      'star-intensity': 0,
    })
  } catch {
    /* fog is optional */
  }
}

export function dressMap(map: Map, theme: Theme) {
  tint(map, theme)
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
