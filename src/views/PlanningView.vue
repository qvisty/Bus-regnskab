<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from '@/store'
import { calcDay, calcTotals } from '@/lib/calc'
import {
  monthName,
  money,
  parseISO,
  dateShort,
  weekdayShort,
} from '@/lib/format'
import { planningToCsv, downloadCsv } from '@/lib/csv'
import PlanningRow from '@/components/PlanningRow.vue'

const store = useStore()

const monthFilter = ref<string>('all')
const onlyShared = ref(false)
const onlyMissing = ref(false)
const onlyNeeds = ref(false)

function exportCsv() {
  const csv = planningToCsv(store.days.value, store.settings.value)
  downloadCsv('faelles-buskoersel-planlaegning.csv', csv)
}

// Lokale satser bundet til input-felterne.
const busPrice = computed({
  get: () => store.settings.value.bus_price,
  set: (v: number) =>
    store.updateSettings({ ...store.settings.value, bus_price: Number(v) || 0 }),
})
const ticketPrice = computed({
  get: () => store.settings.value.ticket_price,
  set: (v: number) =>
    store.updateSettings({
      ...store.settings.value,
      ticket_price: Number(v) || 0,
    }),
})

// Tilgængelige måneder til filteret (i datorækkefølge).
const months = computed(() => {
  const seen = new Map<string, string>()
  for (const d of store.days.value) {
    const dt = parseISO(d.date)
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
    if (!seen.has(key)) {
      seen.set(key, `${monthName(dt.getMonth() + 1)} ${dt.getFullYear()}`)
    }
  }
  return [...seen.entries()].map(([value, label]) => ({ value, label }))
})

const sortedDays = computed(() =>
  [...store.days.value].sort((a, b) => a.date.localeCompare(b.date)),
)

const visibleDays = computed(() =>
  sortedDays.value.filter((d) => {
    if (monthFilter.value !== 'all') {
      const dt = parseISO(d.date)
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
      if (key !== monthFilter.value) return false
    }
    const c = calcDay(d, store.settings.value)
    if (onlyShared.value && !c.shared) return false
    if (onlyMissing.value && !(c.hdMissing || c.eeMissing)) return false
    if (onlyNeeds.value && !(d.he_need || d.hd_need || d.ee_need)) return false
    return true
  }),
)

// Totaler – beregnes altid på hele datasættet (som total-rækken i Excel).
const totals = computed(() => calcTotals(sortedDays.value, store.settings.value))

// Konkrete datoer hvor overførsel mangler, pr. skole.
const missingDays = computed(() => {
  const hd: string[] = []
  const ee: string[] = []
  for (const d of sortedDays.value) {
    const c = calcDay(d, store.settings.value)
    if (c.hdMissing) hd.push(d.date)
    if (c.eeMissing) ee.push(d.date)
  }
  return { hd, ee }
})

function fmtDays(dates: string[]): string {
  return dates.map((d) => `${weekdayShort(d)} ${dateShort(d)}`).join(', ')
}

function isMonthStart(date: string, index: number): boolean {
  if (index === 0) return false
  const prev = visibleDays.value[index - 1]
  return parseISO(prev.date).getMonth() !== parseISO(date).getMonth()
}
</script>

<template>
  <div class="page-head">
    <h1>Planlægning</h1>
    <p>
      Hver dato har sin egen række. Sæt flueben ved skolernes behov. Først når
      mindst to skoler har behov samme dag, bliver det en fælles kørsel – og så
      vises felterne til billetter og overførsler. Kun fælles dage medregnes i
      udgift, indtægt og overskud.
    </p>
  </div>

  <!-- Satser -->
  <div class="card" style="margin-bottom: 18px">
    <div class="toolbar" style="margin-bottom: 0">
      <label class="field">
        Pris pr. kørsel (udgift)
        <input type="number" v-model.number="busPrice" min="0" step="50" />
      </label>
      <label class="field">
        Pris pr. billet (indtægt)
        <input type="number" v-model.number="ticketPrice" min="0" step="5" />
      </label>
      <span class="muted" style="align-self: flex-end; padding-bottom: 8px">
        Satserne rettes ét sted og slår igennem alle beregninger.
      </span>
    </div>
  </div>

  <!-- Nøgletal -->
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
      <div class="label">Indtægt ({{ totals.ticketCount }} billetter)</div>
      <div class="value">{{ money(totals.income) }}</div>
    </div>
    <div class="stat">
      <div class="label">Overskud</div>
      <div class="value" :class="totals.profit >= 0 ? 'pos' : 'neg'">
        {{ money(totals.profit) }}
      </div>
    </div>
  </div>

  <div
    v-if="missingDays.hd.length || missingDays.ee.length"
    class="banner warn"
  >
    <strong>Mangler overførsel</strong> – solgte billetter uden registreret
    overførselsdato:
    <div v-if="missingDays.hd.length" style="margin-top: 4px">
      <span class="pill hd">HD</span>
      {{ missingDays.hd.length }} dag(e): {{ fmtDays(missingDays.hd) }}
    </div>
    <div v-if="missingDays.ee.length" style="margin-top: 4px">
      <span class="pill ee">EE</span>
      {{ missingDays.ee.length }} dag(e): {{ fmtDays(missingDays.ee) }}
    </div>
  </div>

  <!-- Filtre -->
  <div class="toolbar">
    <label class="field">
      Måned
      <select v-model="monthFilter">
        <option value="all">Alle måneder</option>
        <option v-for="m in months" :key="m.value" :value="m.value">
          {{ m.label }}
        </option>
      </select>
    </label>
    <label class="field" style="flex-direction: row; align-items: center; gap: 6px; align-self: flex-end; padding-bottom: 8px">
      <input type="checkbox" class="chk" v-model="onlyShared" />
      Kun fælles kørsel
    </label>
    <label class="field" style="flex-direction: row; align-items: center; gap: 6px; align-self: flex-end; padding-bottom: 8px">
      <input type="checkbox" class="chk" v-model="onlyMissing" />
      Kun manglende overførsel
    </label>
    <label class="field" style="flex-direction: row; align-items: center; gap: 6px; align-self: flex-end; padding-bottom: 8px">
      <input type="checkbox" class="chk" v-model="onlyNeeds" />
      Kun dage med behov
    </label>
    <span class="nav-spacer"></span>
    <button class="btn sm" style="align-self: flex-end; margin-bottom: 4px" @click="exportCsv">
      ⭳ Eksportér CSV
    </button>
    <span class="muted" style="align-self: flex-end; padding-bottom: 8px">
      Viser {{ visibleDays.length }} af {{ sortedDays.length }} dage
    </span>
  </div>

  <div class="legend">
    <span><span class="swatch" style="background: #eef3ff"></span> Fælles kørsel</span>
    <span><span class="swatch" style="background: #fcfbf5"></span> Weekend</span>
    <span><span class="pill missing">Mangler</span> Overførsel ikke registreret</span>
  </div>

  <!-- Tabel -->
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Dato</th>
          <th>Dag</th>
          <th class="num">Uge</th>
          <th title="HE har behov">HE</th>
          <th title="HD har behov">HD</th>
          <th title="EE har behov">EE</th>
          <th>Fælles</th>
          <th class="num">HE bill.</th>
          <th class="num">HD bill.</th>
          <th class="num">EE bill.</th>
          <th class="num">Busudgift</th>
          <th class="num">Indtægt</th>
          <th class="num">Overskud</th>
          <th>HD overført</th>
          <th>EE overført</th>
          <th>Bemærkning</th>
        </tr>
      </thead>
      <tbody>
        <PlanningRow
          v-for="(day, i) in visibleDays"
          :key="day.date"
          :day="day"
          :settings="store.settings.value"
          :month-start="isMonthStart(day.date, i)"
          @update="store.updateDay"
        />
      </tbody>
      <tfoot>
        <tr class="foot">
          <td colspan="3">Total</td>
          <td>{{ totals.heNeed }}</td>
          <td>{{ totals.hdNeed }}</td>
          <td>{{ totals.eeNeed }}</td>
          <td>{{ totals.sharedDays }}</td>
          <td colspan="3" class="num">{{ totals.ticketCount }} billetter</td>
          <td class="num">{{ money(totals.busExpense) }}</td>
          <td class="num">{{ money(totals.income) }}</td>
          <td class="num" :class="totals.profit >= 0 ? '' : 'neg'">
            {{ money(totals.profit) }}
          </td>
          <td colspan="3"></td>
        </tr>
      </tfoot>
    </table>
  </div>
</template>
