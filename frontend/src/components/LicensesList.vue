<!--
  Componente: LicensesList
  
  RESPONSABILIDAD ÚNICA: Renderizar lista de licencias del usuario
  
  Proporciona:
  - Loading state (spinner)
  - Empty state (sin licencias)
  - Lista de licencias con información detallada
  - Acciones (ver modelo, renovar)
  
  Props:
  - licenses: Array de licencias del usuario
  - loading: Boolean indicando si está cargando
  
  Events:
  - view-model: Emitido cuando se hace click en "Ver Modelo" { modelId }
  - renew-license: Emitido cuando se hace click en "Renovar Licencia" { modelId, licenseId }
-->

<script setup lang="ts">
import type { UserLicense } from '../composables/useUserProfile'

// ========================================
// PROPS
// ========================================

defineProps<{
  licenses: UserLicense[]
  loading: boolean
}>()

// ========================================
// EVENTS
// ========================================

const emit = defineEmits<{
  'view-model': [modelId: number]
  'renew-license': [payload: { modelId: number; licenseId: string }]
}>()

// ========================================
// HANDLERS
// ========================================

function handleViewModel(modelId: number) {
  emit('view-model', modelId)
}

function handleRenewLicense(license: UserLicense) {
  emit('renew-license', {
    modelId: license.modelId,
    licenseId: license.id
  })
}
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p class="text-gray-600 app-dark:text-gray-400">Cargando tus licencias...</p>
    </div>

    <!-- Empty State -->
    <div 
      v-else-if="licenses.length === 0" 
      class="text-center py-12 bg-white app-dark:bg-gray-800 rounded-xl border border-gray-200 app-dark:border-gray-700"
    >
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <h3 class="text-lg font-semibold text-gray-900 app-dark:text-gray-100 mb-2">
        No tienes licencias
      </h3>
      <p class="text-gray-600 app-dark:text-gray-400 mb-4">
        Compra una licencia para acceder a modelos
      </p>
      <button
        @click="$router.push('/models')"
        class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        Ver Modelos Disponibles
      </button>
    </div>

    <!-- Licenses List -->
    <div v-else class="space-y-4">
      <div
        v-for="(license, index) in licenses"
        :key="license.id"
        class="bg-white app-dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 app-dark:border-gray-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
        v-motion
        :initial="{ opacity: 0, y: 50 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 500, ease: 'easeOut', delay: index * 100 } }"
      >
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <!-- License Info -->
          <div class="flex-1">
            <!-- Header con nombre y badge de estado -->
            <div class="flex items-center gap-3 mb-2">
              <h3 class="text-lg font-semibold text-gray-900 app-dark:text-gray-100">
                {{ license.modelName }}
              </h3>
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold',
                  license.isActive
                    ? 'bg-green-100 text-green-700 app-dark:bg-green-900/30 app-dark:text-green-400'
                    : 'bg-red-100 text-red-700 app-dark:bg-red-900/30 app-dark:text-red-400'
                ]"
              >
                {{ license.isActive ? 'Activa' : 'Expirada' }}
              </span>
            </div>
            
            <!-- Plan name -->
            <p class="text-sm text-gray-600 app-dark:text-gray-400 mb-3">
              Plan: <span class="font-medium">{{ license.planName || 'Estándar' }}</span>
            </p>

            <!-- Información de expiración -->
            <div class="space-y-1">
              <p class="text-sm text-gray-700 app-dark:text-gray-300">
                Expira: <span class="font-medium">{{ license.expiryDate }}</span>
              </p>
              
              <div class="flex items-center gap-2">
                <p class="text-sm text-gray-600 app-dark:text-gray-400">
                  Días restantes:
                </p>
                <span 
                  :class="[
                    'font-semibold text-sm',
                    (license.daysLeft ?? 0) > 7 
                      ? 'text-green-600 app-dark:text-green-400'
                      : (license.daysLeft ?? 0) > 3
                      ? 'text-yellow-600 app-dark:text-yellow-400'
                      : 'text-red-600 app-dark:text-red-400'
                  ]"
                >
                  {{ license.daysLeft ?? 0 }}
                </span>
              </div>

              <!-- Barra de progreso visual -->
              <div class="mt-2">
                <div class="h-1.5 bg-gray-200 app-dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    :class="[
                      'h-full transition-all duration-300',
                      (license.daysLeft ?? 0) > 7 
                        ? 'bg-green-500'
                        : (license.daysLeft ?? 0) > 3
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    ]"
                    :style="{ width: `${Math.min(100, ((license.daysLeft ?? 0) / 30) * 100)}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-2">
            <button
              @click="handleViewModel(license.modelId)"
              class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium whitespace-nowrap transform hover:scale-105 duration-200"
              v-motion
              :initial="{ opacity: 0, scale: 0.9 }"
              :enter="{ opacity: 1, scale: 1, transition: { duration: 300, ease: 'easeOut' } }"
            >
              Ver Modelo
            </button>
            <button
              v-if="!license.isActive || (license.daysLeft ?? 0) < 7"
              @click="handleRenewLicense(license)"
              :class="[
                'px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium whitespace-nowrap transform hover:scale-105',
                license.isActive
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-yellow-200 hover:shadow-yellow-300'
                  : 'bg-green-500 text-white hover:bg-green-600 shadow-green-200 hover:shadow-green-300'
              ]"
              v-motion
              :initial="{ opacity: 0, y: 20 }"
              :enter="{ opacity: 1, y: 0, transition: { duration: 400, ease: 'easeOut', delay: 100 } }"
            >
              {{ license.isActive ? 'Renovar Pronto' : 'Renovar Licencia' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Smooth transitions */
* {
  transition-property: background-color, border-color, color, box-shadow, width;
  transition-duration: 200ms;
  transition-timing-function: ease-in-out;
}

/* Spinner animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
