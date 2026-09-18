import { position, yacht } from '../data/yacht'
import { beaufort, cardinal, formatLatLon } from '../lib/format'
import { MapCanvas } from '../components/MapCanvas'
import { WindRose } from '../components/WindRose'
import { useStore } from '../store'

export function Position() {
  const { weather } = useStore()
  const b = weather ? beaufort(weather.windKn) : null

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow">AIS · MMSI {yacht.mmsi}</p>
          <h1>Position</h1>
          <p>
            Last known from AIS in the Tyrrhenian Sea. Chart is Carto/OSM. Wind from Open-Meteo at the
            same fix.
          </p>
        </div>
      </div>

      <div className="two">
        <MapCanvas />
        <div className="side-stack">
          <section className="panel">
            <h2>Fix</h2>
            <ul className="facts" style={{ marginTop: 0 }}>
              <li>
                <span>Lat / lon</span>
                {formatLatLon(position.lat, position.lon)}
              </li>
              <li>
                <span>Place</span>
                {position.place}
              </li>
              <li>
                <span>Status</span>
                {position.status} · SOG {position.sog} kn
              </li>
              <li>
                <span>Last port</span>
                {position.lastPort} · 16 Sep 08:37Z
              </li>
              <li>
                <span>Call sign</span>
                {yacht.callsign} · IMO {yacht.imo}
              </li>
            </ul>
          </section>
          <section className="panel">
            <h2>Wind</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <WindRose weather={weather} />
              {weather && (
                <p style={{ color: 'var(--muted)', lineHeight: 1.65 }}>
                  {weather.windKn.toFixed(1)} kn from {cardinal(weather.windDir)} ({weather.windDir}°)
                  <br />
                  Gusts {weather.gustKn.toFixed(0)} kn
                  <br />
                  {b ? `Beaufort ${b.f} ${b.name}` : ''}
                </p>
              )}
            </div>
          </section>
          <section className="panel">
            <h2>Sea</h2>
            {weather ? (
              <p style={{ color: 'var(--muted)', lineHeight: 1.65 }}>
                Air {weather.tempC.toFixed(1)}°C
                {weather.sst != null ? ` · sea ${weather.sst.toFixed(1)}°C` : ''}
                <br />
                {weather.waveM != null
                  ? `Significant wave ${weather.waveM.toFixed(2)} m · period ${weather.wavePeriod?.toFixed(0)} s · ${cardinal(weather.waveDir ?? 0)}`
                  : 'Marine wave grid not in this cell — wind still live.'}
                <br />
                Pressure {weather.pressure.toFixed(0)} hPa · cloud {weather.cloud}%
              </p>
            ) : (
              <p style={{ color: 'var(--muted)' }}>Waiting for weather.</p>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
