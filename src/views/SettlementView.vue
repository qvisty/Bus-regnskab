<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/store'
import { calcPeriod } from '@/lib/calc'
import { money, dateLabel, dateShort } from '@/lib/format'

const store = useStore()
const today = new Date().toISOString().slice(0, 10)

const results = computed(() =>
  store.periods.value.map((p) => {
    const result = calcPeriod(p, store.days.value, store.settings.value)
    // Kontoudtog pr. skole: hver bærer "perSchool"; HD/EE har evt. overført noget.
    const rows = [
      {
        school: 'HE',
        share: result.perSchool,
        transferred: result.perSchool, // HE bærer/betaler selv sin andel
        remaining: 0,
        self: true,
      },
      {
        school: 'HD',
        share: result.perSchool,
        transferred: result.hdTransferred,
        remaining: result.hdSettles,
        self: false,
      },
      {
        school: 'EE',
        share: result.perSchool,
        transferred: result.eeTransferred,
        remaining: result.eeSettles,
        self: false,
      },
    ]
    return { period: p, result, rows }
  }),
)

function toggleSettled(id: string, settled: boolean) {
  store.setPeriodSettled(id, settled ? today : null)
}
</script>

<template>
  <div class="page-head">
    <h1>Afregning pr. periode</h1>
    <p>
      Alt beregnes automatisk fra Planlægning. Den samlede pris (udgifter −
      indtægter) deles ligeligt mellem de tre skoler, og det, HD og EE allerede
      har overført løbende, udledes af overførselsdatoerne på Planlægning. Ved
      periodeslut afregnes resten, så regnskabet går i nul.
    </p>
  </div>

  <div class="settle-grid">
    <div
      v-for="{ period, result, rows } in results"
      :key="period.id"
      class="card settle-card"
      :class="{ settled: !!period.settled_at }"
    >
      <h3>
        {{ period.name }}
        <span class="dates">
          {{ dateLabel(period.start_date) }} – {{ dateLabel(period.end_date) }}
        </span>
      </h3>

      <div v-if="period.settled_at" class="settled-badge">
        ✓ Afregnet d. {{ dateShort(period.settled_at) }}
      </div>

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

      <!-- Kontoudtog pr. skole -->
      <table class="ledger">
        <thead>
          <tr>
            <th>Skole</th>
            <th class="num">Andel</th>
            <th class="num">Overført</th>
            <th class="num">Mangler</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.school">
            <td><span class="pill" :class="r.school.toLowerCase()">{{ r.school }}</span></td>
            <td class="num">{{ money(r.share) }}</td>
            <td class="num">
              <span v-if="r.self" class="muted" style="font-size: 12px">bærer selv</span>
              <template v-else>{{ money(r.transferred) }}</template>
            </td>
            <td class="num">
              <template v-if="r.self"><span class="dim">–</span></template>
              <template v-else-if="r.remaining === 0"><span class="dim">0</span></template>
              <template v-else>
                <strong :class="r.remaining > 0 ? 'neg' : 'pos'">
                  {{ money(r.remaining) }}
                </strong>
                <span class="muted" style="font-size: 11px">
                  {{ r.remaining > 0 ? `→ HE` : `← HE` }}
                </span>
              </template>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="zero-confirm">
        <strong>✓ Går i nul:</strong> når overførslerne er gennemført, har alle
        tre skoler båret {{ money(result.perSchool) }}.
      </div>

      <div class="settle-actions">
        <button
          v-if="!period.settled_at"
          class="btn primary sm"
          @click="toggleSettled(period.id, true)"
        >
          Markér som afregnet
        </button>
        <button
          v-else
          class="btn sm"
          @click="toggleSettled(period.id, false)"
        >
          Genåbn periode
        </button>
      </div>
    </div>
  </div>

  <div class="banner info" style="margin-top: 20px">
    "Overført" tæller hver fælles dag, hvor skolen har en registreret
    overførselsdato på Planlægning. Negativ samlet pris = overskud, og så
    overfører HE i stedet til skolerne (pilen vender: ← HE).
  </div>
</template>

<style scoped>
.settle-card.settled {
  border-color: var(--ok);
  background: linear-gradient(0deg, var(--ok-bg), var(--surface) 60%);
}
.settled-badge {
  display: inline-block;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ok);
  background: var(--ok-bg);
  border-radius: 999px;
  padding: 3px 10px;
  margin-bottom: 10px;
}
.ledger {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0 8px;
  font-size: 13px;
}
.ledger th,
.ledger td {
  padding: 6px 6px;
  border-bottom: 1px solid var(--border);
  text-align: left;
  white-space: nowrap;
}
.ledger th.num,
.ledger td.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.ledger thead th {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--text-muted);
}
.zero-confirm {
  background: var(--ok-bg);
  color: var(--text);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13.5px;
  margin-top: 4px;
}
.settle-actions {
  margin-top: 12px;
}
</style>
