import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// Base sættes til './' i demo-build (GitHub Pages under et underbibliotek),
// ellers '/' (Vercel-rod). Styres via VITE_DEMO.
const isDemo = process.env.VITE_DEMO === 'true'

export default defineConfig({
  base: isDemo ? './' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
