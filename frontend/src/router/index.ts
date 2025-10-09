import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'WelcomePage',
    component: () => import('../views/welcomePage.vue')
  },
  {
    path: '/models',
    name: 'ModelsPage',
    component: () => import('../views/ModelsPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router