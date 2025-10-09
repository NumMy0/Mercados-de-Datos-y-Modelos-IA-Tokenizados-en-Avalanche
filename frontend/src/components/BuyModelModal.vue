<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getModelById } from '../composables/blockchain'
import LicensePlanCard from './LicensePlanCard.vue'

interface ModelDetails {
  id: number
  name: string
  description: string
  owner: string
  category: string
  price: string
  forSale: boolean
}

interface LicensePlan {
  id: number
  name: string
  price: string
  duration: number
  active: boolean
}

const props = defineProps<{
  isOpen: boolean
  model: ModelDetails | null
}>()

const emit = defineEmits<{
  close: []
  buyModel: []
  buyLicense: [planId: number]
}>()

const isProcessing = ref(false)
const activeTab = ref<'model' | 'licenses'>('model')
const licensePlans = ref<LicensePlan[]>([])
const loadingPlans = ref(false)
const fullModelData = ref<any>(null)

const truncatedOwner = computed(() => {
  if (!props.model?.owner) return ''
  return `${props.model.owner.slice(0, 6)}...${props.model.owner.slice(-4)}`
})

const hasLicenses = computed(() => {
  return licensePlans.value.length > 0
})

const canBuyModel = computed(() => {
  return props.model?.forSale === true
})

// Cargar datos completos del modelo y sus planes
const loadModelData = async () => {
  if (!props.model?.id) return
  
  loadingPlans.value = true
  try {
    const data = await getModelById(props.model.id)
    fullModelData.value = data
    
    // Cargar planes de licencia
    if (data.plans && Array.isArray(data.plans)) {
      licensePlans.value = data.plans
        .filter((p: any) => p.active) // Solo planes activos
        .map((p: any, index: number) => ({
          id: index + 1,
          name: p.name || `Plan ${index + 1}`,
          price: p.price || '0',
          duration: p.duration || 30,
          active: p.active !== false
        }))
    } else {
      licensePlans.value = []
    }
    
    // Determinar pestaña inicial
    if (canBuyModel.value) {
      activeTab.value = 'model'
    } else if (hasLicenses.value) {
      activeTab.value = 'licenses'
    }
  } catch (err) {
    console.error('Error cargando datos del modelo:', err)
    licensePlans.value = []
  } finally {
    loadingPlans.value = false
  }
}

// Cargar datos cuando se abre el modal
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadModelData()
  } else {
    // Reset al cerrar
    licensePlans.value = []
    fullModelData.value = null
    activeTab.value = 'model'
  }
}, { immediate: true })

const handleBuyModel = async () => {
  isProcessing.value = true
  try {
    emit('buyModel')
  } finally {
    isProcessing.value = false
  }
}

const handleBuyLicense = async (planId: number) => {
  isProcessing.value = true
  try {
    emit('buyLicense', planId)
  } finally {
    isProcessing.value = false
  }
}

const handleClose = () => {
  if (!isProcessing.value) {
    emit('close')
  }
}
</script>

<template>
  <Transition name="modal">
    <div 
      v-if="isOpen && model"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      @click.self="handleClose"
    >
      <div class="w-full max-w-2xl bg-white app-dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 class="text-white font-bold text-2xl">Opciones de Compra</h2>
            <p class="text-blue-100 text-sm mt-1">{{ model.name }}</p>
          </div>
          <button 
            @click="handleClose"
            :disabled="isProcessing"
            class="text-white hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Tabs -->
        <div v-if="canBuyModel" class="border-b border-gray-200 app-dark:border-gray-700 px-6">
          <div class="flex gap-4">
            <button 
              v-if="canBuyModel"
              @click="activeTab = 'model'"
              :class="[
                'px-4 py-3 font-medium transition-colors border-b-2',
                activeTab === 'model' 
                  ? 'border-blue-500 text-blue-600 app-dark:text-blue-400' 
                  : 'border-transparent text-gray-500 app-dark:text-gray-400 hover:text-gray-700 app-dark:hover:text-gray-300'
              ]"
            >
              Comprar Modelo
            </button>
            <button 
              v-if="hasLicenses"
              @click="activeTab = 'licenses'"
              :class="[
                'px-4 py-3 font-medium transition-colors border-b-2',
                activeTab === 'licenses' 
                  ? 'border-blue-500 text-blue-600 app-dark:text-blue-400' 
                  : 'border-transparent text-gray-500 app-dark:text-gray-400 hover:text-gray-700 app-dark:hover:text-gray-300'
              ]"
            >
              Licencias ({{ licensePlans.length }})
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          <!-- Loading State -->
          <div v-if="loadingPlans" class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600 app-dark:text-gray-400">Cargando opciones...</p>
          </div>

          <!-- Model Tab -->
          <div v-else-if="activeTab === 'model'">
            <!-- Model Info -->
            <div class="bg-gray-50 app-dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div>
                <h3 class="text-sm font-semibold text-gray-500 app-dark:text-gray-400 uppercase mb-1">
                  Descripción
                </h3>
                <p class="text-gray-900 app-dark:text-white">{{ model.description }}</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <h3 class="text-sm font-semibold text-gray-500 app-dark:text-gray-400 uppercase mb-1">
                    Categoría
                  </h3>
                  <p class="text-gray-900 app-dark:text-white">{{ model.category }}</p>
                </div>
                <div>
                  <h3 class="text-sm font-semibold text-gray-500 app-dark:text-gray-400 uppercase mb-1">
                    Propietario
                  </h3>
                  <p class="text-gray-900 app-dark:text-white font-mono text-sm">{{ truncatedOwner }}</p>
                </div>
              </div>
            </div>

            <!-- Price Section -->
            <div v-if="canBuyModel" class="bg-gradient-to-br from-green-50 to-green-100 app-dark:from-green-900/20 app-dark:to-green-800/20 border-2 border-green-300 app-dark:border-green-700 rounded-lg p-6">
              <div class="text-center">
                <h3 class="text-lg font-semibold text-green-900 app-dark:text-green-100 mb-2">
                  Precio de Compra
                </h3>
                <div class="text-5xl font-bold text-green-600 app-dark:text-green-400 mb-4">
                  {{ model.price }}
                </div>
                <p class="text-sm text-green-700 app-dark:text-green-300">
                  Al comprar este modelo, obtendrás la propiedad completa del mismo
                </p>
              </div>
            </div>

            <!-- Not for sale -->
            <div v-else class="bg-yellow-50 app-dark:bg-yellow-900/20 border border-yellow-300 app-dark:border-yellow-700 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <svg class="w-6 h-6 text-yellow-600 app-dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <div>
                  <h3 class="text-sm font-semibold text-yellow-900 app-dark:text-yellow-100">
                    Modelo no disponible para compra
                  </h3>
                  <p class="text-sm text-yellow-700 app-dark:text-yellow-300 mt-1">
                    Este modelo actualmente no está en venta{{ hasLicenses ? '. Puedes comprar una licencia de uso en su lugar.' : '.' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Purchase Information -->
            <div v-if="canBuyModel" class="bg-blue-50 app-dark:bg-blue-900/20 border border-blue-200 app-dark:border-blue-800 rounded-lg p-4">
              <h3 class="text-sm font-semibold text-blue-900 app-dark:text-blue-100 mb-2 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Información de Compra
              </h3>
              <ul class="space-y-2 text-sm text-blue-800 app-dark:text-blue-200">
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Obtendrás la propiedad completa del modelo
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Podrás crear planes de licencia y venderlos
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Podrás transferir o revender el modelo
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  La transacción es segura y se registra en la blockchain
                </li>
              </ul>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3">
              <button
                @click="handleClose"
                :disabled="isProcessing"
                class="flex-1 px-6 py-3 bg-gray-200 app-dark:bg-gray-700 text-gray-900 app-dark:text-white rounded-lg font-medium hover:bg-gray-300 app-dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                v-if="canBuyModel"
                @click="handleBuyModel"
                :disabled="isProcessing"
                class="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg v-if="isProcessing" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ isProcessing ? 'Procesando...' : `Comprar por ${model.price}` }}</span>
              </button>
            </div>
          </div>

          <!-- Licenses Tab -->
          <div v-else-if="activeTab === 'licenses'">
            <!-- Licenses Info -->
            <div class="bg-blue-50 app-dark:bg-blue-900/20 border border-blue-200 app-dark:border-blue-800 rounded-lg p-4 mb-4">
              <h3 class="text-sm font-semibold text-blue-900 app-dark:text-blue-100 mb-2 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Sobre las Licencias
              </h3>
              <ul class="space-y-2 text-sm text-blue-800 app-dark:text-blue-200">
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Acceso temporal al modelo por la duración especificada
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Puedes usar el modelo sin ser propietario
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Más económico que comprar el modelo completo
                </li>
                <li class="flex items-start gap-2">
                  <svg class="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  Renovable al expirar
                </li>
              </ul>
            </div>

            <!-- License Plans List -->
            <div class="space-y-3">
              <h3 class="font-bold text-gray-900 app-dark:text-white text-lg">
                Planes Disponibles
              </h3>
              
              <div v-if="licensePlans.length === 0" class="text-center py-8 bg-gray-50 app-dark:bg-gray-800 rounded-lg">
                <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <p class="text-gray-500 app-dark:text-gray-400">
                  No hay planes de licencia disponibles para este modelo
                </p>
              </div>
              
              <LicensePlanCard
                v-for="plan in licensePlans"
                :key="plan.id || plan.name"
                :plan="plan"
                :is-owner="false"
                @buy="handleBuyLicense"
              />
            </div>
          </div>

          <!-- No options available -->
          <div v-else-if="!loadingPlans && !canBuyModel && !hasLicenses" class="text-center py-12">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h3 class="text-lg font-semibold text-gray-900 app-dark:text-gray-100 mb-2">
              No hay opciones de compra disponibles
            </h3>
            <p class="text-gray-600 app-dark:text-gray-400">
              Este modelo no está en venta ni tiene planes de licencia activos
            </p>
            <button
              @click="handleClose"
              class="mt-4 px-6 py-2 bg-gray-200 app-dark:bg-gray-700 text-gray-900 app-dark:text-white rounded-lg font-medium hover:bg-gray-300 app-dark:hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Smooth transitions */
* {
  transition-property: background-color, border-color, color, box-shadow;
  transition-duration: 200ms;
  transition-timing-function: ease-in-out;
}
</style>
