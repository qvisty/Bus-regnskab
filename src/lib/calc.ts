import type { PlanningDay, Settings, Period } from '@/types'

/**
 * Beregnede værdier for en planlægningsdag.
 * Spejler formlerne i Excel-fanen "Planlægning".
 */
export interface DayCalc {
  /** Antal skoler der har behov denne dag. */
  needCount: number
  /** "Fælles kørsel" = sandt hvis mere end én skole har behov. */
  shared: boolean
  /** "Bus-model" – "Stor" ved fælles kørsel, ellers tom. */
  busModel: string
  /** "Busudgift" – buspris ved fælles kørsel, ellers 0. */
  busExpense: number
  /** "Antal billetter" – sum af de tre skolers billetter. */
  ticketCount: number
  /** "Indtægt" – billetter gange billetpris. */
  income: number
  /** "Overskud" – indtægt minus busudgift. */
  profit: number
  /** "HD Overført kontrol" – sandt hvis HD mangler at overføre. */
  hdMissing: boolean
  /** "EE Overført kontrol" – sandt hvis EE mangler at overføre. */
  eeMissing: boolean
}

export function calcDay(day: PlanningDay, settings: Settings): DayCalc {
  const needCount =
    (day.he_need ? 1 : 0) + (day.hd_need ? 1 : 0) + (day.ee_need ? 1 : 0)
  const shared = needCount > 1
  const busModel = shared ? 'Stor' : ''
  const busExpense = shared ? settings.bus_price : 0
  // Billetter, indtægt og udgift tæller kun på dage med fælles kørsel.
  // Er det ikke en fælles dag, deles der intet mellem skolerne.
  const ticketCount = shared
    ? (day.he_tickets || 0) + (day.hd_tickets || 0) + (day.ee_tickets || 0)
    : 0
  const income = shared ? ticketCount * settings.ticket_price : 0
  const profit = income - busExpense
  const hdMissing =
    shared && (day.hd_tickets || 0) > 0 && !day.hd_transferred_date
  const eeMissing =
    shared && (day.ee_tickets || 0) > 0 && !day.ee_transferred_date
  return {
    needCount,
    shared,
    busModel,
    busExpense,
    ticketCount,
    income,
    profit,
    hdMissing,
    eeMissing,
  }
}

/** Resultat af en afregningsperiode – spejler fanen "Afregning". */
export interface PeriodResult {
  expenses: number
  income: number
  /** Samlet pris = udgifter − indtægter. Negativ = overskud. */
  total: number
  /** Pris pr. skole = samlet pris delt med 3. */
  perSchool: number
  /** HD afregner til HE ved periodeslut = pris pr. skole − løbende overført. */
  hdSettles: number
  /** EE afregner til HE ved periodeslut = pris pr. skole − løbende overført. */
  eeSettles: number
  /** HE bærer sin egen andel. */
  heBears: number
  daysInPeriod: number
  sharedDays: number
}

function inRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function calcPeriod(
  period: Period,
  days: PlanningDay[],
  settings: Settings,
): PeriodResult {
  let expenses = 0
  let income = 0
  let daysInPeriod = 0
  let sharedDays = 0
  for (const day of days) {
    if (!inRange(day.date, period.start_date, period.end_date)) continue
    daysInPeriod++
    const c = calcDay(day, settings)
    expenses += c.busExpense
    income += c.income
    if (c.shared) sharedDays++
  }
  const total = expenses - income
  const perSchool = round2(total / 3)
  return {
    expenses,
    income,
    total,
    perSchool,
    hdSettles: round2(perSchool - period.hd_running_transferred),
    eeSettles: round2(perSchool - period.ee_running_transferred),
    heBears: perSchool,
    daysInPeriod,
    sharedDays,
  }
}

/** Totaler for en liste af dage – spejler total-rækken i "Planlægning". */
export function calcTotals(days: PlanningDay[], settings: Settings) {
  let busExpense = 0
  let income = 0
  let ticketCount = 0
  let heTickets = 0
  let hdTickets = 0
  let eeTickets = 0
  let sharedDays = 0
  let heNeed = 0
  let hdNeed = 0
  let eeNeed = 0
  let hdMissing = 0
  let eeMissing = 0
  for (const day of days) {
    const c = calcDay(day, settings)
    busExpense += c.busExpense
    income += c.income
    ticketCount += c.ticketCount
    // Billetter tæller kun på fælles dage (samme regel som indtægt).
    if (c.shared) {
      heTickets += day.he_tickets || 0
      hdTickets += day.hd_tickets || 0
      eeTickets += day.ee_tickets || 0
    }
    if (c.shared) sharedDays++
    if (day.he_need) heNeed++
    if (day.hd_need) hdNeed++
    if (day.ee_need) eeNeed++
    if (c.hdMissing) hdMissing++
    if (c.eeMissing) eeMissing++
  }
  return {
    busExpense,
    income,
    profit: income - busExpense,
    ticketCount,
    heTickets,
    hdTickets,
    eeTickets,
    sharedDays,
    heNeed,
    hdNeed,
    eeNeed,
    hdMissing,
    eeMissing,
  }
}
