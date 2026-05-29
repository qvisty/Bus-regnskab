import { reactive, computed, readonly } from 'vue'
import type { PlanningDay, Settings, Period } from '@/types'
import {
  createRepository,
  resetLocalData,
  type Repository,
} from './repository'
import { isDemo } from '@/lib/supabase'

interface State {
  loaded: boolean
  loading: boolean
  error: string | null
  settings: Settings
  periods: Period[]
  days: PlanningDay[]
  mode: 'supabase' | 'local'
}

const repo: Repository = createRepository()

const state = reactive<State>({
  loaded: false,
  loading: false,
  error: null,
  settings: { bus_price: 3000, ticket_price: 65 },
  periods: [],
  days: [],
  mode: repo.mode,
})

let unsubscribe: (() => void) | null = null

async function load() {
  state.loading = true
  state.error = null
  try {
    const data = await repo.load()
    state.settings = data.settings
    state.periods = data.periods
    state.days = data.days
    state.loaded = true
    if (repo.subscribe && !unsubscribe) {
      unsubscribe = repo.subscribe(() => {
        // Genindlæs ved ændringer fra andre brugere (uden flimmer).
        void refresh()
      })
    }
  } catch (e) {
    state.error = e instanceof Error ? e.message : String(e)
  } finally {
    state.loading = false
  }
}

async function refresh() {
  try {
    const data = await repo.load()
    state.settings = data.settings
    state.periods = data.periods
    state.days = data.days
  } catch {
    // stille fejl ved baggrundsopdatering
  }
}

async function updateDay(day: PlanningDay) {
  const i = state.days.findIndex((d) => d.date === day.date)
  if (i >= 0) state.days[i] = day
  else state.days.push(day)
  await repo.saveDay(day)
}

async function updateSettings(settings: Settings) {
  state.settings = settings
  await repo.saveSettings(settings)
}

async function updatePeriod(period: Period) {
  const i = state.periods.findIndex((p) => p.id === period.id)
  if (i >= 0) state.periods[i] = period
  await repo.savePeriod(period)
}

/** Markér en periode som afregnet (gjort op til nul) eller genåbn den. */
async function setPeriodSettled(id: string, settledAt: string | null) {
  const p = state.periods.find((x) => x.id === id)
  if (!p) return
  await updatePeriod({ ...p, settled_at: settledAt })
}

/** Nulstil demo-data til udgangspunktet og genindlæs. */
async function resetDemo() {
  resetLocalData()
  await load()
}

export function useStore() {
  return {
    state: readonly(state),
    isDemo,
    days: computed(() => state.days),
    settings: computed(() => state.settings),
    periods: computed(() => state.periods),
    load,
    refresh,
    updateDay,
    updateSettings,
    updatePeriod,
    setPeriodSettled,
    resetDemo,
  }
}
