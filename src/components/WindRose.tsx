import { beaufort, cardinal } from '../lib/format'
import type { WeatherNow } from '../types'

export function WindRose({ weather }: { weather: WeatherNow | null }) {
  const dir = weather?.windDir ?? 202
  const kn = weather?.windKn ?? 2
  const b = beaufort(kn)
  return (
    <svg className="wind" viewBox="0 0 120 120" aria-label="Wind">
      <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" opacity="0.18" />
      <circle cx="60" cy="60" r="36" fill="none" stroke="currentColor" opacity="0.12" />
      <g opacity="0.45" fontSize="8" fontFamily="IBM Plex Mono, monospace" fill="currentColor" textAnchor="middle">
        <text x="60" y="16">N</text>
        <text x="108" y="64">E</text>
        <text x="60" y="114">S</text>
        <text x="12" y="64">W</text>
      </g>
      <g transform={`rotate(${dir} 60 60)`}>
        <polygon points="60,18 66,58 60,52 54,58" fill="currentColor" />
        <polygon points="60,102 66,62 60,68 54,62" fill="currentColor" opacity="0.35" />
      </g>
      <circle cx="60" cy="60" r="22" fill="var(--paper)" stroke="currentColor" opacity="0.3" />
      <text x="60" y="58" textAnchor="middle" fontSize="13" fontFamily="IBM Plex Mono, monospace" fill="currentColor">
        {kn.toFixed(0)}
      </text>
      <text x="60" y="72" textAnchor="middle" fontSize="8" fontFamily="IBM Plex Mono, monospace" fill="currentColor" opacity="0.7">
        kn {cardinal(dir)}
      </text>
      <text x="60" y="128" textAnchor="middle" fontSize="0">
        F{b.f} {b.name}
      </text>
    </svg>
  )
}
