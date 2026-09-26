import type {
  Certificate,
  Defect,
  DirectoryContact,
  Drill,
  Equipment,
  Handover,
  LeaveRow,
  OpsState,
  ProvisionItem,
  PurchaseRequest,
  ServiceLog,
  SparePart,
  Trip,
} from '../types'

export const vesselFile = {
  registry: 'United Kingdom',
  port: 'London',
  insurance: 'Pantaenius · hull & P&I',
  classSociety: 'RINA C HULL MACH, Ych',
  mca: 'MCA LY2 Short Range',
  nextPort: 'Barcelona',
  toys: [
    'Williams Sportjet 435, 130 hp',
    'Wingfoil board',
    'Waterskis / wakeboard / monoski',
    '2 paddle boards',
    'Kayak',
    'Tow ring, snorkel, fishing, beach games',
  ],
  tanks: {
    fuelL: 5600,
    waterL: 3000,
    blackL: 800,
    greyL: 1200,
  },
}

/** Live board — equipment & service logs are created in-app. */
export const equipmentSeed: Equipment[] = []
export const servicesSeed: ServiceLog[] = []
export const defectsSeed: Defect[] = []
export const sparesSeed: SparePart[] = []
export const certificatesSeed: Certificate[] = []
export const leaveSeed: LeaveRow[] = []
export const handoversSeed: Handover[] = []
export const provisionsSeed: ProvisionItem[] = []
export const purchasesSeed: PurchaseRequest[] = []
export const contactsSeed: DirectoryContact[] = []
export const drillsSeed: Drill[] = []
export const tripsSeed: Trip[] = []

export function opsSeed(): OpsState {
  return {
    equipment: equipmentSeed.map((e) => ({ ...e })),
    services: servicesSeed.map((s) => ({ ...s })),
    defects: defectsSeed.map((d) => ({ ...d })),
    spares: sparesSeed.map((s) => ({ ...s })),
    certificates: certificatesSeed.map((c) => ({ ...c })),
    leave: leaveSeed.map((l) => ({ ...l })),
    handovers: handoversSeed.map((h) => ({ ...h })),
    provisions: provisionsSeed.map((p) => ({ ...p })),
    purchases: purchasesSeed.map((p) => ({ ...p })),
    contacts: contactsSeed.map((c) => ({ ...c })),
    drills: drillsSeed.map((d) => ({ ...d })),
    trips: tripsSeed.map((t) => ({ ...t })),
  }
}
