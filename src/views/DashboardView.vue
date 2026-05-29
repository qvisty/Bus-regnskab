<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from '@/store'
import { calcTotals, calcPeriod, calcDay } from '@/lib/calc'
import { money, dateLabel, weekday, dateShort } from '@/lib/format'

const store = useStore()
const router = useRouter()

const today = new Date().toISOString().slice(0, 10)

const sortedDays = computed(() =>
  [...store.days.value].sort((a, b) => a.date.localeCompare(b.date)),
)

const totals = computed(() => calcTotals(sortedDays.value, store.settings.value))

const periods = computed(() =>
  store.periods.value.map((p) => ({
    period: p,
    result: calcPeriod(p, store.days.value, store.settings.value),
  })),
)

// Kommende dage med behov (fra i dag og frem).
const upcoming = computed(() =>
  sortedDays.value
    .filter((d) => d.date >= today)
    .filter((d) => d.he_need || d.hd_need || d.ee_need)
    .slice(0, 8)
    .map((d) => ({ day: d, calc: calcDay(d, store.settings.value) })),
)

const seasonStart = computed(() => sortedDays.value[0]?.date)
const seasonEnd = computed(
  () => sortedDays.value[sortedDays.value.length - 1]?.date,
)

const missingTotal = computed(() => totals.value.hdMissing + totals.value.eeMissing)
</script>

<template>
  <div class="page-head">
    <h1>Oversigt</h1>
    <p v-if="seasonStart">
      Fælles weekendkørsel mellem HE, HD og EE ·
      {{ dateLabel(seasonStart) }} – {{ dateLabel(seasonEnd) }}
    </p>
  </div>

  <!-- Nøgletal for hele sæsonen -->
  <div class="stat-grid">
    <div class="stat">
      <div class="label">Fælles kørsler</div>
      <div class="value">{{ totals.sharedDays }}</div>
    </div>
    <div class="stat">
      <div class="label">Busudgift</div>
      <div class="value">{{ money(totals.busExpense) }}</div>
    </div>
    <div class="stat">
      <div class="label">Indtægt</div>
      <div class="value">{{ money(totals.income) }}</div>
      <div class="label" style="margin-top: 4px; text-transform: none">
        {{ totals.ticketCount }} billetter
      </div>
    </div>
    <div class="stat">
      <div class="label">Resultat</div>
      <div class="value" :class="totals.profit >= 0 ? 'pos' : 'neg'">
        {{ money(totals.profit) }}
      </div>
      <div class="label" style="margin-top: 4px; text-transform: none">
        {{ totals.profit >= 0 ? 'overskud' : 'underskud' }}
      </div>
    </div>
  </div>

  <!-- Advarsel om manglende overførsler -->
  <div v-if="missingTotal" class="banner warn">
    <strong>{{ missingTotal }}</strong> dag(e) har solgte billetter uden
    registreret overførsel
    <span v-if="totals.hdMissing">({{ totals.hdMissing }} HD</span>
    <span v-if="totals.hdMissing && totals.eeMissing">, </span>
    <span v-if="totals.eeMissing && !totals.hdMissing">(</span>
    <span v-if="totals.eeMissing">{{ totals.eeMissing }} EE</span
    >).
    <router-link to="/planlaegning">Se i planlægningen →</router-link>
  </div>

  <div class="dash-cols">
    <!-- Afregning pr. periode -->
    <div class="card">
      <h2 style="font-size: 17px">Afregning pr. periode</h2>
      <div
        v-for="{ period, result } in periods"
        :key="period.id"
        class="dash-period"
        @click="router.push('/afregning')"
      >
        <div class="dash-period-head">
          <strong>{{ period.name }}</strong>
          <span :class="result.total > 0 ? 'neg' : 'pos'" style="font-weight: 700">
            {{ money(result.perSchool) }} / skole
          </span>
        </div>
        <div class="muted" style="font-size: 12.5px">
          {{ result.sharedDays }} fælles kørsler · samlet pris
          {{ money(result.total) }}
        </div>
      </div>
      <button class="btn sm" style="margin-top: 12px" @click="router.push('/afregning')">
        Åbn afregning →
      </button>
    </div>

    <!-- Kommende behov -->
    <div class="card">
      <h2 style="font-size: 17px">Kommende behov</h2>
      <p v-if="!upcoming.length" class="muted">
        Ingen kommende dage med registreret behov.
      </p>
      <ul v-else class="dash-list">
        <li v-for="{ day, calc } in upcoming" :key="day.date">
          <span class="dash-date">
            {{ weekday(day.date).slice(0, 3) }} {{ dateShort(day.date) }}
          </span>
          <span class="dash-needs">
            <span v-if="day.he_need" class="pill he">HE</span>
            <span v-if="day.hd_need" class="pill hd">HD</span>
            <span v-if="day.ee_need" class="pill ee">EE</span>
          </span>
          <span v-if="calc.shared" class="pill shared">Fælles</span>
          <span v-else class="dim" style="font-size: 12px">enkelt skole</span>
        </li>
      </ul>
      <button class="btn sm" style="margin-top: 8px" @click="router.push('/planlaegning')">
        Åbn planlægning →
      </button>
    </div>
  </div>
</template>

<style scoped>
.dash-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
@media (max-width: 760px) {
  .dash-cols {
    grid-template-columns: 1fr;
  }
}
.dash-period {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}
.dash-period:hover {
  opacity: 0.8;
}
.dash-period-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.dash-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.dash-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.dash-date {
  font-variant-numeric: tabular-nums;
  min-width: 110px;
  font-weight: 600;
}
.dash-needs {
  display: flex;
  gap: 4px;
  flex: 1;
}
</style>
