<!-- 
  ModelDetailsModal.vue - REFACTORIZADO
  
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
import ModelDetailsTab from '../tabs/ModelDetailsTab.vue'
import LicenseManagementTab from '../tabs/LicenseManagementTab.vue'
import SaleManagementTab from '../tabs/SaleManagementTab.vue'
import TransferTab from '../tabs/TransferTab.vue'
import { getModelById, createLicensePlan, cancelSale, setModelForSale, buyLicense } from '../../composables/blockchain'
import { fetchMetadata } from '../../composables/ipfs'
import { useNotifications } from '../../composables/useNotifications'
import { useBlockchainErrorHandler } from '../../composables/useBlockchainErrorHandler'
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

const activeTab = ref<TabType>('details')
const isInferenceModalOpen = ref(false)

const modelData = ref<ModelDetails | null>(null)
const licensePlans = ref<LicensePlan[]>([])
const userHasLicense = ref(false)
const licenseExpiry = ref<number>(0)
const loadingModelData = ref(false)

// Loading States para sub-componentes
const creatingPlan = ref(false)
const settingForSale = ref(false)
const cancellingSale = ref(false)
const buyingLicense = ref(false)

const { notifyTransactionSuccess, notifyError } = useNotifications()
const { handleAsyncOperation } = useBlockchainErrorHandler()

// ========================================
// COMPUTED PROPERTIES
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

const inferenceModel = computed(() => {
  if (!modelData.value) return null
  return {
    id: parseInt(modelData.value.id),
    name: modelData.value.name || 'Modelo sin nombre',
    ipfsHash: modelData.value.ipfsHash || '',
    category: modelData.value.category || 'General',
    tokenURI: modelData.value.tokenURI || null  // Agregado para metadatos
  }
})

// ========================================
// CARGA DE DATOS (única responsabilidad de este componente)
// ========================================

const loadModelData = async () => {
  console.log('ModelDetailsModal - Intentando cargar datos para modelId:', props.modelId)
  
  if (!props.modelId) {
    console.log('ModelDetailsModal - No modelId proporcionado')
    return
  }

  loadingModelData.value = true

  try {
    console.log('ModelDetailsModal - Obteniendo datos del modelo desde blockchain...')
    const raw = await getModelById(props.modelId)
    console.log('ModelDetailsModal - Datos raw del modelo:', raw)

    // Intentar obtener metadata desde IPFS
    let metadata: any = null
    try {
      if (raw.tokenURI || raw.ipfsHash) {
        metadata = await fetchMetadata(props.modelId)
      }
    } catch (e) {
      console.debug('No se pudo obtener metadata desde IPFS:', e)
      metadata = null
    }

    // Mapear planes y agregar ids si faltan
    const plans: LicensePlan[] | null = raw.plans
      ? (raw.plans as any[]).map((p: any, i: number) => ({
          id: p.id ?? i,
          name: String(p.name ?? `Plan ${i + 1}`),
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

    console.log('ModelDetailsModal - Datos del modelo procesados:', modelData.value)

    licensePlans.value = plans ?? []

    // Simulación de estado de licencia (temporal - debe venir de blockchain)
    userHasLicense.value = props.modelId === 1
    licenseExpiry.value = userHasLicense.value ? Math.floor(Date.now() / 1000) + 2592000 : 0
  } catch (err) {
    console.error('Error cargando datos del modelo:', err)
    // Fallback mínimo
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
  } finally {
    loadingModelData.value = false
  }

  activeTab.value = 'details'
}

// ========================================
// EVENT HANDLERS (delegación a blockchain o padre)
// ========================================

// Handlers de ModelDetailsTab
const handleBuyModel = () => {
  emit('buyModel')
  emit('close')
}

const handleExecuteInference = () => {
  isInferenceModalOpen.value = true
}

// Handlers de LicenseManagementTab
const handleCreateLicensePlan = async (formData: { name: string, price: string, duration: number }) => {
  // Emitir al padre para mantener contrato existente
  emit('createLicensePlan', {
    modelId: props.modelId,
    ...formData
  })

  // Crear en blockchain
  try {
    creatingPlan.value = true

    const priceAvax = String(formData.price)
    const priceWei = (ethers as any).parseEther ? (ethers as any).parseEther(priceAvax) : (ethers as any).utils.parseEther(priceAvax)

    const durationDays = Number(formData.duration || 0)
    const durationSeconds = Math.max(1, Math.floor(durationDays * 24 * 60 * 60))

    if (!props.modelId) throw new Error('modelId inválido')

    const receipt = await createLicensePlan(props.modelId, formData.name, priceWei, durationSeconds)
    console.log('License plan created on-chain:', receipt)

    // Show success notification
    notifyTransactionSuccess(
      'Plan de Licencia Creado',
      `El plan "${formData.name}" ha sido creado exitosamente por ${formData.price} AVAX`
    )

    // Recargar datos del modelo
    await loadModelData()
  } catch (err: any) {
    console.error('Error creando plan en blockchain:', err)
    handleAsyncOperation(
      () => Promise.reject(err),
      'creación de plan de licencia'
    )
  } finally {
    creatingPlan.value = false
  }
}

const handleBuyLicense = async (planId: number) => {
  if (!props.modelId) return

  const plan = licensePlans.value.find(p => p.id === planId)
  if (!plan) {
    notifyError('Plan no encontrado', 'No se pudo encontrar el plan de licencia seleccionado')
    return
  }

  try {
    buyingLicense.value = true

    let priceWei: any = plan.priceWei ?? null
    if (!priceWei) {
      const priceAvax = String(plan.price ?? '0')
      priceWei = (ethers as any).parseEther ? (ethers as any).parseEther(priceAvax) : (ethers as any).utils.parseEther(priceAvax)
    }

    const receipt = await buyLicense(props.modelId, planId, priceWei)
    console.log('buyLicense receipt:', receipt)

    // Show success notification
    notifyTransactionSuccess(
      'Licencia Comprada',
      `Has adquirido exitosamente el plan "${plan.name}" por ${plan.price} AVAX`
    )

    // Actualizar estado local
    userHasLicense.value = true
    licenseExpiry.value = Math.floor(Date.now() / 1000) + 2592000

    // Emitir al padre
    emit('buyLicense', planId)
  } catch (err: any) {
    console.error('Error comprando licencia:', err)
    handleAsyncOperation(
      () => Promise.reject(err),
      'compra de licencia'
    )
  } finally {
    buyingLicense.value = false
  }
}

const handleTogglePlanActive = (planId: number, currentActive: boolean) => {
  emit('setPlanActive', planId, !currentActive)
  
  // Actualizar estado local
  const plan = licensePlans.value.find(p => p.id === planId)
  if (plan) plan.active = !currentActive
}

// Handlers de SaleManagementTab
const handleSetForSale = async (price: string) => {
  if (!props.modelId) return

  try {
    settingForSale.value = true

    const priceAvax = String(price)
    const priceWei = (ethers as any).parseEther ? (ethers as any).parseEther(priceAvax) : (ethers as any).utils.parseEther(priceAvax)

    const receipt = await setModelForSale(props.modelId, priceWei)
    console.log('setModelForSale receipt:', receipt)

    // Show success notification
    notifyTransactionSuccess(
      'Modelo Puesto en Venta',
      `Tu modelo está ahora disponible por ${price} AVAX`
    )

    // Emitir al padre
    emit('setForSale', price)

    // Actualizar estado local
    if (modelData.value) {
      modelData.value.forSale = true
      modelData.value.salePrice = price
    }
  } catch (err) {
    console.error('Error poniendo modelo en venta:', err)
    handleAsyncOperation(
      () => Promise.reject(err),
      'poner modelo en venta'
    )
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

    // Show success notification
    notifyTransactionSuccess(
      'Venta Cancelada',
      'Tu modelo ya no está disponible para la venta'
    )

    // Emitir al padre
    emit('cancelSale')

    // Actualizar estado local
    if (modelData.value) {
      modelData.value.forSale = false
      modelData.value.salePrice = null
      modelData.value.salePriceWei = null
    }
  } catch (err) {
    console.error('Error cancelando venta on-chain:', err)
    handleAsyncOperation(
      () => Promise.reject(err),
      'cancelar venta'
    )
  } finally {
    cancellingSale.value = false
  }
}

// Handlers de TransferTab
const handleTransfer = (toAddress: string) => {
  emit('transferModel', toAddress)
  emit('close')
}

// Handler del modal
const handleClose = () => {
  emit('close')
}

const closeInferenceModal = () => {
  isInferenceModalOpen.value = false
}

// ========================================
// WATCHERS
// ========================================

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    void loadModelData()
    activeTab.value = 'details'
  }
})

watch(() => props.modelId, (newId) => {
  if (props.isOpen && newId !== null) {
    void loadModelData()
  }
}, { immediate: true })

</script>

<template>
  <Transition name="modal" appear>
    <div 
      v-if="isOpen && modelData"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 app-dark:bg-black/20 backdrop-blur-lg modal-backdrop"
      @click.self="handleClose"
      v-motion
      :initial="{ opacity: 0 }"
      :enter="{ opacity: 1, transition: { duration: 300 } }"
      :leave="{ opacity: 0, transition: { duration: 200 } }"
    >
      <div 
        class="w-full max-w-4xl bg-white/95 app-dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20 app-dark:border-gray-700/50"
        v-motion
        :initial="{ scale: 0.9, y: 50 }"
        :enter="{ scale: 1, y: 0, transition: { duration: 400, ease: 'easeOut' } }"
        :leave="{ scale: 0.9, y: 50, transition: { duration: 200, ease: 'easeIn' } }"
      >
        <!-- Header del Modal -->
        <div class="bg-white app-dark:bg-gray-900 border-b border-gray-200 app-dark:border-gray-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 class="text-gray-900 app-dark:text-white font-bold text-2xl">
              {{ modelData?.name || 'Cargando...' }}
            </h2>
            <p class="text-sm text-gray-500 app-dark:text-gray-400 mt-1">
              ID: {{ modelData?.id || props.modelId || '...' }}
            </p>
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

        <!-- Navegación por Tabs -->
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

        <!-- Contenido de las Tabs (Sub-componentes) -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Loading State -->
          <div v-if="loadingModelData" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600 app-dark:text-gray-400">Cargando datos del modelo...</p>
          </div>

          <!-- Content when loaded -->
          <template v-else-if="modelData">
            <!-- Tab: Detalles del Modelo -->
            <ModelDetailsTab
              v-if="activeTab === 'details'"
              :model-data="modelData"
              :is-owner="isOwner"
              :has-for-sale-price="hasForSalePrice"
            :display-price="displayPrice"
            :owner-short="ownerShort"
            @buy-model="handleBuyModel"
            @execute-inference="handleExecuteInference"
          />

          <!-- Tab: Gestión de Licencias -->
          <LicenseManagementTab
            v-if="activeTab === 'licenses'"
            :is-owner="isOwner"
            :user-has-license="userHasLicense"
            :license-expiry-date="licenseExpiryDate"
            :license-plans="licensePlans"
            :creating-plan="creatingPlan"
            :buying-license="buyingLicense"
            @create-plan="handleCreateLicensePlan"
            @buy-license="handleBuyLicense"
            @toggle-plan-active="handleTogglePlanActive"
          />

          <!-- Tab: Gestión de Venta -->
          <SaleManagementTab
            v-if="activeTab === 'sale' && isOwner"
            :is-for-sale="Boolean(modelData.forSale)"
            :current-price="displayPrice"
            :setting-for-sale="settingForSale"
            :cancelling-sale="cancellingSale"
            @set-for-sale="handleSetForSale"
            @cancel-sale="handleCancelSale"
          />

            <!-- Tab: Transferencia del NFT -->
            <TransferTab
              v-if="activeTab === 'transfer' && isOwner"
              @transfer="handleTransfer"
            />
          </template>

          <!-- Error state -->
          <div v-else class="text-center py-12">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <h3 class="text-lg font-semibold text-gray-900 app-dark:text-gray-100 mb-2">
              Error al cargar el modelo
            </h3>
            <p class="text-gray-600 app-dark:text-gray-400">
              No se pudieron cargar los datos del modelo
            </p>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Modal de Inferencia (anidado) -->
  <InferenceModal
    :is-open="isInferenceModalOpen"
    :model="inferenceModel"
    @close="closeInferenceModal"
  />
</template>

<style scoped>
/* Transición del modal */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
