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

/** AIS 18 Sep 2026, Golfo di Marinella, Sardinia */
export const position = {
  lat: 41.0315,
  lon: 9.52428,
  sog: 0.1,
  cog: 202,
  status: 'At anchor',
  place: 'Golfo di Marinella',
  region: 'Costa Smeralda, Sardinia',
  sea: 'Tyrrhenian Sea',
  lastPort: 'Olbia',
  lastPortAt: '2026-09-16T08:37:00Z',
}

export const nearby = [
  { name: 'Porto Rotondo', lat: 41.027, lon: 9.543, kind: 'marina' },
  { name: 'Olbia', lat: 40.923, lon: 9.503, kind: 'port' },
  { name: 'Golfo Aranci', lat: 40.995, lon: 9.615, kind: 'port' },
  { name: 'Porto Cervo', lat: 41.137, lon: 9.535, kind: 'marina' },
] as const

export const docks = [
  { name: 'Thalima · here', lat: position.lat, lon: position.lon },
  { name: 'Porto Rotondo', lat: 41.027, lon: 9.543 },
  { name: 'Porto Cervo marina', lat: 41.137, lon: 9.535 },
  { name: 'Marina di Portisco', lat: 41.036, lon: 9.526 },
  { name: 'Golfo Aranci', lat: 40.995, lon: 9.615 },
  { name: 'Olbia / Isola Bianca', lat: 40.923, lon: 9.503 },
  { name: 'Cala di Volpe', lat: 41.079, lon: 9.54 },
  { name: 'Bonifacio', lat: 41.387, lon: 9.159 },
  { name: 'Porto Vecchio', lat: 41.592, lon: 9.28 },
  { name: 'La Maddalena', lat: 41.214, lon: 9.408 },
] as const
