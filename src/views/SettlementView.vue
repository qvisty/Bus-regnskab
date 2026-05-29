<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/store'
import { calcPeriod } from '@/lib/calc'
import type { Period } from '@/types'
import { money, dateLabel } from '@/lib/format'

const store = useStore()

const results = computed(() =>
  store.periods.value.map((p) => ({
    period: p,
    result: calcPeriod(p, store.days.value, store.settings.value),
  })),
)

function setTransferred(period: Period, school: 'hd' | 'ee', value: number) {
  const v = Number(value) || 0
  store.updatePeriod({
    ...period,
    ...(school === 'hd'
      ? { hd_running_transferred: v }
      : { ee_running_transferred: v }),
  })
}
</script>

<template>
  <div class="page-head">
    <h1>Afregning pr. periode</h1>
    <p>
      Udgifter og indtægter hentes automatisk fra Planlægning for datoer i
      perioden. Den samlede pris (udgifter − indtægter) deles ligeligt mellem de
      tre skoler. "Løbende overført" trækkes fra hver skoles andel, så I kun
      afregner forskellen ved periodeslut.
    </p>
  </div>

  <div class="settle-grid">
    <div
      v-for="{ period, result } in results"
      :key="period.id"
      class="card settle-card"
    >
      <h3>
        {{ period.name }}
        <span class="dates">
          {{ dateLabel(period.start_date) }} – {{ dateLabel(period.end_date) }}
        </span>
      </h3>

      <div class="row">
        <span class="muted">Fælles kørsler i perioden</span>
        <span class="v">{{ result.sharedDays }}</span>
      </div>
      <div class="row">
        <span>Udgifter, busser</span>
        <span class="v">{{ money(result.expenses) }}</span>
      </div>
      <div class="row">
        <span>Indtægter (billetter)</span>
        <span class="v">{{ money(result.income) }}</span>
      </div>
      <div class="row total">
        <span>Samlet pris (udgifter − indtægter)</span>
        <span class="v" :class="result.total > 0 ? 'neg' : 'pos'">
          {{ money(result.total) }}
        </span>
      </div>
      <div class="row">
        <span>Pris pr. skole (delt med 3)</span>
        <span class="v">{{ money(result.perSchool) }}</span>
      </div>

      <div class="row" style="border-top: 1px solid var(--border); margin-top: 8px; padding-top: 12px">
        <label class="field" style="flex-direction: row; align-items: center; gap: 8px; width: 100%; justify-content: space-between">
          <span class="muted">Løbende overført, HD</span>
          <input
            type="number"
            style="width: 120px; text-align: right"
            :value="period.hd_running_transferred"
            @change="setTransferred(period, 'hd', ($event.target as HTMLInputElement).valueAsNumber)"
          />
        </label>
      </div>
      <div class="row">
        <label class="field" style="flex-direction: row; align-items: center; gap: 8px; width: 100%; justify-content: space-between">
          <span class="muted">Løbende overført, EE</span>
          <input
            type="number"
            style="width: 120px; text-align: right"
            :value="period.ee_running_transferred"
            @change="setTransferred(period, 'ee', ($event.target as HTMLInputElement).valueAsNumber)"
          />
        </label>
      </div>

      <div class="row" style="margin-top: 8px">
        <span><span class="pill hd">HD</span> afregner til HE</span>
        <span class="v">{{ money(result.hdSettles) }}</span>
      </div>
      <div class="row">
        <span><span class="pill ee">EE</span> afregner til HE</span>
        <span class="v">{{ money(result.eeSettles) }}</span>
      </div>
      <div class="row">
        <span><span class="pill he">HE</span> bærer selv (egen andel)</span>
        <span class="v">{{ money(result.heBears) }}</span>
      </div>
    </div>
  </div>

  <div class="banner info" style="margin-top: 20px">
    Negativ samlet pris betyder overskud – så overfører HE i stedet sin andel
    til HD og EE. Beløbene følger fortegnet automatisk.
  </div>
</template>
