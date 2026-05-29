<script setup lang="ts">
import { computed } from 'vue'
import type { PlanningDay, Settings } from '@/types'
import { calcDay } from '@/lib/calc'
import {
  weekdayShort,
  isoWeek,
  isWeekend,
  money,
  dateShort,
} from '@/lib/format'

const props = defineProps<{
  day: PlanningDay
  settings: Settings
  monthStart: boolean
}>()

const emit = defineEmits<{ update: [day: PlanningDay] }>()

// Beregnes én gang pr. række (og kun når dagen/satser ændrer sig).
const c = computed(() => calcDay(props.day, props.settings))

function patch(changes: Partial<PlanningDay>) {
  emit('update', { ...props.day, ...changes })
}

function toInt(v: string): number {
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n > 0 ? n : 0
}
</script>

<template>
  <tr
    :class="{
      weekend: isWeekend(day.date),
      shared: c.shared,
      'month-start': monthStart,
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
        @change="patch({ he_need: ($event.target as HTMLInputElement).checked })"
      />
    </td>
    <td>
      <input
        type="checkbox"
        class="chk"
        :checked="day.hd_need"
        @change="patch({ hd_need: ($event.target as HTMLInputElement).checked })"
      />
    </td>
    <td>
      <input
        type="checkbox"
        class="chk"
        :checked="day.ee_need"
        @change="patch({ ee_need: ($event.target as HTMLInputElement).checked })"
      />
    </td>
    <td>
      <span v-if="c.shared" class="pill shared">Ja</span>
      <span v-else class="dim">–</span>
    </td>

    <!-- Billetter, økonomi og overførsler vises kun ved fælles kørsel. -->
    <template v-if="c.shared">
      <td class="num">
        <input
          type="number"
          class="cell-input"
          min="0"
          :value="day.he_tickets || ''"
          placeholder="0"
          @change="patch({ he_tickets: toInt(($event.target as HTMLInputElement).value) })"
        />
      </td>
      <td class="num">
        <input
          type="number"
          class="cell-input"
          min="0"
          :value="day.hd_tickets || ''"
          placeholder="0"
          @change="patch({ hd_tickets: toInt(($event.target as HTMLInputElement).value) })"
        />
      </td>
      <td class="num">
        <input
          type="number"
          class="cell-input"
          min="0"
          :value="day.ee_tickets || ''"
          placeholder="0"
          @change="patch({ ee_tickets: toInt(($event.target as HTMLInputElement).value) })"
        />
      </td>
      <td class="num">{{ money(c.busExpense) }}</td>
      <td class="num">{{ money(c.income) }}</td>
      <td class="num" :class="c.profit >= 0 ? '' : 'neg'">{{ money(c.profit) }}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 6px">
          <input
            type="date"
            class="cell-date"
            :value="day.hd_transferred_date || ''"
            @change="patch({ hd_transferred_date: ($event.target as HTMLInputElement).value || null })"
          />
          <span v-if="c.hdMissing" class="pill missing">!</span>
        </div>
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 6px">
          <input
            type="date"
            class="cell-date"
            :value="day.ee_transferred_date || ''"
            @change="patch({ ee_transferred_date: ($event.target as HTMLInputElement).value || null })"
          />
          <span v-if="c.eeMissing" class="pill missing">!</span>
        </div>
      </td>
    </template>

    <!-- Ikke fælles kørsel: intet at registrere eller medregne. -->
    <template v-else>
      <td class="num dim">–</td>
      <td class="num dim">–</td>
      <td class="num dim">–</td>
      <td class="num dim">–</td>
      <td class="num dim">–</td>
      <td class="num dim">–</td>
      <td class="dim">–</td>
      <td class="dim">–</td>
    </template>

    <td>
      <input
        type="text"
        class="cell-note"
        :value="day.note"
        placeholder="…"
        @change="patch({ note: ($event.target as HTMLInputElement).value })"
      />
    </td>
  </tr>
</template>
