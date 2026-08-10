import { describe, it, expect } from 'vitest'
import { calcDay, calcPeriod, calcTotals } from './calc'
import type { PlanningDay, Settings, Period } from '@/types'

const settings: Settings = { ticket_price: 65 }

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

  it('to skoler giver fælles kørsel; uden billetter vælges den lille bus', () => {
    const c = calcDay(day({ hd_need: true, ee_need: true }), settings)
    expect(c.shared).toBe(true)
    expect(c.busModel).toBe('Lille bus')
    expect(c.busSeats).toBe(19)
    expect(c.busExpense).toBe(2430)
  })

  it('tre skoler er også fælles kørsel (kun én busudgift)', () => {
    const c = calcDay(
      day({ he_need: true, hd_need: true, ee_need: true }),
      settings,
    )
    expect(c.shared).toBe(true)
    expect(c.busExpense).toBe(2430)
  })

  it('indtægt = antal billetter × billetpris, overskud = indtægt − udgift', () => {
    const c = calcDay(
      day({ hd_need: true, ee_need: true, hd_tickets: 30, ee_tickets: 20 }),
      settings,
    )
    expect(c.ticketCount).toBe(50)
    // 50 billetter kræver den store bus (57 pladser).
    expect(c.busModel).toBe('Stor bus')
    expect(c.income).toBe(50 * 65)
    expect(c.profit).toBe(50 * 65 - 4375)
  })

  it('vælger mindste bus der kan rumme alle billetter', () => {
    const shared = { hd_need: true, ee_need: true }
    const at = (tickets: number) =>
      calcDay(day({ ...shared, hd_tickets: tickets }), settings)
    expect(at(19).busModel).toBe('Lille bus')
    expect(at(19).busExpense).toBe(2430)
    expect(at(20).busModel).toBe('Stor bus')
    expect(at(20).busExpense).toBe(4375)
    expect(at(57).busModel).toBe('Stor bus')
    expect(at(58).busModel).toBe('Dobbeltdækker')
    expect(at(58).busExpense).toBe(4866)
    expect(at(83).busOverflow).toBe(false)
  })

  it('markerer overbooking når billettallet overstiger den største bus', () => {
    const c = calcDay(
      day({ hd_need: true, ee_need: true, hd_tickets: 60, ee_tickets: 30 }),
      settings,
    )
    expect(c.busModel).toBe('Dobbeltdækker')
    expect(c.busExpense).toBe(4866)
    expect(c.busOverflow).toBe(true)
  })

  it('ikke-fælles dag medregner hverken indtægt, udgift eller billetter', () => {
    const c = calcDay(
      day({ ee_need: true, ee_tickets: 20, hd_tickets: 5 }),
      settings,
    )
    expect(c.shared).toBe(false)
    expect(c.busExpense).toBe(0)
    expect(c.income).toBe(0)
    expect(c.ticketCount).toBe(0)
    expect(c.profit).toBe(0)
    expect(c.hdMissing).toBe(false)
  })

  it('markerer manglende overførsel når der er solgte billetter uden dato (kun på fælles dage)', () => {
    const c = calcDay(
      day({ hd_need: true, ee_need: true, hd_tickets: 10, ee_tickets: 5 }),
      settings,
    )
    expect(c.hdMissing).toBe(true)
    expect(c.eeMissing).toBe(true)
  })

  it('ingen manglende overførsel når dato er registreret', () => {
    const c = calcDay(
      day({
        hd_need: true,
        ee_need: true,
        hd_tickets: 10,
        hd_transferred_date: '2026-08-10',
        ee_tickets: 0,
      }),
      settings,
    )
    expect(c.hdMissing).toBe(false)
    expect(c.eeMissing).toBe(false)
  })

  it('følger ændret billetpris; bustaksten er fast', () => {
    const c = calcDay(day({ hd_need: true, ee_need: true, he_tickets: 10 }), {
      ticket_price: 70,
    })
    expect(c.busExpense).toBe(2430)
    expect(c.income).toBe(700)
  })
})

describe('calcPeriod – afregning pr. periode', () => {
  const days: PlanningDay[] = [
    // Inden for perioden, fælles kørsel: 50 billetter -> stor bus,
    // udgift 4375, indtægt 50*65=3250
    day({
      date: '2026-09-05',
      hd_need: true,
      ee_need: true,
      hd_tickets: 25,
      ee_tickets: 25,
    }),
    // Inden for perioden, fælles kørsel uden billetter: lille bus, udgift 2430
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
    settled_at: null,
  }

  it('summerer kun dage i datointervallet', () => {
    const r = calcPeriod(period, days, settings)
    expect(r.expenses).toBe(4375 + 2430)
    expect(r.income).toBe(3250)
    expect(r.sharedDays).toBe(2)
  })

  it('samlet pris = udgifter − indtægter, delt på 3', () => {
    const r = calcPeriod(period, days, settings)
    expect(r.total).toBe(4375 + 2430 - 3250)
    expect(r.perSchool).toBeCloseTo((4375 + 2430 - 3250) / 3, 2)
  })

  it('udleder løbende overførsel automatisk af registrerede overførselsdatoer', () => {
    // To rene fælles dage à udgift 2430 (lille bus), ingen indtægt
    // -> andel 810/dag/skole.
    const d: PlanningDay[] = [
      day({ date: '2026-09-05', hd_need: true, ee_need: true }),
      day({ date: '2026-10-10', hd_need: true, ee_need: true }),
    ]
    // HD har overført for den ene dag, EE for begge.
    d[0].hd_transferred_date = '2026-09-07'
    d[0].ee_transferred_date = '2026-09-07'
    d[1].ee_transferred_date = '2026-10-12'

    const r = calcPeriod(period, d, settings)
    expect(r.perSchool).toBe(1620)
    expect(r.hdTransferred).toBe(810)
    expect(r.eeTransferred).toBe(1620)
    expect(r.hdSettles).toBe(810) // mangler stadig 1 dag
    expect(r.eeSettles).toBe(0) // alt overført
    expect(r.heBears).toBe(1620)
  })

  it('overskud giver negativ samlet pris (HE betaler skolerne)', () => {
    const overskudDage: PlanningDay[] = [
      day({
        date: '2026-09-05',
        hd_need: true,
        ee_need: true,
        hd_tickets: 40,
        ee_tickets: 40,
      }),
    ]
    // 80 billetter -> dobbeltdækker (4866), indtægt 80*65 = 5200.
    const r = calcPeriod(period, overskudDage, settings)
    expect(r.income).toBe(80 * 65)
    expect(r.total).toBe(4866 - 80 * 65)
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
    // Begge fælles dage kan klares med den lille bus (10 hhv. 0 billetter).
    expect(t.busExpense).toBe(2 * 2430)
    expect(t.busDays).toEqual({ small: 2, large: 0, double: 0 })
    expect(t.ticketCount).toBe(10)
    expect(t.hdTickets).toBe(10)
    expect(t.heTickets).toBe(0)
    expect(t.eeTickets).toBe(0)
    expect(t.income).toBe(650)
    expect(t.profit).toBe(650 - 2 * 2430)
    expect(t.hdMissing).toBe(1)
  })
})
