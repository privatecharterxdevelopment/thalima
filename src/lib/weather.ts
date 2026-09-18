import type { WeatherNow } from '../types'

export async function fetchWeather(lat: number, lon: number): Promise<WeatherNow> {
  const wx = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,cloud_cover&wind_speed_unit=kn&timezone=auto`
  const marine = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period,sea_surface_temperature`

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
  }

  let waveM: number | null = null
  let waveDir: number | null = null
  let wavePeriod: number | null = null
  let sst: number | null = null

  if (mRes.ok) {
    const m = (await mRes.json()) as {
      current?: {
        wave_height?: number
        wave_direction?: number
        wave_period?: number
        sea_surface_temperature?: number
      }
    }
    waveM = m.current?.wave_height ?? null
    waveDir = m.current?.wave_direction ?? null
    wavePeriod = m.current?.wave_period ?? null
    sst = m.current?.sea_surface_temperature ?? null
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
    sst,
    fetchedAt: new Date().toISOString(),
  }
}
