import { describe, it, expect } from 'vitest'
import { isoWeek, weekday, monthName, money } from './format'

describe('isoWeek – matcher Excel ISOWEEKNUM fra regnearket', () => {
  // Værdier taget direkte fra Planlægning-fanen.
  const cases: [string, number][] = [
    ['2026-08-09', 32],
    ['2026-08-10', 33],
    ['2026-08-17', 34],
    ['2026-08-24', 35],
    ['2026-08-31', 36],
    ['2026-09-07', 37],
    ['2026-12-31', 53],
    ['2027-01-01', 53],
  ]
  it.each(cases)('uge for %s er %i', (date, expected) => {
    expect(isoWeek(date)).toBe(expected)
  })
})

describe('weekday – danske dagnavne', () => {
  it('2026-08-09 er en søndag', () => {
    expect(weekday('2026-08-09')).toBe('Søndag')
  })
  it('2026-08-10 er en mandag', () => {
    expect(weekday('2026-08-10')).toBe('Mandag')
  })
})

describe('monthName', () => {
  it('oversætter måned 8 til august', () => {
    expect(monthName(8)).toBe('august')
  })
})

describe('money – dansk valutaformat', () => {
  it('formaterer hele kroner uden decimaler', () => {
    expect(money(3000)).toContain('3.000')
  })
  it('viser decimaler når beløbet ikke er helt', () => {
    expect(money(916.67)).toContain('916,67')
  })
})
