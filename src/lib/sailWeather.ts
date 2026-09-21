export function windTone(kn: number) {
  if (kn < 7) return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.14)', label: 'Light', key: 'light' }
  if (kn < 16) return { color: '#eab308', bg: 'rgba(234, 179, 8, 0.16)', label: 'Moderate', key: 'mod' }
  if (kn < 22) return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.16)', label: 'Fresh', key: 'fresh' }
  if (kn < 28) return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.16)', label: 'Strong', key: 'strong' }
  return { color: '#991b1b', bg: 'rgba(153, 27, 27, 0.22)', label: 'Gale', key: 'gale' }
}

export function passageCall(windKn: number, gustKn: number, swellM: number | null) {
  const swell = swellM
  if (windKn >= 28 || gustKn >= 34 || (swell != null && swell >= 2.5)) {
    return { key: 'nogo' as const, label: 'No-go' }
  }
  if (windKn >= 16 || gustKn >= 22 || (swell != null && swell >= 1.2)) {
    return { key: 'watch' as const, label: 'Watch' }
  }
  return { key: 'go' as const, label: 'Good to go' }
}
