import { createRouter, createWebHistory } from 'vue-router'

// Vistas principales
const Dashboard = () => import('@/views/Dashboard.vue')
const Models = () => import('@/views/Models.vue')
const Settings = () => import('@/views/Settings.vue')

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: Dashboard,
    meta: {
      title: 'Dashboard'
    }
  },
  {
    path: '/playground',
    name: 'playground',
    component: Dashboard,
    meta: {
      title: 'Playground'
    }
  },
  {
    path: '/models',
    name: 'models',
    component: Models,
    meta: {
      title: 'Models'
    },
    children: [
      {
        path: 'genesis',
        name: 'models-genesis',
        component: Models,
        meta: { title: 'Genesis' }
      },
      {
        path: 'explorer',
        name: 'models-explorer',
        component: Models,
        meta: { title: 'Explorer' }
      },
      {
        path: 'quantum',
        name: 'models-quantum',
        component: Models,
        meta: { title: 'Quantum' }
      }
    ]
  },
  {
    path: '/settings',
    name: 'settings',
    component: Settings,
    meta: {
      title: 'Settings'
    },
    children: [
      {
        path: 'general',
        name: 'settings-general',
        component: Settings,
        meta: { title: 'General' }
      },
      {
        path: 'team',
        name: 'settings-team',
        component: Settings,
        meta: { title: 'Team' }
      },
      {
        path: 'billing',
        name: 'settings-billing',
        component: Settings,
        meta: { title: 'Billing' }
      },
      {
        path: 'limits',
        name: 'settings-limits',
        component: Settings,
        meta: { title: 'Limits' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router