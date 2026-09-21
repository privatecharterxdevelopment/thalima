import { useNavigate } from 'react-router-dom'
import { WindField } from './WindField'
import { useBoatFix } from '../lib/ais'
import { useStore } from '../store'
import { cardinal, formatLatLon } from '../lib/format'
import { passageCall } from '../lib/sailWeather'

export function WeatherWidget() {
  const nav = useNavigate()
  const fix = useBoatFix()
  const { weather } = useStore()
  const swell = weather?.swellM ?? weather?.waveM ?? null
  const call = weather ? passageCall(weather.windKn, weather.gustKn, swell) : null

  return (
    <button className="glass-card home-wx home-wx-live" onClick={() => nav('/weather')} type="button">
      <WindField fix={fix} compact />
      <div className="wx-live-bar">
        <span>Wind</span>
        <b>
          {fix.city}
          <i>{formatLatLon(fix.lat, fix.lon)}</i>
        </b>
        <em className="on">AIS</em>
      </div>
      <div className={`wx-go is-${call?.key ?? 'wait'}`}>
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
    </button>
  )
}
