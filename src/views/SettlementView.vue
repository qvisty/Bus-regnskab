<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/store'
import { calcPeriod } from '@/lib/calc'
import type { Period } from '@/types'
import { money, dateLabel } from '@/lib/format'

const store = useStore()

const results = computed(() =>
  store.periods.value.map((p) => {
    const result = calcPeriod(p, store.days.value, store.settings.value)
    // Retning på afregningen: positivt beløb = skolen betaler HE,
    // negativt = HE betaler skolen (ved overskud).
    const flows = [
      { school: 'HD', amount: result.hdSettles },
      { school: 'EE', amount: result.eeSettles },
    ].map((f) => ({
      ...f,
      from: f.amount >= 0 ? f.school : 'HE',
      to: f.amount >= 0 ? 'HE' : f.school,
      abs: Math.abs(f.amount),
    }))
    return { period: p, result, flows }
  }),
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
      v-for="{ period, result, flows } in results"
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

      <div class="flow-box">
        <div class="flow-title">Afregning ved periodeslut</div>
        <div
          v-for="f in flows"
          :key="f.school"
          class="flow"
          :class="{ zero: f.abs === 0 }"
        >
          <template v-if="f.abs === 0">
            <span class="pill" :class="f.school.toLowerCase()">{{ f.school }}</span>
            <span class="muted">intet at afregne</span>
          </template>
          <template v-else>
            <span class="pill" :class="f.from.toLowerCase()">{{ f.from }}</span>
            <span class="arrow">→</span>
            <span class="pill" :class="f.to.toLowerCase()">{{ f.to }}</span>
            <span class="flow-amt">{{ money(f.abs) }}</span>
          </template>
        </div>
        <div class="flow muted" style="font-size: 12.5px; margin-top: 6px">
          HE bærer selv sin egen andel på {{ money(result.heBears) }}.
        </div>
      </div>
    </div>
  </div>

  <div class="banner info" style="margin-top: 20px">
    Negativ samlet pris betyder overskud – så overfører HE i stedet sin andel
    til HD og EE. Pilene følger fortegnet automatisk.
  </div>
</template>

<style scoped>
.flow-box {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px solid var(--border);
}
.flow-title {
  font-size: 12.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.flow {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
}
.flow .arrow {
  color: var(--text-muted);
  font-weight: 700;
}
.flow-amt {
  margin-left: auto;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.flow.zero {
  opacity: 0.7;
}
</style>
