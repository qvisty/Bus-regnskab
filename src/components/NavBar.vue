<script setup lang="ts">
defineProps<{ mode: 'supabase' | 'local' }>()
</script>

<template>
  <header class="navbar">
    <div class="navbar-inner">
      <div class="brand">
        <span class="dot"></span>
        Fælles buskørsel
      </div>
      <nav class="nav-links">
        <router-link to="/">Planlægning</router-link>
        <router-link to="/afregning">Afregning</router-link>
        <router-link to="/aftaler">Aftaler</router-link>
      </nav>
      <span class="nav-spacer"></span>
      <span class="mode-badge" :class="{ live: mode === 'supabase' }">
        {{ mode === 'supabase' ? '● Delt (Supabase)' : '○ Lokal (denne browser)' }}
      </span>
    </div>
  </header>
</template>
