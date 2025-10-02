import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from '../components/MainLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: MainLayout
    },
    {
      path: '/:pathMatch(.*)*',
      component: MainLayout
    }
  ]
})

export default router

