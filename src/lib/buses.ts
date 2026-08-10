export type BusKey = 'small' | 'large' | 'double'

/** En busstørrelse der kan bestilles. */
export interface BusType {
  key: BusKey
  name: string
  seats: number
  /** Kilometerpris – kun til information; afregningen bruger prisen pr. tur. */
  pricePerKm: number
  /** Fast aftalepris pr. tur. */
  pricePerTrip: number
}

/**
 * Busstørrelserne med faste aftalepriser, mindste først. Bussen vælges
 * automatisk efter billettal – taksterne tastes ikke i appen. Ændrer
 * vognmanden priserne, rettes de her.
 */
export const BUS_TYPES: BusType[] = [
  { key: 'small', name: 'Lille bus', seats: 19, pricePerKm: 10, pricePerTrip: 2430 },
  { key: 'large', name: 'Stor bus', seats: 57, pricePerKm: 18, pricePerTrip: 4375 },
  { key: 'double', name: 'Dobbeltdækker', seats: 83, pricePerKm: 20, pricePerTrip: 4866 },
]

/** Flest pladser i den største bus. */
export const MAX_SEATS = BUS_TYPES[BUS_TYPES.length - 1].seats

/** Pris pr. tur for en busstørrelse. */
export function busPrice(key: BusKey): number {
  const bus = BUS_TYPES.find((b) => b.key === key)!
  return bus.pricePerTrip
}

/**
 * Mindste bus der kan rumme antallet af billetter.
 * Overstiger billettallet den største bus, vælges den største alligevel
 * (og dagen markeres som overbooket i beregningen).
 */
export function selectBus(ticketCount: number): BusType {
  for (const b of BUS_TYPES) {
    if (ticketCount <= b.seats) return b
  }
  return BUS_TYPES[BUS_TYPES.length - 1]
}
