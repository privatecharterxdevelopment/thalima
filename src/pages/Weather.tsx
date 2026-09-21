import { WindField } from '../components/WindField'
import { useBoatFix } from '../lib/ais'
import { useStore } from '../store'
import { cardinal, clock, formatLatLon } from '../lib/format'
import { passageCall } from '../lib/sailWeather'

export function Weather() {
  const fix = useBoatFix()
  const { weather } = useStore()
  const swell = weather?.swellM ?? weather?.waveM ?? null
  const call = weather ? passageCall(weather.windKn, weather.gustKn, swell) : null

  return (
    <div className="wx-full">
      <div className="wx-full-map">
        <WindField fix={fix} />
        <div className="wx-full-hud">
          <div className="wx-full-chip">
            <strong>{fix.city}</strong>
            <span>{formatLatLon(fix.lat, fix.lon)}</span>
            <em>AIS · live wind</em>
          </div>
          <div className={`wx-full-call is-${call?.key ?? 'wait'}`}>
            {weather && call ? (
              <>
                <strong>{call.label}</strong>
                <span>
                  {Math.round(weather.windKn)} kn {cardinal(weather.windDir)}
                  {swell != null ? ` · ${swell.toFixed(1)} m` : ''}
                  {` · ${Math.round(weather.tempC)}°`}
                </span>
              </>
            ) : (
              <span>Waiting on weather</span>
            )}
          </div>
        </div>
        {weather && weather.hourly.length > 0 && (
          <ol className="wx-hours">
            {weather.hourly.map((h, i) => (
              <li key={h.at} className={i === 0 ? 'is-now' : undefined}>
                <time>{clock(h.at)}</time>
                <b>{Math.round(h.windKn)}</b>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
