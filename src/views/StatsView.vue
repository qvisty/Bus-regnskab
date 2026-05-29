<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from '@/store'
import { aggregate, forecast, type Grouping } from '@/lib/stats'
import { calcTotals } from '@/lib/calc'
import { money } from '@/lib/format'
import BarChart from '@/components/BarChart.vue'

const store = useStore()
const grouping = ref<Grouping>('month')
const today = new Date().toISOString().slice(0, 10)

const buckets = computed(() =>
  aggregate(store.days.value, store.settings.value, grouping.value),
)
const totals = computed(() =>
  calcTotals(store.days.value, store.settings.value),
)
const fc = computed(() =>
  forecast(store.days.value, store.settings.value, today),
)

const groupingLabels: Record<Grouping, string> = {
  week: 'Uge',
  month: 'Måned',
  year: 'År',
}
</script>

<template>
  <div class="page-head">
    <h1>Statistik & prognose</h1>
    <p>
      Visualisering af fælles kørsler over tid og en billetpris-anbefaling, hvis
      sæsonen tegner til at give underskud.
    </p>
  </div>

  <!-- Nøgletal -->
  <div class="stat-grid">
    <div class="stat">
      <div class="label">Fælles kørsler</div>
      <div class="value">{{ totals.sharedDays }}</div>
    </div>
    <div class="stat">
      <div class="label">Udgift</div>
      <div class="value">{{ money(totals.busExpense) }}</div>
    </div>
    <div class="stat">
      <div class="label">Indtægt</div>
      <div class="value">{{ money(totals.income) }}</div>
    </div>
    <div class="stat">
      <div class="label">Resultat</div>
      <div class="value" :class="totals.profit >= 0 ? 'pos' : 'neg'">
        {{ money(totals.profit) }}
      </div>
    </div>
  </div>

  <!-- Billetpris-prognose -->
  <div class="card forecast" :class="fc.deficit ? 'warn-edge' : 'ok-edge'">
    <h2 style="font-size: 17px">Billetpris-anbefaling</h2>
    <p v-if="!fc.hasBasis" class="muted">
      Indtast forventede billettal på nogle fælles dage i Planlægning, så
      beregner vi en prognose og en anbefalet billetpris her.
    </p>
    <template v-else>
      <div class="forecast-grid">
        <div>
          <div class="label">Nuværende billetpris</div>
          <div class="fval">{{ money(store.settings.value.ticket_price) }}</div>
        </div>
        <div>
          <div class="label">Forventet billetsalg</div>
          <div class="fval">
            {{ Math.round(fc.projectedTickets) }}
            <span class="muted" style="font-size: 12px"
              >(≈{{ fc.avgTicketsPerRide.toFixed(1) }}/kørsel)</span
            >
          </div>
        </div>
        <div>
          <div class="label">Forventet resultat (sæson)</div>
          <div class="fval" :class="fc.deficit ? 'neg' : 'pos'">
            {{ money(-fc.projectedResult) }}
          </div>
          <div class="muted" style="font-size: 12px">
            {{ fc.deficit ? 'underskud' : 'overskud' }} · udgift
            {{ money(fc.projectedExpenses) }} − indtægt
            {{ money(fc.projectedIncome) }}
          </div>
        </div>
      </div>

      <div v-if="fc.deficit && fc.recommendedPrice" class="reco">
        💡 For at sæsonen går i nul fra dags dato anbefales en billetpris på
        <strong>{{ money(fc.recommendedPrice) }}</strong>
        <span class="muted">
          (mod nuværende {{ money(store.settings.value.ticket_price) }}).
        </span>
      </div>
      <div v-else-if="fc.deficit" class="reco">
        Prognosen viser underskud, men der er ingen resterende kørsler at sælge
        flere billetter på – juster i stedet busudgiften eller perioden.
      </div>
      <div v-else class="reco ok">
        ✓ Prognosen går i nul eller plus med den nuværende billetpris.
      </div>
    </template>
  </div>

  <!-- Diagrammer -->
  <div class="toolbar" style="margin-top: 20px">
    <label class="field">
      Gruppér efter
      <select v-model="grouping">
        <option value="week">Uge</option>
        <option value="month">Måned</option>
        <option value="year">År</option>
      </select>
    </label>
  </div>

  <div v-if="!buckets.length" class="banner info">
    Ingen fælles kørsler endnu – markér behov for mindst to skoler på samme dag
    i Planlægning.
  </div>

  <template v-else>
    <div class="card">
      <h2 style="font-size: 17px">
        Udgift vs. indtægt pr. {{ groupingLabels[grouping].toLowerCase() }}
      </h2>
      <div class="legend">
        <span><span class="swatch" style="background: var(--danger)"></span> Udgift</span>
        <span><span class="swatch" style="background: var(--ok)"></span> Indtægt</span>
      </div>
      <BarChart :buckets="buckets" type="income-expense" />
    </div>

    <div class="card">
      <h2 style="font-size: 17px">
        Overskud pr. {{ groupingLabels[grouping].toLowerCase() }}
      </h2>
      <p class="muted" style="margin-top: 0; font-size: 13px">
        Søjler over midten = overskud, under = underskud.
      </p>
      <BarChart :buckets="buckets" type="profit" />
    </div>
  </template>
</template>

<style scoped>
.forecast.warn-edge {
  border-left: 4px solid var(--danger);
}
.forecast.ok-edge {
  border-left: 4px solid var(--ok);
}
.forecast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin: 12px 0;
}
.label {
  font-size: 12.5px;
  color: var(--text-muted);
  font-weight: 600;
}
.fval {
  font-size: 20px;
  font-weight: 700;
  margin-top: 2px;
}
.reco {
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--surface-2);
  font-size: 14.5px;
}
.reco.ok {
  background: var(--ok-bg);
  color: var(--ok);
}
</style>
