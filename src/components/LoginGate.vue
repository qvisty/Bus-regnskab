<script setup lang="ts">
import { ref } from 'vue'
import { tryUnlock } from '@/lib/auth'

const code = ref('')
const error = ref(false)
const busy = ref(false)

async function submit() {
  if (busy.value) return
  busy.value = true
  error.value = false
  const ok = await tryUnlock(code.value)
  busy.value = false
  if (!ok) {
    error.value = true
    code.value = ''
  }
}
</script>

<template>
  <div class="gate">
    <form class="card gate-card" @submit.prevent="submit">
      <div class="brand" style="justify-content: center">
        <span class="dot"></span>
        Fælles buskørsel
      </div>
      <p class="muted" style="text-align: center; margin: 10px 0 16px">
        Planlægning og afregning af fælles weekendkørsel for HE, HD og EE.
        Indtast adgangskoden for at fortsætte.
      </p>
      <label class="field" style="width: 100%">
        Adgangskode
        <input
          type="password"
          v-model="code"
          autocomplete="current-password"
          autofocus
          required
        />
      </label>
      <p v-if="error" class="gate-error">Forkert adgangskode – prøv igen.</p>
      <button class="btn" type="submit" :disabled="busy" style="width: 100%">
        Lås op
      </button>
    </form>
  </div>
</template>

<style scoped>
.gate {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.gate-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.gate-error {
  color: var(--danger);
  font-size: 13px;
  margin: 0;
}
</style>
