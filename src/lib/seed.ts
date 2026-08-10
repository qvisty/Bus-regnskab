import type { PlanningDay, Settings, Period } from '@/types'
import seedDays from '@/data/planning_seed.json'

/** Standardsatser – billetpris samt pris pr. tur for hver busstørrelse. */
export const DEFAULT_SETTINGS: Settings = {
  ticket_price: 65,
  bus_price_small: 2430,
  bus_price_large: 4375,
  bus_price_double: 4866,
}

/**
 * Udfyld manglende satser med standardværdier. Migrerer data gemt før
 * busstørrelserne blev indført (hvor der kun fandtes én samlet buspris).
 */
export function normalizeSettings(raw: Partial<Settings> | null): Settings {
  return {
    ticket_price: raw?.ticket_price ?? DEFAULT_SETTINGS.ticket_price,
    bus_price_small: raw?.bus_price_small ?? DEFAULT_SETTINGS.bus_price_small,
    bus_price_large: raw?.bus_price_large ?? DEFAULT_SETTINGS.bus_price_large,
    bus_price_double:
      raw?.bus_price_double ?? DEFAULT_SETTINGS.bus_price_double,
  }
}

/** Standardperioder – som kolonnerne i Excel-fanen "Afregning". */
export const DEFAULT_PERIODS: Period[] = [
  {
    id: 'kalender-2026',
    name: 'Periode 1 2026',
    start_date: '2026-08-01',
    end_date: '2026-12-31',
    settled_at: null,
  },
  {
    id: 'kalender-2027',
    name: 'Periode 2 2027',
    start_date: '2027-01-01',
    end_date: '2027-07-31',
    settled_at: null,
  },
  {
    id: 'skolear-2026-2027',
    name: 'Skoleår 2026/2027',
    start_date: '2026-08-01',
    end_date: '2027-07-31',
    settled_at: null,
  },
]

/** Planlægningsdage hentet direkte fra Excel-arket (9. aug 2026 – 4. jul 2027). */
export function defaultPlanningDays(): PlanningDay[] {
  return (seedDays as PlanningDay[]).map((d) => ({
    date: d.date,
    he_need: !!d.he_need,
    hd_need: !!d.hd_need,
    ee_need: !!d.ee_need,
    he_tickets: d.he_tickets || 0,
    hd_tickets: d.hd_tickets || 0,
    ee_tickets: d.ee_tickets || 0,
    note: d.note || '',
    hd_transferred_date: d.hd_transferred_date || null,
    ee_transferred_date: d.ee_transferred_date || null,
  }))
}
