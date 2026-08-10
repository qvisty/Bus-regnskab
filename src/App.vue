<script setup lang="ts">
import { watch } from 'vue'
import { useStore } from '@/store'
import { unlocked, lock } from '@/lib/auth'
import NavBar from '@/components/NavBar.vue'
import LoginGate from '@/components/LoginGate.vue'

const store = useStore()

// Indlæs først data når der er låst op (og igen efter nyt login).
watch(
  unlocked,
  (u) => {
    if (u && !store.state.loaded) store.load()
  },
  { immediate: true },
)

function resetDemo() {
  if (
    confirm(
      'Nulstil demo-data til udgangspunktet? Dine ændringer i denne browser slettes.',
    )
  ) {
    store.resetDemo()
  }
}
</script>

<template>
  <LoginGate v-if="!unlocked" />
  <template v-else>
    <NavBar :mode="store.state.mode" :demo="store.isDemo" @lock="lock" />
    <main class="app-shell">
      <div v-if="store.isDemo" class="banner info demo-banner">
        <span>
          <strong>Demo-udgave.</strong> Data gemmes kun i din egen browser og
          deles ikke. Prøv frit – du kan altid nulstille.
        </span>
        <button class="btn sm" @click="resetDemo">Nulstil demo-data</button>
      </div>
      <div v-if="store.state.error" class="banner warn">
        Kunne ikke indlæse data: {{ store.state.error }}
      </div>
      <div v-if="store.state.loading && !store.state.loaded" class="banner info">
        Indlæser data …
      </div>
      <router-view v-if="store.state.loaded" />
    </main>
  </template>
</template>

<style scoped>
.demo-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
