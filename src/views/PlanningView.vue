<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from '@/store'
import { calcDay, calcTotals } from '@/lib/calc'
import type { PlanningDay } from '@/types'
import {
  weekdayShort,
  isoWeek,
  isWeekend,
  monthName,
  money,
  dateShort,
  parseISO,
} from '@/lib/format'
import { planningToCsv, downloadCsv } from '@/lib/csv'

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

function isMonthStart(date: string, index: number): boolean {
  if (index === 0) return false
  const prev = visibleDays.value[index - 1]
  return parseISO(prev.date).getMonth() !== parseISO(date).getMonth()
}

function patch(day: PlanningDay, changes: Partial<PlanningDay>) {
  store.updateDay({ ...day, ...changes })
}

function toInt(v: string): number {
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}
</script>

<template>
  <div class="page-head">
    <h1>Planlægning</h1>
    <p>
      Hver dato har sin egen række. Sæt flueben ved skolernes behov og udfyld
      antal billetter på de dage, hvor der køres. Fælles kørsel, busudgift,
      indtægt og overskud beregnes automatisk.
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
    v-if="totals.hdMissing || totals.eeMissing"
    class="banner warn"
  >
    Mangler overførsel:
    <strong v-if="totals.hdMissing">{{ totals.hdMissing }} HD-dag(e)</strong>
    <span v-if="totals.hdMissing && totals.eeMissing"> og </span>
    <strong v-if="totals.eeMissing">{{ totals.eeMissing }} EE-dag(e)</strong>
    har solgte billetter uden registreret overførselsdato.
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
        <tr
          v-for="(day, i) in visibleDays"
          :key="day.date"
          :class="{
            weekend: isWeekend(day.date),
            shared: calcDay(day, store.settings.value).shared,
            'month-start': isMonthStart(day.date, i),
          }"
        >
          <td>{{ dateShort(day.date) }}</td>
          <td>{{ weekdayShort(day.date) }}</td>
          <td class="num dim">{{ isoWeek(day.date) }}</td>
          <td>
            <input
              type="checkbox"
              class="chk"
              :checked="day.he_need"
              @change="patch(day, { he_need: ($event.target as HTMLInputElement).checked })"
            />
          </td>
          <td>
            <input
              type="checkbox"
              class="chk"
              :checked="day.hd_need"
              @change="patch(day, { hd_need: ($event.target as HTMLInputElement).checked })"
            />
          </td>
          <td>
            <input
              type="checkbox"
              class="chk"
              :checked="day.ee_need"
              @change="patch(day, { ee_need: ($event.target as HTMLInputElement).checked })"
            />
          </td>
          <td>
            <span
              v-if="calcDay(day, store.settings.value).shared"
              class="pill shared"
              >Ja</span
            >
            <span v-else class="dim">–</span>
          </td>
          <td class="num">
            <input
              type="number"
              class="cell-input"
              min="0"
              :value="day.he_tickets || ''"
              placeholder="0"
              @change="patch(day, { he_tickets: toInt(($event.target as HTMLInputElement).value) })"
            />
          </td>
          <td class="num">
            <input
              type="number"
              class="cell-input"
              min="0"
              :value="day.hd_tickets || ''"
              placeholder="0"
              @change="patch(day, { hd_tickets: toInt(($event.target as HTMLInputElement).value) })"
            />
          </td>
          <td class="num">
            <input
              type="number"
              class="cell-input"
              min="0"
              :value="day.ee_tickets || ''"
              placeholder="0"
              @change="patch(day, { ee_tickets: toInt(($event.target as HTMLInputElement).value) })"
            />
          </td>
          <td class="num">{{ money(calcDay(day, store.settings.value).busExpense) }}</td>
          <td class="num">{{ money(calcDay(day, store.settings.value).income) }}</td>
          <td
            class="num"
            :class="calcDay(day, store.settings.value).profit >= 0 ? '' : 'neg'"
          >
            {{ money(calcDay(day, store.settings.value).profit) }}
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px">
              <input
                type="date"
                class="cell-date"
                :value="day.hd_transferred_date || ''"
                @change="patch(day, { hd_transferred_date: ($event.target as HTMLInputElement).value || null })"
              />
              <span v-if="calcDay(day, store.settings.value).hdMissing" class="pill missing">!</span>
            </div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px">
              <input
                type="date"
                class="cell-date"
                :value="day.ee_transferred_date || ''"
                @change="patch(day, { ee_transferred_date: ($event.target as HTMLInputElement).value || null })"
              />
              <span v-if="calcDay(day, store.settings.value).eeMissing" class="pill missing">!</span>
            </div>
          </td>
          <td>
            <input
              type="text"
              class="cell-note"
              :value="day.note"
              placeholder="…"
              @change="patch(day, { note: ($event.target as HTMLInputElement).value })"
            />
          </td>
        </tr>
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
