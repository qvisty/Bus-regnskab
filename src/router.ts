import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import { isDemo } from '@/lib/supabase'
import DashboardView from '@/views/DashboardView.vue'
import PlanningView from '@/views/PlanningView.vue'
import SettlementView from '@/views/SettlementView.vue'
import StatsView from '@/views/StatsView.vue'
import AgreementsView from '@/views/AgreementsView.vue'

// Hash-history i demo-build, så routing virker på GitHub Pages uden
// server-rewrites. Ellers almindelig history (Vercel håndterer rewrites).
const history = isDemo
  ? createWebHashHistory()
  : createWebHistory(import.meta.env.BASE_URL)

export const router = createRouter({
  history,
  routes: [
    { path: '/', name: 'oversigt', component: DashboardView },
    { path: '/planlaegning', name: 'planlaegning', component: PlanningView },
    { path: '/afregning', name: 'afregning', component: SettlementView },
    { path: '/statistik', name: 'statistik', component: StatsView },
    { path: '/aftaler', name: 'aftaler', component: AgreementsView },
  ],
})
