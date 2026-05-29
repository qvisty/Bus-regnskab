import { describe, it, expect } from 'vitest'
import { aggregate, forecast } from './stats'
import type { PlanningDay, Settings } from '@/types'

const settings: Settings = { bus_price: 3000, ticket_price: 65 }

function day(over: Partial<PlanningDay>): PlanningDay {
  return {
    date: '2026-09-05',
    he_need: false,
    hd_need: false,
    ee_need: false,
    he_tickets: 0,
    hd_tickets: 0,
    ee_tickets: 0,
    note: '',
    hd_transferred_date: null,
    ee_transferred_date: null,
    ...over,
  }
}

describe('aggregate – gruppering pr. måned', () => {
  const days: PlanningDay[] = [
    day({ date: '2026-09-05', hd_need: true, ee_need: true, hd_tickets: 10 }),
    day({ date: '2026-09-12', hd_need: true, ee_need: true }),
    day({ date: '2026-10-03', hd_need: true, ee_need: true, ee_tickets: 20 }),
    // ikke fælles – skal udelades
    day({ date: '2026-09-06', ee_need: true, ee_tickets: 5 }),
  ]

  it('summerer fælles kørsler pr. måned og udelader enkelt-skole dage', () => {
    const b = aggregate(days, settings, 'month')
    expect(b).toHaveLength(2)
    expect(b[0].key).toBe('2026-09')
    expect(b[0].expenses).toBe(6000)
    expect(b[0].income).toBe(650)
    expect(b[0].tickets).toBe(10)
    expect(b[0].sharedDays).toBe(2)
    expect(b[1].key).toBe('2026-10')
    expect(b[1].income).toBe(1300)
    expect(b[1].sharedDays).toBe(1)
  })
})

describe('forecast – billetpris-anbefaling', () => {
  // 4 fremtidige fælles kørsler; 2 har indtastet 30 billetter -> snit 30/kørsel.
  const days: PlanningDay[] = [
    day({ date: '2026-09-05', hd_need: true, ee_need: true, hd_tickets: 30 }),
    day({ date: '2026-09-12', hd_need: true, ee_need: true, hd_tickets: 30 }),
    day({ date: '2026-09-19', hd_need: true, ee_need: true }),
    day({ date: '2026-09-26', hd_need: true, ee_need: true }),
  ]
  const today = '2026-05-29' // før sæsonen

  it('beregner sæsonprognose med underskud', () => {
    const f = forecast(days, settings, today)
    expect(f.totalSharedDays).toBe(4)
    expect(f.remainingSharedDays).toBe(4)
    expect(f.avgTicketsPerRide).toBe(30)
    expect(f.projectedTickets).toBe(120)
    expect(f.projectedExpenses).toBe(12000)
    expect(f.projectedIncome).toBe(7800)
    expect(f.projectedResult).toBe(4200)
    expect(f.deficit).toBe(true)
  })

  it('anbefaler en billetpris der får sæsonen til at gå i nul', () => {
    const f = forecast(days, settings, today)
    // 12000 udgift / 120 billetter = 100 kr.
    expect(f.recommendedPrice).toBe(100)
  })

  it('anbefaler ingen prisstigning når prognosen går i plus', () => {
    const f = forecast(days, { bus_price: 3000, ticket_price: 120 }, today)
    expect(f.deficit).toBe(false)
    expect(f.recommendedPrice).toBeNull()
  })

  it('uden indtastede billetter er der intet datagrundlag', () => {
    const noTickets = days.map((d) => ({
      ...d,
      hd_tickets: 0,
      ee_tickets: 0,
      he_tickets: 0,
    }))
    const f = forecast(noTickets, settings, today)
    expect(f.hasBasis).toBe(false)
    expect(f.recommendedPrice).toBeNull()
  })
})
