const WEEKDAYS = [
  'Søndag',
  'Mandag',
  'Tirsdag',
  'Onsdag',
  'Torsdag',
  'Fredag',
  'Lørdag',
]

const WEEKDAYS_SHORT = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør']

const MONTHS = [
  'januar',
  'februar',
  'marts',
  'april',
  'maj',
  'juni',
  'juli',
  'august',
  'september',
  'oktober',
  'november',
  'december',
]

/** Parser en ISO-dato ("2026-08-09") til en Date i lokal tid uden tidszoneskred. */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function weekday(iso: string): string {
  return WEEKDAYS[parseISO(iso).getDay()]
}

export function weekdayShort(iso: string): string {
  return WEEKDAYS_SHORT[parseISO(iso).getDay()]
}

export function isWeekend(iso: string): boolean {
  const d = parseISO(iso).getDay()
  return d === 0 || d === 6
}

export function monthName(month: number): string {
  return MONTHS[month - 1] ?? ''
}

/** ISO 8601 ugenummer – svarer til ISOWEEKNUM i Excel. */
export function isoWeek(iso: string): number {
  const date = parseISO(iso)
  const target = new Date(date.getTime())
  const dayNr = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.getTime()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7))
  }
  return 1 + Math.ceil((firstThursday - target.getTime()) / 604800000)
}

const kr = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
  maximumFractionDigits: 2,
})

const krWhole = new Intl.NumberFormat('da-DK', {
  style: 'currency',
  currency: 'DKK',
  maximumFractionDigits: 0,
})

export function money(n: number): string {
  return Number.isInteger(n) ? krWhole.format(n) : kr.format(n)
}

export function dateLabel(iso: string): string {
  const d = parseISO(iso)
  return `${d.getDate()}. ${monthName(d.getMonth() + 1)} ${d.getFullYear()}`
}

export function dateShort(iso: string): string {
  const d = parseISO(iso)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}
