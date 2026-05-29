import { describe, it, expect } from 'vitest'
import { calcDay, calcPeriod, calcTotals } from './calc'
import type { PlanningDay, Settings, Period } from '@/types'

const settings: Settings = { bus_price: 3000, ticket_price: 65 }

function day(over: Partial<PlanningDay>): PlanningDay {
  return {
    date: '2026-08-09',
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

describe('calcDay – spejler Excel-formlerne', () => {
  it('én skole alene er ikke fælles kørsel og giver ingen busudgift', () => {
    const c = calcDay(day({ ee_need: true }), settings)
    expect(c.shared).toBe(false)
    expect(c.busModel).toBe('')
    expect(c.busExpense).toBe(0)
  })

  it('to skoler giver fælles kørsel, model "Stor" og busudgift = buspris', () => {
    const c = calcDay(day({ hd_need: true, ee_need: true }), settings)
    expect(c.shared).toBe(true)
    expect(c.busModel).toBe('Stor')
    expect(c.busExpense).toBe(3000)
  })

  it('tre skoler er også fælles kørsel (kun én busudgift)', () => {
    const c = calcDay(
      day({ he_need: true, hd_need: true, ee_need: true }),
      settings,
    )
    expect(c.shared).toBe(true)
    expect(c.busExpense).toBe(3000)
  })

  it('indtægt = antal billetter × billetpris, overskud = indtægt − udgift', () => {
    const c = calcDay(
      day({ hd_need: true, ee_need: true, hd_tickets: 30, ee_tickets: 20 }),
      settings,
    )
    expect(c.ticketCount).toBe(50)
    expect(c.income).toBe(50 * 65)
    expect(c.profit).toBe(50 * 65 - 3000)
  })

  it('markerer manglende overførsel når der er solgte billetter uden dato', () => {
    const c = calcDay(day({ hd_tickets: 10, ee_tickets: 5 }), settings)
    expect(c.hdMissing).toBe(true)
    expect(c.eeMissing).toBe(true)
  })

  it('ingen manglende overførsel når dato er registreret', () => {
    const c = calcDay(
      day({
        hd_tickets: 10,
        hd_transferred_date: '2026-08-10',
        ee_tickets: 0,
      }),
      settings,
    )
    expect(c.hdMissing).toBe(false)
    expect(c.eeMissing).toBe(false)
  })

  it('følger ændrede satser', () => {
    const c = calcDay(day({ hd_need: true, ee_need: true, he_tickets: 10 }), {
      bus_price: 4000,
      ticket_price: 70,
    })
    expect(c.busExpense).toBe(4000)
    expect(c.income).toBe(700)
  })
})

describe('calcPeriod – afregning pr. periode', () => {
  const days: PlanningDay[] = [
    // Inden for perioden, fælles kørsel: udgift 3000, indtægt 50*65=3250
    day({
      date: '2026-09-05',
      hd_need: true,
      ee_need: true,
      hd_tickets: 25,
      ee_tickets: 25,
    }),
    // Inden for perioden, fælles kørsel: udgift 3000, indtægt 0
    day({ date: '2026-10-10', he_need: true, hd_need: true }),
    // Uden for perioden – skal ignoreres
    day({
      date: '2027-02-01',
      hd_need: true,
      ee_need: true,
      hd_tickets: 100,
    }),
  ]
  const period: Period = {
    id: 'p1',
    name: 'Test',
    start_date: '2026-08-01',
    end_date: '2026-12-31',
    hd_running_transferred: 0,
    ee_running_transferred: 0,
  }

  it('summerer kun dage i datointervallet', () => {
    const r = calcPeriod(period, days, settings)
    expect(r.expenses).toBe(6000)
    expect(r.income).toBe(3250)
    expect(r.sharedDays).toBe(2)
  })

  it('samlet pris = udgifter − indtægter, delt på 3', () => {
    const r = calcPeriod(period, days, settings)
    expect(r.total).toBe(2750)
    expect(r.perSchool).toBeCloseTo(916.67, 2)
  })

  it('trækker løbende overførsler fra hver skoles andel', () => {
    const r = calcPeriod(
      { ...period, hd_running_transferred: 500, ee_running_transferred: 200 },
      days,
      settings,
    )
    expect(r.hdSettles).toBeCloseTo(416.67, 2)
    expect(r.eeSettles).toBeCloseTo(716.67, 2)
    expect(r.heBears).toBeCloseTo(916.67, 2)
  })

  it('overskud giver negativ samlet pris (HE betaler skolerne)', () => {
    const overskudDage: PlanningDay[] = [
      day({
        date: '2026-09-05',
        hd_need: true,
        ee_need: true,
        hd_tickets: 60,
        ee_tickets: 60,
      }),
    ]
    const r = calcPeriod(period, overskudDage, settings)
    expect(r.income).toBe(120 * 65)
    expect(r.total).toBe(3000 - 120 * 65)
    expect(r.total).toBeLessThan(0)
    expect(r.perSchool).toBeLessThan(0)
  })
})

describe('calcTotals – total-rækken', () => {
  it('tæller behov, fælles kørsler og summerer økonomi', () => {
    const days: PlanningDay[] = [
      day({ date: '2026-09-05', hd_need: true, ee_need: true, hd_tickets: 10 }),
      day({ date: '2026-09-06', ee_need: true }),
      day({ date: '2026-09-07', he_need: true, ee_need: true }),
    ]
    const t = calcTotals(days, settings)
    expect(t.sharedDays).toBe(2)
    expect(t.eeNeed).toBe(3)
    expect(t.hdNeed).toBe(1)
    expect(t.heNeed).toBe(1)
    expect(t.busExpense).toBe(6000)
    expect(t.ticketCount).toBe(10)
    expect(t.income).toBe(650)
    expect(t.profit).toBe(650 - 6000)
    expect(t.hdMissing).toBe(1)
  })
})
