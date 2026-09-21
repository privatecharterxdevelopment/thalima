import { windyUrl } from '../lib/windy'
import type { BoatFix } from '../lib/ais'

export function WindField({ fix, compact }: { fix: BoatFix; compact?: boolean }) {
  return (
    <iframe
      key={`${fix.lat.toFixed(3)}:${fix.lon.toFixed(3)}`}
      className={compact ? 'wx-frame is-mini' : 'wx-frame'}
      title="Live wind at boat"
      src={windyUrl(fix, compact)}
      allow="fullscreen"
      loading={compact ? 'lazy' : 'eager'}
    />
  )
}

export function WindScale() {
  const stops = ['10', '15', '20', '25', '30', '35', '40', '45', '50']
  return (
    <div className="wx-scale" aria-hidden="true">
      <i />
      <div>
        {stops.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  )
}
