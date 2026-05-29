<script setup lang="ts">
import { onMounted } from 'vue'
import { useStore } from '@/store'
import NavBar from '@/components/NavBar.vue'

const store = useStore()

onMounted(() => {
  store.load()
})

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
  <NavBar :mode="store.state.mode" :demo="store.isDemo" />
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

<style scoped>
.demo-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
