import type { PlanningDay, Settings, Period } from '@/types'
import { supabase, hasSupabase } from '@/lib/supabase'
import {
  DEFAULT_SETTINGS,
  DEFAULT_PERIODS,
  defaultPlanningDays,
} from '@/lib/seed'

/** Hele datasættet appen arbejder på. */
export interface DataSet {
  settings: Settings
  periods: Period[]
  days: PlanningDay[]
}

/** Abstraktion over datalager – enten Supabase eller localStorage. */
export interface Repository {
  readonly mode: 'supabase' | 'local'
  load(): Promise<DataSet>
  saveSettings(settings: Settings): Promise<void>
  saveDay(day: PlanningDay): Promise<void>
  savePeriod(period: Period): Promise<void>
  /** Abonnér på ændringer fra andre brugere. Returnerer en oprydningsfunktion. */
  subscribe?(onChange: () => void): () => void
}

const LS_KEY = 'bus-regnskab-data-v1'

/** Lokalt lager i browseren – bruges når Supabase ikke er konfigureret. */
export class LocalStorageRepository implements Repository {
  readonly mode = 'local' as const

  private read(): DataSet {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      try {
        return JSON.parse(raw) as DataSet
      } catch {
        // falder igennem til standarddata
      }
    }
    const seeded: DataSet = {
      settings: { ...DEFAULT_SETTINGS },
      periods: DEFAULT_PERIODS.map((p) => ({ ...p })),
      days: defaultPlanningDays(),
    }
    this.write(seeded)
    return seeded
  }

  private write(data: DataSet) {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  }

  async load(): Promise<DataSet> {
    return this.read()
  }

  async saveSettings(settings: Settings): Promise<void> {
    const data = this.read()
    data.settings = settings
    this.write(data)
  }

  async saveDay(day: PlanningDay): Promise<void> {
    const data = this.read()
    const i = data.days.findIndex((d) => d.date === day.date)
    if (i >= 0) data.days[i] = day
    else data.days.push(day)
    this.write(data)
  }

  async savePeriod(period: Period): Promise<void> {
    const data = this.read()
    const i = data.periods.findIndex((p) => p.id === period.id)
    if (i >= 0) data.periods[i] = period
    else data.periods.push(period)
    this.write(data)
  }
}

/** Delt lager i Supabase – samme data for alle tre skoler, med realtid. */
export class SupabaseRepository implements Repository {
  readonly mode = 'supabase' as const

  async load(): Promise<DataSet> {
    const sb = supabase!
    const [settingsRes, periodsRes, daysRes] = await Promise.all([
      sb.from('settings').select('*').eq('id', 1).maybeSingle(),
      sb.from('periods').select('*').order('start_date'),
      sb.from('planning_days').select('*').order('date'),
    ])

    // Initialisér tomme tabeller med standarddata første gang.
    let settings = settingsRes.data as Settings | null
    if (!settings) {
      await sb.from('settings').upsert({ id: 1, ...DEFAULT_SETTINGS })
      settings = { ...DEFAULT_SETTINGS }
    }

    let periods = (periodsRes.data as Period[] | null) ?? []
    if (periods.length === 0) {
      await sb.from('periods').upsert(DEFAULT_PERIODS)
      periods = DEFAULT_PERIODS.map((p) => ({ ...p }))
    }

    let days = (daysRes.data as PlanningDay[] | null) ?? []
    if (days.length === 0) {
      const seed = defaultPlanningDays()
      // Indsæt i bidder så vi holder os under request-grænser.
      for (let i = 0; i < seed.length; i += 200) {
        await sb.from('planning_days').upsert(seed.slice(i, i + 200))
      }
      days = seed
    }

    return {
      settings: {
        bus_price: settings.bus_price,
        ticket_price: settings.ticket_price,
      },
      periods,
      days,
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    await supabase!.from('settings').upsert({ id: 1, ...settings })
  }

  async saveDay(day: PlanningDay): Promise<void> {
    await supabase!.from('planning_days').upsert(day)
  }

  async savePeriod(period: Period): Promise<void> {
    await supabase!.from('periods').upsert(period)
  }

  subscribe(onChange: () => void): () => void {
    const channel = supabase!
      .channel('bus-regnskab-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'planning_days' },
        onChange,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings' },
        onChange,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'periods' },
        onChange,
      )
      .subscribe()
    return () => {
      supabase!.removeChannel(channel)
    }
  }
}

export function createRepository(): Repository {
  return hasSupabase ? new SupabaseRepository() : new LocalStorageRepository()
}

/** Nulstil lokalt lager til seed-data (bruges af demoens "nulstil"-knap). */
export function resetLocalData() {
  localStorage.removeItem(LS_KEY)
}
