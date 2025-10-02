import { createRouter, createWebHistory } from 'vue-router'
import ExpensePage from '../views/ExpensePage.vue'
import StatisticsPage from '../views/StatisticsPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/expense'
    },
    {
      path: '/expense',
      name: 'expense',
      component: ExpensePage
    },
    {
      path: '/statistics',
      name: 'statistics',
      component: StatisticsPage
    }
  ]
})

export default router

