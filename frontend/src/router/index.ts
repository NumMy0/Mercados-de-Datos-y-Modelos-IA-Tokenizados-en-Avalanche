import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'WelcomePage',
    component: () => import('../views/welcomePage.vue'),
    meta: { transition: 'fade' }
  },
  {
    path: '/models',
    name: 'ModelsPage',
    component: () => import('../views/ModelsPage.vue'),
    meta: { transition: 'page' }
  },
  {
    path: '/profile',
    name: 'ProfilePage',
    component: () => import('../views/ProfilePage.vue'),
    meta: { transition: 'page' }
  }, 
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
    meta: { transition: 'fade' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router