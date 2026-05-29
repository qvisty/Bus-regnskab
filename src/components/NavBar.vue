<script setup lang="ts">
defineProps<{ mode: 'supabase' | 'local'; demo: boolean }>()
</script>

<template>
  <header class="navbar">
    <div class="navbar-inner">
      <div class="brand">
        <span class="dot"></span>
        Fælles buskørsel
      </div>
      <nav class="nav-links">
        <router-link to="/">Oversigt</router-link>
        <router-link to="/planlaegning">Planlægning</router-link>
        <router-link to="/afregning">Afregning</router-link>
        <router-link to="/statistik">Statistik</router-link>
        <router-link to="/aftaler">Aftaler</router-link>
      </nav>
      <span class="nav-spacer"></span>
      <span
        class="mode-badge"
        :class="{ live: mode === 'supabase' }"
      >
        <template v-if="demo">◐ Demo (lokal kopi)</template>
        <template v-else-if="mode === 'supabase'">● Delt (Supabase)</template>
        <template v-else>○ Lokal (denne browser)</template>
      </span>
    </div>
  </header>
</template>
