<script setup lang="ts">
import { money } from '@/lib/format'

const examples = [
  { label: 'Eksempel 1 – underskud', expenses: 180000, income: 150000 },
  { label: 'Eksempel 2 – overskud', expenses: 180000, income: 195000 },
].map((e) => ({
  ...e,
  total: e.expenses - e.income,
  perSchool: (e.expenses - e.income) / 3,
}))
</script>

<template>
  <div class="page-head">
    <h1>Aftaler – fælles weekendkørsel</h1>
    <p>Aftale om fælles buskørsel mellem skolerne HE, HD og EE.</p>
  </div>

  <div class="card agreement">
    <h3>1. Booking og betaling</h3>
    <p>HE booker og betaler busserne for al fælles weekendkørsel.</p>

    <h3>2. Løbende overførsler</h3>
    <p>
      Hver mandag overfører HD og EE deres andel for den forgangne weekends
      kørsler til HE.
    </p>

    <h3>3. Opkrævning hos eleverne</h3>
    <p>
      Hver skole opkræver selv betaling hos sine egne elever. Prisen pr. billet
      er 65 kr.
    </p>

    <h3>4. Afregning ved periodeafslutning</h3>
    <p>Ved afslutning af hver periode afregnes der samlet.</p>
    <p>
      Perioderne er afslutning af kalenderår og afslutning af skoleår.
    </p>

    <h3>5. Afregningsmodel</h3>
    <p>Udgifter minus indtægter giver den samlede pris for skolerne.</p>
    <p>Prisen deles ligeligt mellem de tre skoler.</p>
    <p>
      Hvis resultatet er underskud, dækker skolerne i fællesskab med ens beløb.
    </p>

    <div class="table-wrap example-table">
      <table>
        <thead>
          <tr>
            <th>Eksempel</th>
            <th v-for="e in examples" :key="e.label" class="num">
              {{ e.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Udgifter</td>
            <td v-for="e in examples" :key="e.label" class="num">
              {{ money(e.expenses) }}
            </td>
          </tr>
          <tr>
            <td>Indtægter</td>
            <td v-for="e in examples" :key="e.label" class="num">
              {{ money(e.income) }}
            </td>
          </tr>
          <tr>
            <td>Samlet pris (udgifter − indtægter)</td>
            <td
              v-for="e in examples"
              :key="e.label"
              class="num"
              :class="e.total > 0 ? 'neg' : 'pos'"
            >
              {{ money(e.total) }}
            </td>
          </tr>
          <tr>
            <td>Pris pr. skole (delt med 3)</td>
            <td v-for="e in examples" :key="e.label" class="num">
              {{ money(e.perSchool) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p style="margin-top: 14px">
      <strong>Eksempel 1:</strong> HD overfører 10.000 kr. til HE, og EE
      overfører 10.000 kr. til HE.
    </p>
    <p>
      <strong>Eksempel 2:</strong> HE overfører 5.000 kr. til HD, og HE
      overfører 5.000 kr. til EE.
    </p>

    <h3>Bemærkning om beregningen</h3>
    <p>
      I afregningen er indtægten lig med antal solgte billetter gange prisen pr.
      billet. Udgiften er prisen pr. kørsel for de datoer, hvor der køres. Begge
      satser står øverst i fanen Planlægning og kan rettes ét sted.
    </p>
  </div>
</template>
