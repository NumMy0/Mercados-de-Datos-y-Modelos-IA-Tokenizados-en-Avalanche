<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWallet } from '../composables/useWallet'
import { useRouter } from 'vue-router'
import Header from '../components/ui/header.vue'
import ModelCard from '../components/ui/ModelCard.vue'
import ModelDetailsModal from '../components/ModelDetailsModal.vue'
import { getAllModelIds, getModelById } from '../composables/blockchain'

const { isConnected, account } = useWallet()
const router = useRouter()

// State
const activeTab = ref<'models' | 'licenses'>('models')
const isDetailsModalOpen = ref(false)
const selectedModelId = ref<number | null>(null)
const userModels = ref<any[]>([])
const userLicenses = ref<any[]>([])
const loadingModels = ref(false)
const loadingLicenses = ref(false)
const walletBalance = ref('0.00')

// Computed
const truncatedAddress = computed(() => {
  if (!account.value) return ''
  return `${account.value.slice(0, 10)}...${account.value.slice(-8)}`
})

// Load user data
onMounted(async () => {
  if (!isConnected.value) {
    router.push('/')
    return
  }
  
  await loadUserModels()
  await loadUserLicenses()
  await loadWalletBalance()
})

const loadUserModels = async () => {
  loadingModels.value = true
  try {
    const ids = await getAllModelIds()
    if (ids && ids.length) {
      const fetched = await Promise.all(ids.map((id: any) => getModelById(id)))
      
      // Filtrar solo los modelos que pertenecen al usuario
      userModels.value = fetched
        .filter((model: any) => model.owner?.toLowerCase() === account.value?.toLowerCase())
        .map((model: any) => ({
          id: model.id || model.modelId,
          name: model.name || model.modelName || `Model #${model.id}`,
          description: model.description || model.modelDescription || 'Sin descripción',
          price: model.price ? `${model.price} AVAX` : 'No disponible',
          category: model.category || model.modelCategory || 'General',
          forSale: model.forSale || false
        }))
    }
  } catch (err) {
    console.error('Error cargando modelos del usuario:', err)
  } finally {
    loadingModels.value = false
  }
}

const loadUserLicenses = async () => {
  loadingLicenses.value = true
  try {
    // TODO: Implementar función para obtener licencias del usuario desde blockchain
    // Simulación temporal
    userLicenses.value = [
      {
        id: 1,
        modelId: 1,
        modelName: 'ResNet-50 Classification',
        planName: 'Plan Básico',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        isActive: true,
        usageCount: 1250,
        usageLimit: 5000
      },
      {
        id: 2,
        modelId: 3,
        modelName: 'GPT-2 Text Generator',
        planName: 'Plan Premium',
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        isActive: true,
        usageCount: 340,
        usageLimit: 10000
      }
    ]
  } catch (err) {
    console.error('Error cargando licencias:', err)
  } finally {
    loadingLicenses.value = false
  }
}

const loadWalletBalance = async () => {
  try {
    if (window.ethereum && account.value) {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [account.value, 'latest']
      })
      // Convertir de Wei a AVAX
      const balanceInAvax = parseInt(balance, 16) / 1e18
      walletBalance.value = balanceInAvax.toFixed(4)
    }
  } catch (err) {
    console.error('Error obteniendo balance:', err)
  }
}

const copyAddress = () => {
  if (account.value) {
    navigator.clipboard.writeText(account.value)
    alert('Dirección copiada al portapapeles')
  }
}

const handleViewDetails = (modelId: number) => {
  selectedModelId.value = modelId
  // En el perfil, el usuario siempre es propietario de sus modelos
  isDetailsModalOpen.value = true
}

const handleCloseDetailsModal = () => {
  isDetailsModalOpen.value = false
  selectedModelId.value = null
}

const handleCreateLicensePlan = (planData: any) => {
  console.log('createLicensePlan:', planData)
  alert(`Plan de licencia "${planData.name}" creado exitosamente!`)
}

const handleSetPlanActive = (planId: number, active: boolean) => {
  console.log('setPlanActive:', { planId, active })
  alert(`Plan ${active ? 'activado' : 'desactivado'} exitosamente!`)
}

const handleBuyLicense = (planId: number) => {
  console.log('buyLicense:', { modelId: selectedModelId.value, planId })
  alert('Licencia comprada exitosamente!')
}

const handleBuyModel = () => {
  console.log('buyModel:', selectedModelId.value)
  alert('Modelo comprado exitosamente!')
}

const handleSetForSale = (price: string) => {
  console.log('setModelForSale:', { modelId: selectedModelId.value, price })
  alert(`Modelo puesto en venta por ${price} AVAX`)
}

const handleCancelSale = () => {
  console.log('cancelSale:', selectedModelId.value)
  alert('Venta cancelada exitosamente!')
}

const handleTransferModel = (toAddress: string) => {
  console.log('transferModel:', { to: toAddress, modelId: selectedModelId.value })
  alert(`Modelo transferido a ${toAddress}`)
}

const getUsagePercentage = (used: number, limit: number) => {
  return (used / limit) * 100
}

const getUsageColor = (percentage: number) => {
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 70) return 'bg-yellow-500'
  return 'bg-green-500'
}
</script>

<template>
  <div class="min-h-screen w-full bg-gray-50 app-dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <Header />

    <!-- Main Content -->
    <div class="min-h-screen w-full py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Profile Header -->
        <div class="bg-white app-dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 app-dark:border-gray-700">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <!-- User Info -->
            <div class="flex items-center gap-4">
              <!-- Avatar -->
              <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {{ account?.slice(2, 4).toUpperCase() }}
              </div>
              
              <!-- Details -->
              <div>
                <h1 class="text-2xl font-bold text-gray-900 app-dark:text-gray-100 mb-2">
                  Mi Perfil
                </h1>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-600 app-dark:text-gray-400 font-mono">
                    {{ truncatedAddress }}
                  </span>
                  <button
                    @click="copyAddress"
                    class="p-1 hover:bg-gray-100 app-dark:hover:bg-gray-700 rounded transition-colors"
                    title="Copiar dirección completa"
                  >
                    <svg class="w-4 h-4 text-gray-600 app-dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Wallet Stats -->
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
              <!-- Balance -->
              <div class="bg-gradient-to-br from-blue-50 to-blue-100 app-dark:from-blue-900/20 app-dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 app-dark:border-blue-800">
                <div class="text-xs text-blue-600 app-dark:text-blue-400 font-medium mb-1">Balance</div>
                <div class="text-xl font-bold text-blue-900 app-dark:text-blue-100">{{ walletBalance }} AVAX</div>
              </div>

              <!-- Models Owned -->
              <div class="bg-gradient-to-br from-purple-50 to-purple-100 app-dark:from-purple-900/20 app-dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 app-dark:border-purple-800">
                <div class="text-xs text-purple-600 app-dark:text-purple-400 font-medium mb-1">Mis Modelos</div>
                <div class="text-xl font-bold text-purple-900 app-dark:text-purple-100">{{ userModels.length }}</div>
              </div>

              <!-- Active Licenses -->
              <div class="bg-gradient-to-br from-green-50 to-green-100 app-dark:from-green-900/20 app-dark:to-green-800/20 p-4 rounded-lg border border-green-200 app-dark:border-green-800">
                <div class="text-xs text-green-600 app-dark:text-green-400 font-medium mb-1">Licencias Activas</div>
                <div class="text-xl font-bold text-green-900 app-dark:text-green-100">{{ userLicenses.filter(l => l.isActive).length }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="mb-6">
          <div class="border-b border-gray-200 app-dark:border-gray-700">
            <nav class="flex gap-8">
              <button
                @click="activeTab = 'models'"
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
                @click="activeTab = 'licenses'"
                :class="[
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === 'licenses'
                    ? 'border-blue-500 text-blue-600 app-dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 app-dark:text-gray-400 app-dark:hover:text-gray-300'
                ]"
              >
                Mis Licencias ({{ userLicenses.length }})
              </button>
            </nav>
          </div>
        </div>

        <!-- Tab Content -->
        <div v-if="activeTab === 'models'">
          <!-- Loading State -->
          <div v-if="loadingModels" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600 app-dark:text-gray-400">Cargando tus modelos...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="userModels.length === 0" class="text-center py-12 bg-white app-dark:bg-gray-800 rounded-xl border border-gray-200 app-dark:border-gray-700">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
            <h3 class="text-lg font-semibold text-gray-900 app-dark:text-gray-100 mb-2">No tienes modelos</h3>
            <p class="text-gray-600 app-dark:text-gray-400 mb-4">Sube tu primer modelo para comenzar</p>
            <button
              @click="$router.push('/models')"
              class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Explorar Modelos
            </button>
          </div>

          <!-- Models Grid -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ModelCard
              v-for="model in userModels"
              :key="model.id"
              :model="model"
              :is-connected="isConnected"
              @view-details="handleViewDetails"
            />
          </div>
        </div>

        <div v-else-if="activeTab === 'licenses'">
          <!-- Loading State -->
          <div v-if="loadingLicenses" class="text-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600 app-dark:text-gray-400">Cargando tus licencias...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="userLicenses.length === 0" class="text-center py-12 bg-white app-dark:bg-gray-800 rounded-xl border border-gray-200 app-dark:border-gray-700">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h3 class="text-lg font-semibold text-gray-900 app-dark:text-gray-100 mb-2">No tienes licencias</h3>
            <p class="text-gray-600 app-dark:text-gray-400 mb-4">Compra una licencia para acceder a modelos</p>
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
              v-for="license in userLicenses"
              :key="license.id"
              class="bg-white app-dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 app-dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <!-- License Info -->
                <div class="flex-1">
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
                  
                  <p class="text-sm text-gray-600 app-dark:text-gray-400 mb-3">
                    Plan: <span class="font-medium">{{ license.planName }}</span>
                  </p>

                  <!-- Usage Progress -->
                  <div class="mb-2">
                    <div class="flex justify-between text-xs text-gray-600 app-dark:text-gray-400 mb-1">
                      <span>Uso: {{ license.usageCount }} / {{ license.usageLimit }}</span>
                      <span>{{ Math.round(getUsagePercentage(license.usageCount, license.usageLimit)) }}%</span>
                    </div>
                    <div class="w-full bg-gray-200 app-dark:bg-gray-700 rounded-full h-2">
                      <div
                        :class="[
                          'h-2 rounded-full transition-all',
                          getUsageColor(getUsagePercentage(license.usageCount, license.usageLimit))
                        ]"
                        :style="{ width: `${getUsagePercentage(license.usageCount, license.usageLimit)}%` }"
                      ></div>
                    </div>
                  </div>

                  <p class="text-xs text-gray-500 app-dark:text-gray-500">
                    Expira: {{ license.expiryDate }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="flex flex-col gap-2">
                  <button
                    @click="handleViewDetails(license.modelId)"
                    class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Ver Modelo
                  </button>
                  <button
                    v-if="!license.isActive"
                    class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Renovar Licencia
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Model Details Modal -->
    <ModelDetailsModal 
      v-if="isDetailsModalOpen"
      :is-open="isDetailsModalOpen"
      :model-id="selectedModelId"
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
