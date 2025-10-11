<!--
  Vista: ModelsPage (REFACTORIZADO)
  
  RESPONSABILIDAD ÚNICA: COORDINAR composables y componentes
  
  Delega toda la lógica compleja:
  - useModels → Carga y gestión de estado de modelos
  - useModelActions → Operaciones blockchain (compra, venta, transfer, licencias)
  - ModelsGrid → Renderizado de la cuadrícula y estados visuales
  - Modals → Gestión de diálogos (Upload, Details, Buy)
  
  Este componente solo:
  1. Inicializa composables
  2. Maneja apertura/cierre de modals
  3. Coordina eventos entre componentes
  4. Muestra feedback al usuario (alerts)
-->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWallet } from '../composables/useWallet'
import { useModels } from '../composables/useModels'
import { useModelActions } from '../composables/useModelActions'
import { useNotifications } from '../composables/useNotifications'
import { useBlockchainErrorHandler } from '../composables/useBlockchainErrorHandler'
import Header from '../components/layout/header.vue'
import ModelsGrid from '../components/lists/ModelsGrid.vue'
import UploadModelModal from '../components/modals/UploadModelModal.vue'
import ModelDetailsModal from '../components/modals/ModelDetailsModal.vue'
import BuyModelModal from '../components/modals/BuyModelModal.vue' 

// ========================================
// COMPOSABLES
// ========================================

const { isConnected, account } = useWallet()
const { 
  models, 
  loadingModels, 
  selectedModel, 
  filteredModels,
  loadModels,
  selectModel,
  updateModel
} = useModels(account)

const {
  buyModel,
  setModelForSale,
  cancelModelSale,
  transferModel,
  createLicensePlan,
  setPlanActive,
  buyLicense,
} = useModelActions()

// 🎉 Sistema de notificaciones elegantes
const { notifySuccess, notifyError } = useNotifications()

// ⚠️ Manejador de errores blockchain
const { handleBlockchainError } = useBlockchainErrorHandler()

// ========================================
// ESTADO DE MODALS Y LOADING
// ========================================

const isUploadModalOpen = ref(false)
const isDetailsModalOpen = ref(false)
const isBuyModalOpen = ref(false)
const isUploadingModel = ref(false)

// ========================================
// CICLO DE VIDA
// ========================================

onMounted(async () => {
  await loadModels()
})

// ========================================
// COMPUTED
// ========================================

// Mensaje del estado vacío dependiendo del contexto
const emptyStateMessage = computed(() => {
  if (isConnected.value && models.value.length > 0) {
    return {
      message: 'No hay modelos disponibles',
      subMessage: 'Actualmente no hay modelos disponibles para comprar. Vuelve más tarde.'
    }
  }
  return {
    message: 'No hay modelos subidos aún',
    subMessage: 'Sé el primero en subir un modelo de IA al marketplace'
  }
})

// ========================================
// HANDLERS - MODALS
// ========================================

function handleUploadModel() {
  if (!isConnected.value) return
  isUploadModalOpen.value = true
}

function handleCloseUploadModal() {
  isUploadModalOpen.value = false
}

function handleCloseDetailsModal() {
  isDetailsModalOpen.value = false
  selectModel(null)
}

function handleCloseBuyModal() {
  isBuyModalOpen.value = false
  selectModel(null)
}

// ========================================
// HANDLERS - ACCIONES DE MODELOS
// ========================================

/**
 * Maneja la visualización de detalles de un modelo
 * Determina si mostrar modal de owner (detalles) o modal de compra
 */
function handleViewDetails(modelId: number) {
  selectModel(modelId)
  
  const model = models.value.find(m => m.id === modelId)
  if (!model) return
  
  const isOwner = account.value && model.owner?.toLowerCase() === account.value.toLowerCase()
  
  if (isOwner) {
    // Si es propietario, mostrar modal de detalles completa
    isDetailsModalOpen.value = true
  } else {
    // Si no es propietario, mostrar modal de compra
    isBuyModalOpen.value = true
  }
}

/**
 * Maneja la subida de un nuevo modelo
 * ✅ ACTUALIZADO: El modal ya maneja todo el proceso de subida
 */
async function handleSubmitModel(formData: any) {
  console.log('✅ Confirmación de modelo subido exitosamente:', formData.title)
  
  // El modal ya manejó toda la subida y se cerró automáticamente
  // Solo necesitamos recargar la lista
  isUploadingModel.value = true
  
  try {
    console.log('🔄 Recargando lista de modelos...')
    await loadModels()
    console.log('✅ Lista actualizada')
  } catch (error) {
    console.error('❌ Error recargando modelos:', error)
    notifyError('Error', 'No se pudo recargar la lista de modelos')
  } finally {
    isUploadingModel.value = false
  }
}

/**
 * Maneja la compra de un modelo NFT
 */
async function handleBuyModel() {
  if (!selectedModel.value) return
  
  const result = await buyModel(selectedModel.value, account.value)
  
  if (result.success) {
    // Actualizar estado local
    updateModel(selectedModel.value.id, result.updates!)
    
    // Cerrar modal y mostrar mensaje
    isBuyModalOpen.value = false
    selectModel(null)
    
    notifySuccess(
      'Compra Exitosa',
      result.message
    )
  } else {
    notifyError(
      'Error en la Compra',
      result.message
    )
  }
}

/**
 * Maneja poner un modelo en venta
 */
async function handleSetForSale(price: string) {
  if (!selectedModel.value) return
  
  const result = await setModelForSale(selectedModel.value.id, price)
  
  if (result.success) {
    updateModel(selectedModel.value.id, result.updates!)
    notifySuccess(
      'Modelo en Venta',
      result.message
    )
  } else {
    notifyError(
      'Error al Poner en Venta',
      result.message
    )
  }
}

/**
 * Maneja cancelar la venta de un modelo
 */
async function handleCancelSale() {
  if (!selectedModel.value) return
  
  const result = await cancelModelSale(selectedModel.value.id)
  
  if (result.success) {
    updateModel(selectedModel.value.id, result.updates!)
    notifySuccess(
      'Venta Cancelada',
      result.message
    )
  } else {
    notifyError(
      'Error al Cancelar Venta',
      result.message
    )
  }
}

/**
 * Maneja la transferencia de un modelo
 */
async function handleTransferModel(toAddress: string) {
  if (!selectedModel.value) return
  
  const result = await transferModel(selectedModel.value.id, toAddress)
  
  if (result.success) {
    updateModel(selectedModel.value.id, result.updates!)
    
    // Cerrar modal ya que el usuario ya no es owner
    isDetailsModalOpen.value = false
    selectModel(null)
    
    notifySuccess(
      'Modelo Transferido',
      result.message
    )
  } else {
    notifyError(
      'Error en Transferencia',
      result.message
    )
  }
}

// ========================================
// HANDLERS - LICENCIAS
// ========================================

async function handleCreateLicensePlan(planData: any) {
  if (!selectedModel.value) return
  
  try {
    const result = await createLicensePlan(selectedModel.value.id, planData)
    if (result.success) {
      notifySuccess(
        'Plan de Licencia Creado',
        result.message
      )
      // Recargar modelos para ver el nuevo plan
      await loadModels()
    }
  } catch (err: any) {
    console.error('Error al crear plan de licencia:', err)
    handleBlockchainError(err, 'creación de plan de licencia')
  }
}

async function handleSetPlanActive(planId: number, active: boolean) {
  if (!selectedModel.value) return
  const result = await setPlanActive(selectedModel.value.id, planId, active)
  
  if (result.success) {
    const action = active ? 'activado' : 'desactivado'
    notifySuccess(
      `Plan ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      result.message
    )
  } else {
    notifyError(
      'Error al Cambiar Estado del Plan',
      result.message
    )
  }
}

async function handleBuyLicense(planId: number) {
  if (!selectedModel.value) return
  
  const result = await buyLicense(selectedModel.value.id, planId)
  
  if (result.success) {
    notifySuccess(
      'Licencia Adquirida',
      result.message
    )
    
    // Cerrar modal de compra si está abierto
    if (isBuyModalOpen.value) {
      isBuyModalOpen.value = false
      selectModel(null)
    }
  } else {
    notifyError(
      'Error al Comprar Licencia',
      result.message
    )
  }
}
</script>

<template>
  <div class="min-h-screen w-full bg-gray-50 app-dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <Header 
      v-motion
      :initial="{ opacity: 0, y: -50 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 500, ease: 'easeOut' } }"
    />

    <!-- Main Content -->
    <div class="min-h-screen w-full">
      <div 
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        v-motion
        :initial="{ opacity: 0, y: 30 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 600, ease: 'easeOut', delay: 200 } }"
      >
        <!-- Models Grid Component -->
        <ModelsGrid
          :models="filteredModels"
          :loading="loadingModels"
          :is-connected="isConnected"
          :empty-message="emptyStateMessage.message"
          :empty-sub-message="emptyStateMessage.subMessage"
          @view-details="handleViewDetails"
          @upload-model="handleUploadModel"
        />
        
        <!-- Upload Loading Overlay -->
        <div 
          v-if="isUploadingModel"
          class="fixed inset-0 z-50 flex items-center justify-center bg-white/20 app-dark:bg-black/20 backdrop-blur-lg"
        >
          <div class="bg-white/95 app-dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl p-8 border border-white/20 app-dark:border-gray-700/50">
            <div class="flex flex-col items-center space-y-4">
              <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              <h3 class="text-lg font-medium text-gray-900 app-dark:text-white">Subiendo modelo a blockchain...</h3>
              <p class="text-gray-600 app-dark:text-gray-400 text-center">
                Por favor espera mientras se procesa la transacción
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Model Modal -->
    <UploadModelModal 
      v-if="isUploadModalOpen"
      :is-open="isUploadModalOpen"
      @close="handleCloseUploadModal"
      @submit="handleSubmitModel"
    />

    <!-- Model Details Modal (para propietarios) -->
    <ModelDetailsModal 
      v-if="isDetailsModalOpen"
      :is-open="isDetailsModalOpen"
      :model-id="selectedModel?.id ?? null"
      :user-address="account"
      @close="handleCloseDetailsModal"
      @create-license-plan="handleCreateLicensePlan"
      @set-plan-active="handleSetPlanActive"
      @buy-license="handleBuyLicense"
      @buy-model="handleBuyModel"
      @set-for-sale="handleSetForSale"
      @cancel-sale="handleCancelSale"
      @transfer-model="handleTransferModel"
    />

    <!-- Buy Model Modal (para no propietarios) -->
    <BuyModelModal 
      v-if="isBuyModalOpen"
      :is-open="isBuyModalOpen"
      :model="selectedModel"
      :user-address="account"
      @close="handleCloseBuyModal"
      @buy-model="handleBuyModel"
      @buy-license="handleBuyLicense"
    />
  </div>
</template>

<style scoped>
/* Smooth transitions for dark mode */
* {
  transition-property: background-color, border-color, color;
  transition-duration: 200ms;
  transition-timing-function: ease-in-out;
}
</style>
