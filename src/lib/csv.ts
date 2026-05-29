import type { PlanningDay, Settings } from '@/types'
import { calcDay } from '@/lib/calc'
import { weekday, isoWeek } from '@/lib/format'

function cell(v: string | number): string {
  const s = String(v)
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Eksportér planlægningen til CSV (semikolon-separeret, dansk Excel-venlig). */
export function planningToCsv(days: PlanningDay[], settings: Settings): string {
  const header = [
    'Dato',
    'Dag',
    'Uge',
    'HE behov',
    'HD behov',
    'EE behov',
    'Fælles kørsel',
    'HE billetter',
    'HD billetter',
    'EE billetter',
    'Busudgift',
    'Antal billetter',
    'Indtægt',
    'Overskud',
    'HD overført dato',
    'EE overført dato',
    'Bemærkning',
  ]
  const rows = [...days]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => {
      const c = calcDay(d, settings)
      return [
        d.date,
        weekday(d.date),
        isoWeek(d.date),
        d.he_need ? 'x' : '',
        d.hd_need ? 'x' : '',
        d.ee_need ? 'x' : '',
        c.shared ? 'Ja' : 'Nej',
        d.he_tickets || '',
        d.hd_tickets || '',
        d.ee_tickets || '',
        c.busExpense,
        c.ticketCount,
        c.income,
        c.profit,
        d.hd_transferred_date || '',
        d.ee_transferred_date || '',
        d.note || '',
      ]
        .map(cell)
        .join(';')
    })
  return [header.join(';'), ...rows].join('\r\n')
}

export function downloadCsv(filename: string, content: string) {
  // BOM så æøå vises rigtigt i Excel.
  const blob = new Blob(['﻿' + content], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
