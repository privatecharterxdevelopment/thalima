import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const runtime = mapboxgl as typeof mapboxgl & {
  config?: { REQUIRE_ACCESS_TOKEN: boolean }
}
if (runtime.config) runtime.config.REQUIRE_ACCESS_TOKEN = false

type AuthMap = mapboxgl.Map & { _authenticate?: () => void }
;(mapboxgl.Map.prototype as AuthMap)._authenticate = function () {}

export default mapboxgl
