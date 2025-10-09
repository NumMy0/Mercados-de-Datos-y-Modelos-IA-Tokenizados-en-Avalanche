<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ModelInfoField from './ModelInfoField.vue'
import LicensePlanCard from './LicensePlanCard.vue'

// Types
interface LicensePlan {
  id: number
  name: string
  price: string
  duration: number
  active: boolean
}

interface ModelDetails {
  id: number
  name: string
  description: string
  owner: string
  category: string
  price: string
  forSale: boolean
  modelType?: string
  features?: string
}

interface LicensePlanFormData {
  name: string
  price: string
  duration: number
}

type TabType = 'details' | 'licenses' | 'sale' | 'transfer'

// Props & Emits
const props = defineProps<{
  isOpen: boolean
  modelId: number | null
  userAddress: string | null
}>()

const emit = defineEmits<{
  close: []
  createLicensePlan: [planData: any]
  setPlanActive: [planId: number, active: boolean]
  buyLicense: [planId: number]
  buyModel: []
  setForSale: [price: string]
  cancelSale: []
  transferModel: [toAddress: string]
}>()

// State - UI
const activeTab = ref<TabType>('details')
const showLicenseForm = ref(false)

// State - Model Data
const modelData = ref<ModelDetails | null>(null)
const licensePlans = ref<LicensePlan[]>([])
const userHasLicense = ref(false)
const licenseExpiry = ref<number>(0)

// State - Forms
const licensePlanForm = ref<LicensePlanFormData>({
  name: '',
  price: '',
  duration: 30
})
const salePrice = ref('')
const transferAddress = ref('')

// Computed Properties
const isOwner = computed(() => 
  props.userAddress && modelData.value?.owner === props.userAddress
)

const licenseExpiryDate = computed(() => {
  if (!licenseExpiry.value) return null
  return new Date(licenseExpiry.value * 1000).toLocaleDateString()
})

const hasForSalePrice = computed(() => 
  modelData.value?.forSale && modelData.value?.price
)

// Data Loading
const loadModelData = () => {
  if (!props.modelId) return
  
  // Simulated getModel() call
  modelData.value = {
    id: props.modelId,
    name: `Model #${props.modelId}`,
    description: 'Advanced AI model for various applications',
    owner: props.userAddress || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    category: 'NLP',
    price: '100',
    forSale: props.modelId === 1,
    modelType: 'Transformer',
    features: 'High accuracy, Fast inference'
  }

  loadLicensePlans()
  loadUserLicenseStatus()
}

const loadLicensePlans = () => {
  // Simulated getPlans() call
  licensePlans.value = [
    { id: 1, name: 'Plan Mensual', price: '10', duration: 30, active: true },
    { id: 2, name: 'Plan Trimestral', price: '25', duration: 90, active: true },
    { id: 3, name: 'Plan Anual', price: '80', duration: 365, active: false }
  ]
}

const loadUserLicenseStatus = () => {
  // Simulated hasActiveLicense() and getLicenseExpiry()
  userHasLicense.value = props.modelId === 1
  licenseExpiry.value = userHasLicense.value ? Math.floor(Date.now() / 1000) + 2592000 : 0
}

// Form Helpers
const resetLicenseForm = () => {
  licensePlanForm.value = { name: '', price: '', duration: 30 }
  showLicenseForm.value = false
}

const resetTransferForm = () => {
  transferAddress.value = ''
}

const resetSaleForm = () => {
  salePrice.value = ''
}

// Validation
const validateLicensePlan = (): boolean => {
  const { name, price, duration } = licensePlanForm.value
  if (!name || !price || !duration) {
    alert('Por favor completa todos los campos')
    return false
  }
  return true
}

const validateTransferAddress = (): boolean => {
  if (!transferAddress.value || !transferAddress.value.startsWith('0x')) {
    alert('Ingresa una dirección válida')
    return false
  }
  return true
}

const validateSalePrice = (): boolean => {
  if (!salePrice.value) {
    alert('Ingresa un precio')
    return false
  }
  return true
}

// Event Handlers - License Plans
const handleCreateLicensePlan = () => {
  if (!validateLicensePlan()) return

  emit('createLicensePlan', {
    modelId: props.modelId,
    ...licensePlanForm.value
  })

  // Update local state (simulate backend response)
  licensePlans.value.push({
    id: licensePlans.value.length + 1,
    name: licensePlanForm.value.name,
    price: licensePlanForm.value.price,
    duration: licensePlanForm.value.duration,
    active: true
  })

  resetLicenseForm()
}

const handleTogglePlanActive = (planId: number, currentActive: boolean) => {
  emit('setPlanActive', planId, !currentActive)
  
  // Update local state
  const plan = licensePlans.value.find(p => p.id === planId)
  if (plan) plan.active = !currentActive
}

const handleBuyLicense = (planId: number) => {
  emit('buyLicense', planId)
  
  // Update local state
  userHasLicense.value = true
  licenseExpiry.value = Math.floor(Date.now() / 1000) + 2592000
}

// Event Handlers - Sale
const handleSetForSale = () => {
  if (!validateSalePrice()) return

  emit('setForSale', salePrice.value)
  
  // Update local state
  if (modelData.value) {
    modelData.value.forSale = true
    modelData.value.price = salePrice.value
  }
  
  resetSaleForm()
}

const handleCancelSale = () => {
  emit('cancelSale')
  
  // Update local state
  if (modelData.value) {
    modelData.value.forSale = false
  }
}

const handleBuyModel = () => {
  emit('buyModel')
  emit('close')
}

// Event Handlers - Transfer
const handleTransfer = () => {
  if (!validateTransferAddress()) return

  emit('transferModel', transferAddress.value)
  resetTransferForm()
  emit('close')
}

// Event Handlers - Modal
const handleClose = () => {
  emit('close')
  resetLicenseForm()
  resetTransferForm()
  resetSaleForm()
}

// Watchers
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadModelData()
    activeTab.value = 'details'
  }
})

// Cargar datos inmediantamente si el modal ya está abierto
watch(() => props.modelId, (newId) => {
  if (props.isOpen && newId !== null) {
    loadModelData()
  }
}, { immediate: true }
)

</script>

<template>
  <Transition name="modal">
    <div 
      v-if="isOpen && modelData"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
      @click.self="handleClose"
    >
      <div class="w-full max-w-4xl bg-white app-dark:bg-gray-900 rounded-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="bg-white app-dark:bg-gray-900 border-b border-gray-200 app-dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 class="text-gray-900 app-dark:text-white font-bold text-2xl">{{ modelData.name }}</h2>
            <p class="text-sm text-gray-500 app-dark:text-gray-400 mt-1">ID: {{ modelData.id }}</p>
          </div>
          <button 
            @click="handleClose"
            class="text-gray-500 hover:text-gray-700 app-dark:text-gray-400 app-dark:hover:text-gray-200 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Tabs -->
        <div class="border-b border-gray-200 app-dark:border-gray-700 px-6">
          <div class="flex gap-4">
            <button 
              @click="activeTab = 'details'"
              :class="[
                'px-4 py-3 font-medium transition-colors border-b-2',
                activeTab === 'details' 
                  ? 'border-blue-500 text-blue-600 app-dark:text-blue-400' 
                  : 'border-transparent text-gray-500 app-dark:text-gray-400 hover:text-gray-700 app-dark:hover:text-gray-300'
              ]"
            >
              Detalles
            </button>
            <button 
              @click="activeTab = 'licenses'"
              :class="[
                'px-4 py-3 font-medium transition-colors border-b-2',
                activeTab === 'licenses' 
                  ? 'border-blue-500 text-blue-600 app-dark:text-blue-400' 
                  : 'border-transparent text-gray-500 app-dark:text-gray-400 hover:text-gray-700 app-dark:hover:text-gray-300'
              ]"
            >
              Licencias
            </button>
            <button 
              v-if="isOwner"
              @click="activeTab = 'sale'"
              :class="[
                'px-4 py-3 font-medium transition-colors border-b-2',
                activeTab === 'sale' 
                  ? 'border-blue-500 text-blue-600 app-dark:text-blue-400' 
                  : 'border-transparent text-gray-500 app-dark:text-gray-400 hover:text-gray-700 app-dark:hover:text-gray-300'
              ]"
            >
              Venta
            </button>
            <button 
              v-if="isOwner"
              @click="activeTab = 'transfer'"
              :class="[
                'px-4 py-3 font-medium transition-colors border-b-2',
                activeTab === 'transfer' 
                  ? 'border-blue-500 text-blue-600 app-dark:text-blue-400' 
                  : 'border-transparent text-gray-500 app-dark:text-gray-400 hover:text-gray-700 app-dark:hover:text-gray-300'
              ]"
            >
              Transferir
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Details Tab -->
          <div v-if="activeTab === 'details'" class="space-y-6">
            <!-- Description -->
            <div>
              <h3 class="text-sm font-semibold text-gray-500 app-dark:text-gray-400 uppercase mb-2">
                Descripción
              </h3>
              <p class="text-gray-900 app-dark:text-white">{{ modelData.description }}</p>
            </div>

            <!-- Model Information Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModelInfoField 
                title="Propietario" 
                :value="`${modelData.owner.slice(0, 6)}...${modelData.owner.slice(-4)}`"
              />
              <ModelInfoField title="Categoría" :value="modelData.category" />
              <ModelInfoField v-if="modelData.modelType" title="Tipo" :value="modelData.modelType" />
              <ModelInfoField v-if="modelData.features" title="Características" :value="modelData.features" />
            </div>

            <!-- For Sale Section -->
            <div v-if="hasForSalePrice" class="p-4 bg-green-50 app-dark:bg-green-900/20 border border-green-200 app-dark:border-green-800 rounded-lg">
              <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div class="text-center sm:text-left">
                  <h3 class="text-lg font-bold text-green-900 app-dark:text-green-100">
                    Disponible para Compra
                  </h3>
                  <p class="text-3xl font-bold text-green-600 app-dark:text-green-400 mt-2">
                    {{ modelData.price }} AVAX
                  </p>
                </div>
                <button 
                  v-if="!isOwner"
                  @click="handleBuyModel"
                  class="px-6 py-3 bg-green-500 app-dark:bg-green-600 text-white rounded-lg font-medium hover:bg-green-600 app-dark:hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  Comprar Modelo
                </button>
              </div>
            </div>
          </div>

          <!-- Licenses Tab -->
          <div v-if="activeTab === 'licenses'" class="space-y-6">
            <!-- User License Status -->
            <div v-if="userHasLicense" class="p-4 bg-blue-50 app-dark:bg-blue-900/20 border border-blue-200 app-dark:border-blue-800 rounded-lg">
              <h3 class="font-bold text-blue-900 app-dark:text-blue-100">✓ Licencia Activa</h3>
              <p class="text-sm text-blue-700 app-dark:text-blue-300 mt-1">
                Expira: {{ licenseExpiryDate }}
              </p>
            </div>

            <!-- Create License Plan (Owner Only) -->
            <div v-if="isOwner" class="border border-gray-200 app-dark:border-gray-700 rounded-lg p-4">
              <button 
                @click="showLicenseForm = !showLicenseForm"
                class="w-full flex justify-between items-center text-left font-medium text-gray-900 app-dark:text-white hover:text-blue-600 app-dark:hover:text-blue-400 transition-colors"
              >
                <span>+ Crear Nuevo Plan de Licencia</span>
                <svg 
                  class="w-5 h-5 transition-transform" 
                  :class="{ 'rotate-180': showLicenseForm }"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <form v-if="showLicenseForm" @submit.prevent="handleCreateLicensePlan" class="mt-4 space-y-3">
                <input 
                  v-model="licensePlanForm.name"
                  placeholder="Nombre del plan"
                  class="w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="text"
                  required
                >
                <div class="grid grid-cols-2 gap-3">
                  <input 
                    v-model="licensePlanForm.price"
                    placeholder="Precio en AVAX"
                    class="w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="number"
                    step="0.01"
                    required
                  >
                  <input 
                    v-model.number="licensePlanForm.duration"
                    placeholder="Duración (días)"
                    class="w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="number"
                    min="1"
                    required
                  >
                </div>
                <button 
                  type="submit"
                  class="w-full px-4 py-2 bg-blue-500 app-dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 app-dark:hover:bg-blue-700 transition-colors font-medium"
                >
                  Crear Plan
                </button>
              </form>
            </div>

            <!-- License Plans List -->
            <div class="space-y-3">
              <h3 class="font-bold text-gray-900 app-dark:text-white text-lg">
                Planes Disponibles
              </h3>
              
              <div v-if="licensePlans.length === 0" class="text-center py-8 text-gray-500 app-dark:text-gray-400">
                No hay planes de licencia disponibles
              </div>
              
              <LicensePlanCard
                v-for="plan in licensePlans"
                :key="plan.id"
                :plan="plan"
                :is-owner="!!isOwner"
                @buy="handleBuyLicense"
                @toggle-active="handleTogglePlanActive"
              />
            </div>
          </div>

          <!-- Sale Tab (Owner Only) -->
          <div v-if="activeTab === 'sale' && isOwner" class="space-y-4">
            <div v-if="!modelData.forSale">
              <h3 class="font-bold text-gray-900 app-dark:text-white mb-4 text-lg">
                Poner Modelo en Venta
              </h3>
              <form @submit.prevent="handleSetForSale" class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300 mb-2">
                    Precio en AVAX
                  </label>
                  <input 
                    v-model="salePrice"
                    placeholder="Ej: 100"
                    class="w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                  >
                </div>
                <button 
                  type="submit"
                  class="w-full px-4 py-3 bg-green-500 app-dark:bg-green-600 text-white rounded-lg font-medium hover:bg-green-600 app-dark:hover:bg-green-700 transition-colors"
                >
                  Poner en Venta
                </button>
              </form>
            </div>

            <div v-else class="p-6 bg-green-50 app-dark:bg-green-900/20 border border-green-200 app-dark:border-green-800 rounded-lg">
              <h3 class="font-bold text-green-900 app-dark:text-green-100 text-lg">
                ✓ Modelo en Venta
              </h3>
              <p class="text-3xl font-bold text-green-600 app-dark:text-green-400 mt-3">
                {{ modelData.price }} AVAX
              </p>
              <button 
                @click="handleCancelSale"
                class="mt-6 w-full px-4 py-2 bg-red-500 app-dark:bg-red-600 text-white rounded-lg hover:bg-red-600 app-dark:hover:bg-red-700 transition-colors font-medium"
              >
                Cancelar Venta
              </button>
            </div>
          </div>

          <!-- Transfer Tab (Owner Only) -->
          <div v-if="activeTab === 'transfer' && isOwner" class="space-y-4">
            <h3 class="font-bold text-gray-900 app-dark:text-white text-lg">
              Transferir Modelo
            </h3>
            <p class="text-sm text-gray-600 app-dark:text-gray-400">
              Transfiere la propiedad de este modelo a otra dirección. Esta acción es irreversible.
            </p>
            <form @submit.prevent="handleTransfer" class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300 mb-2">
                  Dirección de destino
                </label>
                <input 
                  v-model="transferAddress"
                  placeholder="0x..."
                  class="w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="text"
                  pattern="^0x[a-fA-F0-9]{40}$"
                  required
                >
                <p class="mt-1 text-xs text-gray-500 app-dark:text-gray-400">
                  Debe ser una dirección Ethereum válida
                </p>
              </div>
              <button 
                type="submit"
                class="w-full px-4 py-3 bg-blue-500 app-dark:bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-600 app-dark:hover:bg-blue-700 transition-colors"
              >
                Transferir Modelo
              </button>
            </form>
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
</style>
