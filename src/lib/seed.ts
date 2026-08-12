import type { PlanningDay, Settings, Period } from '@/types'
import seedDays from '@/data/planning_seed.json'

/** Standardsatser. Bustaksterne er faste og ligger i lib/buses.ts. */
export const DEFAULT_SETTINGS: Settings = {
  ticket_price: 75,
}

/**
 * Udfyld manglende satser med standardværdier og smid ukendte felter væk
 * (fx busprissatser fra tidligere versioner). Sikrer at satserne altid er
 * gyldige tal, så beregningerne aldrig kan give NaN.
 */
export function normalizeSettings(raw: Partial<Settings> | null): Settings {
  const ticket = Number(raw?.ticket_price)
  return {
    ticket_price: Number.isFinite(ticket)
      ? ticket
      : DEFAULT_SETTINGS.ticket_price,
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
