import type { PlanningDay, Settings, Period } from '@/types'
import seedDays from '@/data/planning_seed.json'

/** Standardsatser – som øverst i Excel-fanen "Planlægning". */
export const DEFAULT_SETTINGS: Settings = {
  bus_price: 3000,
  ticket_price: 65,
}

/** Standardperioder – som kolonnerne i Excel-fanen "Afregning". */
export const DEFAULT_PERIODS: Period[] = [
  {
    id: 'kalender-2026',
    name: 'Periode 1 2026',
    start_date: '2026-08-01',
    end_date: '2026-12-31',
    hd_running_transferred: 0,
    ee_running_transferred: 0,
  },
  {
    id: 'kalender-2027',
    name: 'Periode 2 2027',
    start_date: '2027-01-01',
    end_date: '2027-07-31',
    hd_running_transferred: 0,
    ee_running_transferred: 0,
  },
  {
    id: 'skolear-2026-2027',
    name: 'Skoleår 2026/2027',
    start_date: '2026-08-01',
    end_date: '2027-07-31',
    hd_running_transferred: 0,
    ee_running_transferred: 0,
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
