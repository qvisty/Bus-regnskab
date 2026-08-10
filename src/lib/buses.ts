import type { Settings } from '@/types'

export type BusKey = 'small' | 'large' | 'double'

/** En busstørrelse der kan bestilles. */
export interface BusType {
  key: BusKey
  name: string
  seats: number
  /** Kilometerpris – kun til information; afregningen bruger prisen pr. tur. */
  pricePerKm: number
}

/** Busstørrelserne, mindste først. Bussen vælges automatisk efter billettal. */
export const BUS_TYPES: BusType[] = [
  { key: 'small', name: 'Lille bus', seats: 19, pricePerKm: 10 },
  { key: 'large', name: 'Stor bus', seats: 57, pricePerKm: 18 },
  { key: 'double', name: 'Dobbeltdækker', seats: 83, pricePerKm: 20 },
]

/** Flest pladser i den største bus. */
export const MAX_SEATS = BUS_TYPES[BUS_TYPES.length - 1].seats

/** Pris pr. tur for en busstørrelse, fra satserne. */
export function busPrice(key: BusKey, settings: Settings): number {
  switch (key) {
    case 'small':
      return settings.bus_price_small
    case 'large':
      return settings.bus_price_large
    case 'double':
      return settings.bus_price_double
  }
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
