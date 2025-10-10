<!--
  Vista: ProfilePage (REFACTORIZADO)
  
  RESPONSABILIDAD ÚNICA: COORDINAR composables y componentes del perfil
  
  Delega toda la lógica compleja:
  - useWallet → Conexión de wallet
  - useModels → Carga y filtrado de modelos del usuario
  - useUserProfile → Balance, licencias, stats del usuario
  - useModelActions → Operaciones blockchain
  - ProfileHeader → Renderizado de cabecera
  - ModelsGrid → Renderizado de modelos
  - LicensesList → Renderizado de licencias
  
  Este componente solo:
  1. Inicializa composables
  2. Carga datos en onMounted
  3. Maneja cambio de tabs
  4. Maneja apertura/cierre de modals
  5. Coordina eventos entre componentes
-->

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWallet } from '../composables/useWallet'
import { useModels } from '../composables/useModels'
import { useUserProfile } from '../composables/useUserProfile'
import { useModelActions } from '../composables/useModelActions'
import Header from '../components/ui/header.vue'
import ProfileHeader from '../components/ProfileHeader.vue'
import ModelsGrid from '../components/ModelsGrid.vue'
import LicensesList from '../components/LicensesList.vue'
import ModelDetailsModal from '../components/ModelDetailsModal.vue'
import WithdrawModal from '../components/WithdrawModal.vue'

// ========================================
// COMPOSABLES
// ========================================

const router = useRouter()
const { isConnected, account } = useWallet()

// Gestión de modelos del usuario
const {
  models,
  loadingModels,
  selectedModel,
  loadModels,
  selectModel,
  updateModel
} = useModels(account)

// Gestión de perfil (balance, licencias, stats)
const {
  walletBalance,
  pendingWithdrawal,
  licenses,
  loadingLicenses,
  truncatedAddress,
  activeLicensesCount,
  loadWalletBalance,
  loadPendingWithdrawal,
  loadUserLicenses,
  refreshAfterWithdrawal,
  copyAddressToClipboard
} = useUserProfile(account)

// Operaciones blockchain
const {
  createLicensePlan,
  setPlanActive,
  buyLicense,
  setModelForSale,
  cancelModelSale,
  transferModel
} = useModelActions()

// ========================================
// ESTADO LOCAL
// ========================================

const activeTab = ref<'models' | 'licenses'>('models')
const isDetailsModalOpen = ref(false)
const showWithdrawModal = ref(false)

// ========================================
// COMPUTED PROPERTIES
// ========================================

/**
 * Filtra solo los modelos que pertenecen al usuario conectado
 */
const userModels = computed(() => {
  if (!account.value) return []
  
  return models.value.filter(model => {
    const ownerAddr = model.author || model.owner
    if (!ownerAddr) return false
    
    try {
      return ownerAddr.toLowerCase() === account.value!.toLowerCase()
    } catch (e) {
      return false
    }
  })
})

/**
 * Mensaje personalizado para estado vacío de modelos
 */
const modelsEmptyMessage = computed(() => ({
  message: 'No tienes modelos',
  subMessage: 'Sube tu primer modelo para comenzar'
}))

// ========================================
// CICLO DE VIDA
// ========================================

onMounted(async () => {
  // Verificar que el usuario esté conectado
  if (!isConnected.value) {
    router.push('/')
    return
  }
  
  // Cargar todos los datos del perfil en paralelo
  await Promise.all([
    loadModels(),
    loadUserLicenses(),
    loadWalletBalance(),
    loadPendingWithdrawal()
  ])
})

// ========================================
// HANDLERS - NAVEGACIÓN
// ========================================

function handleChangeTab(tab: 'models' | 'licenses') {
  activeTab.value = tab
}

// ========================================
// HANDLERS - MODALS
// ========================================

function handleViewModelDetails(modelId: number) {
  selectModel(modelId)
  isDetailsModalOpen.value = true
}

function handleCloseDetailsModal() {
  isDetailsModalOpen.value = false
  selectModel(null)
}

function handleOpenWithdrawModal() {
  // Refrescar monto pendiente antes de mostrar
  loadPendingWithdrawal().then(() => {
    showWithdrawModal.value = true
  })
}

function handleCloseWithdrawModal() {
  showWithdrawModal.value = false
}

// ========================================
// HANDLERS - ACCIONES DE PERFIL
// ========================================

async function handleCopyAddress() {
  const success = await copyAddressToClipboard()
  if (success) {
    alert('Dirección copiada al portapapeles')
  } else {
    alert('Error al copiar dirección')
  }
}

async function handleWithdrawSuccess() {
  // Actualizar balance y fondos pendientes después del retiro
  await refreshAfterWithdrawal()
  showWithdrawModal.value = false
}

// ========================================
// HANDLERS - ACCIONES DE MODELOS
// ========================================

async function handleCreateLicensePlan(planData: any) {
  if (!selectedModel.value) return
  
  const result = await createLicensePlan(selectedModel.value.id, planData)
  alert(result.message)
}

async function handleSetPlanActive(planId: number, active: boolean) {
  if (!selectedModel.value) return
  const result = await setPlanActive(selectedModel.value.id, planId, active)
  alert(result.message)
}

async function handleBuyLicense(planId: number) {
  if (!selectedModel.value) return
  
  const result = await buyLicense(selectedModel.value.id, planId)
  alert(result.message)
  
  // Recargar licencias si la compra fue exitosa
  if (result.success) {
    await loadUserLicenses()
  }
}

async function handleSetForSale(price: string) {
  if (!selectedModel.value) return
  
  const result = await setModelForSale(selectedModel.value.id, price)
  
  if (result.success) {
    updateModel(selectedModel.value.id, result.updates!)
    alert(result.message)
  } else {
    alert(result.message)
  }
}

async function handleCancelSale() {
  if (!selectedModel.value) return
  
  const result = await cancelModelSale(selectedModel.value.id)
  
  if (result.success) {
    updateModel(selectedModel.value.id, result.updates!)
    alert(result.message)
  } else {
    alert(result.message)
  }
}

async function handleTransferModel(toAddress: string) {
  if (!selectedModel.value) return
  
  const result = await transferModel(selectedModel.value.id, toAddress)
  
  if (result.success) {
    // Cerrar modal ya que el usuario ya no es owner
    isDetailsModalOpen.value = false
    selectModel(null)
    
    // Recargar modelos para actualizar la lista
    await loadModels()
    
    alert(result.message)
  } else {
    alert(result.message)
  }
}

// ========================================
// HANDLERS - ACCIONES DE LICENCIAS
// ========================================

function handleViewModelFromLicense(modelId: number) {
  handleViewModelDetails(modelId)
}

function handleRenewLicense(payload: { modelId: number; licenseId: string }) {
  console.log('Renovar licencia:', payload)
  // TODO: Implementar renovación de licencia
  alert('Funcionalidad de renovación en desarrollo')
}

// Handler placeholder para compatibilidad con ModelDetailsModal
function handleBuyModel() {
  console.log('Compra de modelo no disponible en perfil (ya es propietario)')
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
    <div class="min-h-screen w-full py-8">
      <div 
        class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        v-motion
        :initial="{ opacity: 0, y: 30 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 600, ease: 'easeOut', delay: 200 } }"
      >
        
        <!-- Profile Header Component -->
        <ProfileHeader
          :address="account"
          :truncated-address="truncatedAddress"
          :wallet-balance="walletBalance"
          :models-count="userModels.length"
          :licenses-count="activeLicensesCount"
          @copy-address="handleCopyAddress"
          @open-withdraw="handleOpenWithdrawModal"
          v-motion
          :initial="{ opacity: 0, scale: 0.95 }"
          :enter="{ opacity: 1, scale: 1, transition: { duration: 500, ease: 'easeOut', delay: 300 } }"
        />

        <!-- Tabs Navigation -->
        <div 
          class="mb-6"
          v-motion
          :initial="{ opacity: 0, x: -50 }"
          :enter="{ opacity: 1, x: 0, transition: { duration: 500, ease: 'easeOut', delay: 400 } }"
        >
          <div class="border-b border-gray-200 app-dark:border-gray-700">
            <nav class="flex gap-8">
              <button
                @click="handleChangeTab('models')"
                :class="[
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === 'models'
                    ? 'border-blue-500 text-blue-600 app-dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 app-dark:text-gray-400 app-dark:hover:text-gray-300'
                ]"
              >
                Mis Modelos ({{ userModels.length }})
              </button>
              <button
                @click="handleChangeTab('licenses')"
                :class="[
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === 'licenses'
                    ? 'border-blue-500 text-blue-600 app-dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 app-dark:text-gray-400 app-dark:hover:text-gray-300'
                ]"
              >
                Mis Licencias ({{ licenses.length }})
              </button>
            </nav>
          </div>
        </div>

        <!-- Tab Content: Modelos -->
        <div v-if="activeTab === 'models'">
          <ModelsGrid
            :models="userModels"
            :loading="loadingModels"
            :is-connected="isConnected"
            :show-upload-button="false"
            :empty-message="modelsEmptyMessage.message"
            :empty-sub-message="modelsEmptyMessage.subMessage"
            @view-details="handleViewModelDetails"
          />
        </div>

        <!-- Tab Content: Licencias -->
        <div v-else-if="activeTab === 'licenses'">
          <LicensesList
            :licenses="licenses"
            :loading="loadingLicenses"
            @view-model="handleViewModelFromLicense"
            @renew-license="handleRenewLicense"
          />
        </div>
      </div>
    </div>

    <!-- Withdraw Modal -->
    <WithdrawModal
      :is-open="showWithdrawModal"
      :available-balance="pendingWithdrawal.readable ?? walletBalance"
      @close="handleCloseWithdrawModal"
      @success="handleWithdrawSuccess"
    />

    <!-- Model Details Modal -->
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
  </div>
</template>

<style scoped>
/* Smooth transitions */
* {
  transition-property: background-color, border-color, color, box-shadow;
  transition-duration: 200ms;
  transition-timing-function: ease-in-out;
}
</style>
