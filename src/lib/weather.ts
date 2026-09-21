import type { WeatherHour, WeatherNow } from '../types'

export async function fetchWeather(lat: number, lon: number): Promise<WeatherNow> {
  const wx = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,cloud_cover&hourly=wind_speed_10m,wind_gusts_10m&forecast_days=2&wind_speed_unit=kn&timezone=auto`
  const marine = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period,sea_surface_temperature,swell_wave_height,swell_wave_period&hourly=wave_height&forecast_days=2&timezone=auto`

  const [wRes, mRes] = await Promise.all([fetch(wx), fetch(marine)])
  const w = (await wRes.json()) as {
    current: {
      temperature_2m: number
      wind_speed_10m: number
      wind_direction_10m: number
      wind_gusts_10m: number
      pressure_msl: number
      cloud_cover: number
    }
    hourly?: {
      time: string[]
      wind_speed_10m: number[]
      wind_gusts_10m: number[]
    }
  }

  let waveM: number | null = null
  let waveDir: number | null = null
  let wavePeriod: number | null = null
  let swellM: number | null = null
  let swellPeriod: number | null = null
  let sst: number | null = null
  let marineHourly: { time: string[]; wave_height: number[] } | undefined

  if (mRes.ok) {
    const m = (await mRes.json()) as {
      current?: {
        wave_height?: number
        wave_direction?: number
        wave_period?: number
        sea_surface_temperature?: number
        swell_wave_height?: number
        swell_wave_period?: number
      }
      hourly?: { time: string[]; wave_height: number[] }
    }
    waveM = m.current?.wave_height ?? null
    waveDir = m.current?.wave_direction ?? null
    wavePeriod = m.current?.wave_period ?? null
    swellM = m.current?.swell_wave_height ?? null
    swellPeriod = m.current?.swell_wave_period ?? null
    sst = m.current?.sea_surface_temperature ?? null
    marineHourly = m.hourly
  }

  return {
    tempC: w.current.temperature_2m,
    windKn: w.current.wind_speed_10m,
    gustKn: w.current.wind_gusts_10m,
    windDir: w.current.wind_direction_10m,
    pressure: w.current.pressure_msl,
    cloud: w.current.cloud_cover,
    waveM,
    waveDir,
    wavePeriod,
    swellM,
    swellPeriod,
    sst,
    hourly: zipHourly(w.hourly, marineHourly),
    fetchedAt: new Date().toISOString(),
  }
}

function zipHourly(
  wind?: { time: string[]; wind_speed_10m: number[]; wind_gusts_10m: number[] },
  waves?: { time: string[]; wave_height: number[] },
): WeatherHour[] {
  if (!wind?.time?.length) return []
  const now = Date.now() - 30 * 60_000
  const waveByTime = new Map((waves?.time ?? []).map((t, i) => [t, waves!.wave_height[i] ?? null]))
  const rows: WeatherHour[] = []
  for (let i = 0; i < wind.time.length; i++) {
    const at = wind.time[i]
    if (new Date(at).getTime() < now) continue
    rows.push({
      at,
      windKn: wind.wind_speed_10m[i] ?? 0,
      gustKn: wind.wind_gusts_10m[i] ?? 0,
      waveM: waveByTime.get(at) ?? null,
    })
    if (rows.length >= 12) break
  }
  return rows
}
