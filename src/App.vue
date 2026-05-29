<script setup lang="ts">
import { onMounted } from 'vue'
import { useStore } from '@/store'
import NavBar from '@/components/NavBar.vue'

const store = useStore()

onMounted(() => {
  store.load()
})
</script>

<template>
  <NavBar :mode="store.state.mode" />
  <main class="app-shell">
    <div v-if="store.state.error" class="banner warn">
      Kunne ikke indlæse data: {{ store.state.error }}
    </div>
    <div v-if="store.state.loading && !store.state.loaded" class="banner info">
      Indlæser data …
    </div>
    <router-view v-if="store.state.loaded" />
  </main>
</template>
