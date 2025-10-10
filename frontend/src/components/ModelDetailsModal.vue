<!-- 
  ModelDetailsModal.vue
  
  Responsabilidad única: COORDINAR las diferentes tabs del modal de detalles del modelo
  
  Este componente es un ORQUESTADOR que:
  - Gestiona qué tab está activa
  - Carga los datos del modelo desde blockchain
  - Distribuye datos a los sub-componentes (tabs)
  - Maneja eventos de los sub-componentes y los delega al componente padre o blockchain
  
  NO contiene lógica de UI específica de cada tab (delegada a sub-componentes)
-->

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import InferenceModal from './InferenceModal.vue'
import ModelDetailsTab from './tabs/ModelDetailsTab.vue'
import LicenseManagementTab from './tabs/LicenseManagementTab.vue'
import SaleManagementTab from './tabs/SaleManagementTab.vue'
import TransferTab from './tabs/TransferTab.vue'
import { getModelById, createLicensePlan, cancelSale, setModelForSale, buyLicense } from '../composables/blockchain'
import { fetchMetadata } from '../composables/ipfs'
import { ethers } from 'ethers'

// ========================================
// TIPOS
// ========================================

interface LicensePlan {
  id: number
  name: string | null
  price: string
  priceWei?: string | null
  duration?: number | null
  active?: boolean | null
}

interface ModelDetails {
  id: string
  author: string | null
  owner?: string | null
  name?: string | null
  ipfsHash?: string | null
  tokenURI?: string | null
  basePrice?: string | null
  basePriceWei?: string | null
  salePrice?: string | null
  salePriceWei?: string | null
  forSale?: boolean
  plansCount?: number | null
  plans?: LicensePlan[] | null
  description?: string | null
  category?: string | null
  modelType?: string | null
  features?: string | null
}

type TabType = 'details' | 'licenses' | 'sale' | 'transfer'

// ========================================
// PROPS & EMITS
// ========================================

// ========================================
// PROPS & EMITS
// ========================================

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

// ========================================
// ESTADO DEL MODAL
// ========================================

// UI State
const activeTab = ref<TabType>('details')
const isInferenceModalOpen = ref(false)

// Data State
const modelData = ref<ModelDetails | null>(null)
const licensePlans = ref<LicensePlan[]>([])
const userHasLicense = ref(false)
const licenseExpiry = ref<number>(0)

// Loading States (para pasar a sub-componentes)
const creatingPlan = ref(false)
const settingForSale = ref(false)
const cancellingSale = ref(false)
const buyingLicense = ref(false)

// ========================================
// COMPUTED PROPERTIES (para derivar datos)
// ========================================
const ownerAddress = computed(() => {
  return (modelData.value?.author || modelData.value?.owner || '') as string
})

const ownerShort = computed(() => {
  const addr = ownerAddress.value || ''
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
})

const displayPrice = computed(() => {
  if (!modelData.value) return null
  return modelData.value.salePrice ?? modelData.value.basePrice ?? null
})

const isOwner = computed(() => {
  if (!props.userAddress) return false
  if (!ownerAddress.value) return false
  try {
    return ownerAddress.value.toLowerCase() === props.userAddress.toLowerCase()
  } catch (e) {
    return false
  }
})

const licenseExpiryDate = computed(() => {
  if (!licenseExpiry.value) return null
  return new Date(licenseExpiry.value * 1000).toLocaleDateString()
})

const hasForSalePrice = computed(() => 
  Boolean(modelData.value?.forSale) && Boolean(modelData.value?.salePrice || modelData.value?.basePrice)
)

// Computed para el modelo de inferencia
const inferenceModel = computed(() => {
  if (!modelData.value) return null
  return {
    id: parseInt(modelData.value.id),
    name: modelData.value.name || 'Modelo sin nombre',
    ipfsHash: modelData.value.ipfsHash || '',
    category: modelData.value.category || 'General'
  }
})

// Data Loading
const loadModelData = async () => {
  if (!props.modelId) return

  try {
    const raw = await getModelById(props.modelId)

    // intentar obtener metadata desde tokenURI/ipfsHash si existe
    let metadata: any = null
    try {
      if (raw.tokenURI || raw.ipfsHash) {
        metadata = await fetchMetadata(props.modelId)
      }
    } catch (e) {
      // no crítico; si falla, seguimos con datos crudos
      console.debug('No se pudo obtener metadata desde IPFS:', e)
      metadata = null
    }

    // Mapear planes y agregar ids si faltan
    const plans: LicensePlan[] | null = raw.plans
      ? (raw.plans as any[]).map((p: any, i: number) => ({
          id: p.id ?? i,
          name: String(p.name ?? `Plan ${i + 1}`),
          // asegurar price como string para la UI
          price: String(p.price ?? '0'),
          priceWei: p.priceWei ?? null,
          duration: p.duration ?? null,
          active: p.active ?? null
        }))
      : null

    modelData.value = {
      id: raw.id,
      author: raw.author ?? null,
      owner: raw.author ?? null,
      name: raw.name ?? metadata?.name ?? null,
      ipfsHash: raw.ipfsHash ?? null,
      tokenURI: raw.tokenURI ?? null,
      basePrice: raw.basePrice ?? null,
      basePriceWei: raw.basePriceWei ?? null,
      salePrice: raw.salePrice ?? null,
      salePriceWei: raw.salePriceWei ?? null,
      forSale: Boolean(raw.forSale),
      plansCount: raw.plansCount ?? null,
      plans,

      description: metadata?.description ?? null,
      category: metadata?.category ?? null,
      modelType: metadata?.modelType ?? null,
      features: metadata?.features ?? null
    }

    // Popular lista de planes para la UI (si existen)
    licensePlans.value = plans ?? []

    // Simulación de estado de licencia (por ahora)
    userHasLicense.value = props.modelId === 1
    licenseExpiry.value = userHasLicense.value ? Math.floor(Date.now() / 1000) + 2592000 : 0
  } catch (err) {
    console.error('Error cargando datos del modelo:', err)
    // fallback: mantener comportamiento anterior mínimo
    modelData.value = {
      id: String(props.modelId),
      author: props.userAddress || null,
      owner: props.userAddress || null,
      name: `Model #${props.modelId}`,
      description: 'Advanced AI model for various applications',
      category: 'NLP',
      basePrice: null,
      basePriceWei: null,
      salePrice: null,
      salePriceWei: null,
      forSale: Boolean(props.modelId === 1),
      plansCount: null,
      plans: null
    }
    licensePlans.value = []
  }

  // Reiniciar pestaña
  activeTab.value = 'details'
}

// Nota: funciones de fallback eliminadas para evitar warnings; la carga principal ocurre en loadModelData

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
const handleCreateLicensePlan = async () => {
  if (!validateLicensePlan()) return

  // Emit local event for parent handling (keeps existing contract)
  emit('createLicensePlan', {
    modelId: props.modelId,
    ...licensePlanForm.value
  })

  // Además, intentamos crear el plan en la blockchain usando el helper
  try {
    creatingPlan.value = true

    // price en AVAX legible -> convertir a wei
    const priceAvax = String(licensePlanForm.value.price)
    const priceWei = (ethers as any).parseEther ? (ethers as any).parseEther(priceAvax) : (ethers as any).utils.parseEther(priceAvax)

    // duration: UI usa días; contrato espera segundos (según documentación)
    const durationDays = Number(licensePlanForm.value.duration || 0)
    const durationSeconds = Math.max(1, Math.floor(durationDays * 24 * 60 * 60))

    if (!props.modelId) throw new Error('modelId inválido')

    const receipt = await createLicensePlan(props.modelId, licensePlanForm.value.name, priceWei, durationSeconds)
    console.log('License plan created on-chain:', receipt)


    resetLicenseForm()
    } catch (err: any) {
    console.error('Error creando plan en blockchain:', err)
    alert('No se pudo crear el plan en la blockchain: ' + (err && err.message ? err.message : String(err)))
  } finally {
    creatingPlan.value = false
  }
}

const handleTogglePlanActive = (planId: number, currentActive: boolean) => {
  emit('setPlanActive', planId, !currentActive)
  
  // Update local state
  const plan = licensePlans.value.find(p => p.id === planId)
  if (plan) plan.active = !currentActive
}

const handleBuyLicense = async (planId: number) => {
  console.log('entrar');
  if (!props.modelId) return

  const plan = licensePlans.value.find(p => p.id === planId)
  if (!plan) {
    alert('Plan no encontrado')
    return
  }

  try {
    buyingLicense.value = true

    // Determine priceWei: prefer plan.priceWei, fallback to parseEther(plan.price)
    let priceWei: any = plan.priceWei ?? null
    if (!priceWei) {
      const priceAvax = String(plan.price ?? '0')
      priceWei = (ethers as any).parseEther ? (ethers as any).parseEther(priceAvax) : (ethers as any).utils.parseEther(priceAvax)
    }

    const receipt = await buyLicense(props.modelId, planId, priceWei)
    console.log('buyLicense receipt:', receipt)

    // Update local state after successful tx
    userHasLicense.value = true
    licenseExpiry.value = Math.floor(Date.now() / 1000) + 2592000

    // Emit to parent that a license was bought (after success)
    emit('buyLicense', planId)
  } catch (err: any) {
    console.error('Error comprando licencia:', err)
    alert('No se pudo comprar la licencia: ' + (err && err.message ? err.message : String(err)))
  } finally {
    buyingLicense.value = false
  }
}

// Event Handlers - Sale
const handleSetForSale = async () => {
  if (!validateSalePrice()) return
  if (!props.modelId) return

  try {
    settingForSale.value = true

    // Convertir precio de AVAX a Wei
    const priceAvax = String(salePrice.value)
    const priceWei = (ethers as any).parseEther ? (ethers as any).parseEther(priceAvax) : (ethers as any).utils.parseEther(priceAvax)

    // Llamar a la blockchain y esperar confirmación
    const receipt = await setModelForSale(props.modelId, priceWei)
    console.log('setModelForSale receipt:', receipt)

    // Emitir evento para el padre
    emit('setForSale', salePrice.value)

    // Solo actualizar el estado local después de la confirmación blockchain
    if (modelData.value) {
      modelData.value.forSale = true
      modelData.value.salePrice = salePrice.value
    }

    resetSaleForm()
  } catch (err) {
    console.error('Error poniendo modelo en venta:', err)
    alert('Error poniendo el modelo en venta. Revisa la consola para más detalles.')
  } finally {
    settingForSale.value = false
  }
}

const handleCancelSale = async () => {
  if (!props.modelId) return

  try {
    cancellingSale.value = true
    const receipt = await cancelSale(props.modelId)
    console.log('cancelSale receipt:', receipt)

    // Emitir evento para el padre
    emit('cancelSale')

    // Update local state
    if (modelData.value) {
      modelData.value.forSale = false
      modelData.value.salePrice = null
      modelData.value.salePriceWei = null
    }
  } catch (err) {
    console.error('Error cancelando venta on-chain:', err)
    alert('Error cancelando la venta. Revisa la consola para más detalles.')
  } finally {
    cancellingSale.value = false
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

// Event Handlers - Inference
const openInferenceModal = () => {
  isInferenceModalOpen.value = true
}

const closeInferenceModal = () => {
  isInferenceModalOpen.value = false
}

// Watchers
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    void loadModelData()
    activeTab.value = 'details'
  }
})

// Cargar datos inmediantamente si el modal ya está abierto
watch(() => props.modelId, (newId) => {
  if (props.isOpen && newId !== null) {
    void loadModelData()
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
                :value="ownerShort"
              />
              <ModelInfoField title="Categoría" :value="modelData.category ?? ''" />
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
                    {{ displayPrice ?? '-' }} AVAX
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

            <!-- Inference Button -->
            <div class="mt-6">
              <button
                @click="openInferenceModal"
                class="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Ejecutar Inferencia con este Modelo
              </button>
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
                  :disabled="creatingPlan"
                  :class="[
                    'w-full px-4 py-2 rounded-lg transition-colors font-medium',
                    creatingPlan ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-500 app-dark:bg-blue-600 text-white hover:bg-blue-600 app-dark:hover:bg-blue-700'
                  ]"
                >
                  <span v-if="!creatingPlan">Crear Plan</span>
                  <span v-else class="flex items-center justify-center gap-2">
                    <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Creando...
                  </span>
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
                :plan="{ id: plan.id, name: plan.name ?? '', price: plan.price ?? '0', duration: plan.duration ?? 0, active: !!plan.active }"
                :is-owner="isOwner"
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
                  :disabled="settingForSale"
                  :class="[
                    'w-full px-4 py-3 rounded-lg font-medium transition-colors',
                    settingForSale ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-green-500 app-dark:bg-green-600 text-white hover:bg-green-600 app-dark:hover:bg-green-700'
                  ]"
                >
                  <span v-if="!settingForSale">Poner en Venta</span>
                  <span v-else class="flex items-center justify-center gap-2">
                    <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Procesando...
                  </span>
                </button>
              </form>
            </div>

            <div v-else class="p-6 bg-green-50 app-dark:bg-green-900/20 border border-green-200 app-dark:border-green-800 rounded-lg">
              <h3 class="font-bold text-green-900 app-dark:text-green-100 text-lg">
                ✓ Modelo en Venta
              </h3>
              <p class="text-3xl font-bold text-green-600 app-dark:text-green-400 mt-3">
                {{ displayPrice ?? '-' }} AVAX
              </p>
              <button 
                @click="handleCancelSale"
                :disabled="cancellingSale"
                :class="[
                  'mt-6 w-full px-4 py-2 rounded-lg transition-colors font-medium',
                  cancellingSale ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-red-500 app-dark:bg-red-600 text-white hover:bg-red-600 app-dark:hover:bg-red-700'
                ]"
              >
                <span v-if="!cancellingSale">Cancelar Venta</span>
                <span v-else class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Cancelando...
                </span>
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

  <!-- Inference Modal -->
  <InferenceModal
    :is-open="isInferenceModalOpen"
    :model="inferenceModel"
    @close="closeInferenceModal"
  />
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
