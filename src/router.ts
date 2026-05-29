import { createRouter, createWebHistory } from 'vue-router'
import PlanningView from '@/views/PlanningView.vue'
import SettlementView from '@/views/SettlementView.vue'
import AgreementsView from '@/views/AgreementsView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'planlaegning', component: PlanningView },
    { path: '/afregning', name: 'afregning', component: SettlementView },
    { path: '/aftaler', name: 'aftaler', component: AgreementsView },
  ],
})
