export const yacht = {
  name: 'Thalima',
  type: 'Southern Wind 110 RS',
  hull: 'SW 110 RS / 1',
  builder: 'Southern Wind Shipyard, Cape Town',
  year: 2010,
  refit: 2024,
  loaM: 33.65,
  beamM: 7.29,
  draftM: 4.2,
  gt: 114,
  flag: 'United Kingdom',
  mmsi: '235077622',
  callsign: '2DBT3',
  imo: '9590278',
  class: 'RINA · MCA LY2',
  naval: 'Farr Yacht Design',
  design: 'Nauta Design',
  engine: 'Cummins 405 hp',
  cruiseKn: 11,
  maxKn: 12,
  rangeNm: 2500,
  fuelL: 5600,
  waterL: 3000,
  guests: 8,
  cabins: 4,
  crew: 5,
  sailAreaM2: 529,
  tender: 'Williams Sportjet 435, 130 hp',
}

/** AIS 25 Sep 2026, Barcelona (live MagicPort / MST) */
export const position = {
  lat: 41.36491,
  lon: 2.1866,
  sog: 0,
  cog: 0,
  status: 'Making port at BARCELONA',
  place: 'Barcelona',
  region: 'Catalonia',
  country: 'Spain',
  sea: 'Balearic Sea',
  lastPort: 'Barcelona',
  lastPortAt: '2026-09-25T11:05:00Z',
}

export const nearby = [
  { name: 'Port Vell', lat: 41.375, lon: 2.178, kind: 'marina' },
  { name: 'Port Olímpic', lat: 41.387, lon: 2.2, kind: 'marina' },
  { name: 'Badalona', lat: 41.443, lon: 2.248, kind: 'port' },
  { name: 'Sitges', lat: 41.235, lon: 1.81, kind: 'marina' },
] as const

export const docks = [
  { name: 'Thalima · here', lat: position.lat, lon: position.lon },
  { name: 'Port Vell / MareMagnum', lat: 41.375, lon: 2.178 },
  { name: 'Port Olímpic', lat: 41.387, lon: 2.2 },
  { name: 'Marina Port Fòrum', lat: 41.412, lon: 2.228 },
  { name: 'Marina Badalona', lat: 41.443, lon: 2.248 },
  { name: 'Sitges', lat: 41.235, lon: 1.81 },
  { name: 'Palamós', lat: 41.845, lon: 3.129 },
  { name: 'Palma de Mallorca', lat: 39.566, lon: 2.64 },
] as const
