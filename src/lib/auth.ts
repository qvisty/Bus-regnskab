import { ref, readonly } from 'vue'

// SHA-256 af den fælles adgangskode. Koden står dermed ikke i klartekst i
// hverken kildekode eller det byggede bundle. Bemærk: låsen er klient-side
// og holder uvedkommende ude af appen – den er ikke et egentligt
// sikkerhedsværn mod tekniske angreb.
const ACCESS_HASH =
  'c3b22c1966b1b232ac3cc24f87e55096fd525f7cdd63fabba73869070f9e5346'

const LS_KEY = 'bus-regnskab-adgang-v1'

const unlockedRef = ref(localStorage.getItem(LS_KEY) === ACCESS_HASH)

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** Er brugeren låst op i denne browser? */
export const unlocked = readonly(unlockedRef)

/** Prøv at låse op med en kode. Adgangen huskes i denne browser. */
export async function tryUnlock(code: string): Promise<boolean> {
  const hash = await sha256Hex(code.trim())
  if (hash !== ACCESS_HASH) return false
  localStorage.setItem(LS_KEY, hash)
  unlockedRef.value = true
  return true
}

/** Lås appen igen (log ud) i denne browser. */
export function lock() {
  localStorage.removeItem(LS_KEY)
  unlockedRef.value = false
}
