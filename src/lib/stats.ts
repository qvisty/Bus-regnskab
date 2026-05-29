import type { PlanningDay, Settings } from '@/types'
import { calcDay } from './calc'
import { parseISO, isoWeek, monthName } from './format'

export type Grouping = 'week' | 'month' | 'year'

/** Aggregerede tal for en tidsperiode (uge/måned/år). */
export interface Bucket {
  key: string
  label: string
  expenses: number
  income: number
  profit: number
  tickets: number
  sharedDays: number
}

function bucketOf(date: string, g: Grouping): { key: string; label: string } {
  const d = parseISO(date)
  const y = d.getFullYear()
  if (g === 'year') return { key: String(y), label: String(y) }
  if (g === 'month') {
    const m = d.getMonth() + 1
    return {
      key: `${y}-${String(m).padStart(2, '0')}`,
      label: `${monthName(m).slice(0, 3)} ${y}`,
    }
  }
  // uge: brug ISO-uge, og ISO-årets uge kan høre til naboåret – men til
  // visning er kalenderåret tilstrækkeligt nøjagtigt her.
  const w = isoWeek(date)
  return {
    key: `${y}-W${String(w).padStart(2, '0')}`,
    label: `Uge ${w}`,
  }
}

/**
 * Grupperer fælles kørsler i tidsspande. Kun dage med fælles kørsel bidrager
 * (ikke-fælles dage har hverken udgift, indtægt eller billetter).
 */
export function aggregate(
  days: PlanningDay[],
  settings: Settings,
  grouping: Grouping,
): Bucket[] {
  const map = new Map<string, Bucket>()
  for (const day of days) {
    const c = calcDay(day, settings)
    if (!c.shared) continue
    const { key, label } = bucketOf(day.date, grouping)
    let b = map.get(key)
    if (!b) {
      b = {
        key,
        label,
        expenses: 0,
        income: 0,
        profit: 0,
        tickets: 0,
        sharedDays: 0,
      }
      map.set(key, b)
    }
    b.expenses += c.busExpense
    b.income += c.income
    b.profit += c.profit
    b.tickets += c.ticketCount
    b.sharedDays += 1
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key))
}

/** Billetpris-anbefaling og sæsonprognose regnet fra dags dato. */
export interface Forecast {
  today: string
  /** Antal fælles kørsler i hele sæsonen. */
  totalSharedDays: number
  /** Fælles kørsler til og med i dag. */
  realizedSharedDays: number
  /** Fælles kørsler efter i dag. */
  remainingSharedDays: number
  /** Gns. billetter pr. fælles kørsel, udledt af dage med indtastede billetter. */
  avgTicketsPerRide: number
  /** Forventet samlet billetsalg for sæsonen. */
  projectedTickets: number
  /** Forventet udgift for sæsonen (alle fælles kørsler). */
  projectedExpenses: number
  /** Forventet indtægt ved nuværende billetpris. */
  projectedIncome: number
  /** Forventet resultat = udgift − indtægt. Positiv = underskud. */
  projectedResult: number
  /** Er prognosen et underskud? */
  deficit: boolean
  /** Er der overhovedet datagrundlag (indtastede billetter) til at regne? */
  hasBasis: boolean
  /** Anbefalet billetpris for at gå i nul på sæsonen (afrundet op), ellers null. */
  recommendedPrice: number | null
}

export function forecast(
  days: PlanningDay[],
  settings: Settings,
  today: string,
): Forecast {
  let totalSharedDays = 0
  let realizedSharedDays = 0
  let remainingSharedDays = 0
  let enteredRides = 0
  let enteredTickets = 0
  let realizedTickets = 0

  for (const day of days) {
    const c = calcDay(day, settings)
    if (!c.shared) continue
    totalSharedDays++
    const past = day.date <= today
    if (past) {
      realizedSharedDays++
      realizedTickets += c.ticketCount
    } else {
      remainingSharedDays++
    }
    // Grundlag for gennemsnit: alle fælles dage hvor der er indtastet billetter.
    if (c.ticketCount > 0) {
      enteredRides++
      enteredTickets += c.ticketCount
    }
  }

  const hasBasis = enteredRides > 0
  const avgTicketsPerRide = hasBasis ? enteredTickets / enteredRides : 0
  const projectedTickets =
    realizedTickets + remainingSharedDays * avgTicketsPerRide
  const projectedExpenses = totalSharedDays * settings.bus_price
  const projectedIncome = projectedTickets * settings.ticket_price
  const projectedResult = projectedExpenses - projectedIncome
  const deficit = projectedResult > 0

  // Anbefalet pris regnet fra dags dato: allerede solgte billetter (realisedIncome)
  // ligger fast, så de resterende billetter skal dække restunderskuddet.
  const realizedIncome = realizedTickets * settings.ticket_price
  const remainingTickets = remainingSharedDays * avgTicketsPerRide
  let recommendedPrice: number | null = null
  if (hasBasis && deficit && remainingTickets > 0) {
    recommendedPrice = Math.ceil(
      (projectedExpenses - realizedIncome) / remainingTickets,
    )
  }

  return {
    today,
    totalSharedDays,
    realizedSharedDays,
    remainingSharedDays,
    avgTicketsPerRide,
    projectedTickets,
    projectedExpenses,
    projectedIncome,
    projectedResult,
    deficit,
    hasBasis,
    recommendedPrice,
  }
}
