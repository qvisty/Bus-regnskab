<script setup lang="ts">
import { computed } from 'vue'
import type { Bucket } from '@/lib/stats'
import { money } from '@/lib/format'

const props = defineProps<{
  buckets: Bucket[]
  /** 'income-expense' = grupperede udgift/indtægt-søjler, 'profit' = signeret overskud. */
  type: 'income-expense' | 'profit'
}>()

const H = 200 // plot-højde i px
const groupW = 54 // bredde pr. tidsspand
const pad = 28 // plads til labels under/over

const width = computed(() => Math.max(props.buckets.length * groupW, 1))

const maxVal = computed(() => {
  let m = 0
  for (const b of props.buckets) {
    if (props.type === 'profit') m = Math.max(m, Math.abs(b.profit))
    else m = Math.max(m, b.expenses, b.income)
  }
  return m || 1
})

function h(v: number): number {
  return (Math.abs(v) / maxVal.value) * H
}
</script>

<template>
  <div class="chart-scroll">
    <svg
      :width="width"
      :height="H + pad * 2"
      :viewBox="`0 0 ${width} ${H + pad * 2}`"
      role="img"
    >
      <!-- nul-linje (kun for profit-diagram, midt; ellers bund) -->
      <line
        :x1="0"
        :x2="width"
        :y1="type === 'profit' ? pad + H / 2 : pad + H"
        :y2="type === 'profit' ? pad + H / 2 : pad + H"
        stroke="var(--border)"
      />

      <g v-for="(b, i) in buckets" :key="b.key">
        <template v-if="type === 'income-expense'">
          <!-- udgift -->
          <rect
            :x="i * groupW + 10"
            :y="pad + H - h(b.expenses)"
            :width="16"
            :height="h(b.expenses)"
            rx="2"
            fill="var(--danger)"
          >
            <title>{{ b.label }} · Udgift {{ money(b.expenses) }}</title>
          </rect>
          <!-- indtægt -->
          <rect
            :x="i * groupW + 28"
            :y="pad + H - h(b.income)"
            :width="16"
            :height="h(b.income)"
            rx="2"
            fill="var(--ok)"
          >
            <title>{{ b.label }} · Indtægt {{ money(b.income) }}</title>
          </rect>
        </template>

        <template v-else>
          <!-- signeret overskud fra midterlinjen -->
          <rect
            :x="i * groupW + 16"
            :y="b.profit >= 0 ? pad + H / 2 - h(b.profit) : pad + H / 2"
            :width="22"
            :height="h(b.profit)"
            rx="2"
            :fill="b.profit >= 0 ? 'var(--ok)' : 'var(--danger)'"
          >
            <title>{{ b.label }} · Overskud {{ money(b.profit) }}</title>
          </rect>
        </template>

        <!-- label -->
        <text
          :x="i * groupW + groupW / 2"
          :y="H + pad + 16"
          text-anchor="middle"
          class="bar-label"
        >
          {{ b.label }}
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.chart-scroll {
  overflow-x: auto;
  padding-bottom: 4px;
}
.bar-label {
  font-size: 10px;
  fill: var(--text-muted);
}
svg {
  display: block;
}
</style>
