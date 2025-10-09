<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWallet } from '../composables/useWallet'
import Header from '../components/ui/header.vue'
import ModelCard from '../components/ui/ModelCard.vue'
import UploadModelModal from '../components/UploadModelModal.vue'
import ModelDetailsModal from '../components/ModelDetailsModal.vue'
import BuyModelModal from '../components/BuyModelModal.vue'
import { getAllModelIds, getModelById } from '../composables/blockchain'
import { fetchMetadata } from '../composables/ipfs'

const { isConnected, account } = useWallet()
const isUploadModalOpen = ref(false)
const isDetailsModalOpen = ref(false)
const isBuyModalOpen = ref(false)
const selectedModelId = ref<number | null>(null)

const models = ref<any[]>([])
const loadingModels = ref(false)

// Computed para obtener el modelo seleccionado completo
const selectedModel = computed(() => {
  if (!selectedModelId.value) return null
  return models.value.find(m => m.id === selectedModelId.value) || null
})

onMounted(async () => {
  loadingModels.value = true
  try {
    const ids = await getAllModelIds()
    if (!ids || ids.length === 0) {
      models.value = []
      return
    }

    // Cargar todos los modelos on-chain en paralelo
    const rawModels = await Promise.all(
      ids.map(async (id: any) => {
        try {
          return await getModelById(id)
        } catch (err) {
          console.warn('No se pudo leer model on-chain', id, err)
          return null
        }
      })
    )

    // Para cada modelo intentar obtener metadata (IPFS). Podemos hacerlo en paralelo.
    const enriched = await Promise.all(
      rawModels.map(async (m: any) => {
        if (!m) return null
        let metadata: any = null
        try {
          metadata = await fetchMetadata(m.id)
        } catch (err) {
          // Si la metadata falla, no abortamos todo; dejamos valores por defecto
          console.debug('No se pudo obtener metadata para', m.id, err)
        }

        // Preferencias: metadata.name > onchain.name
        const displayName = metadata?.name ?? m.name ?? `Model #${m.id}`
        const description = metadata?.description ?? 'Sin descripciÃ³n'
        const category = metadata?.category ?? 'General'
        // Precio legible (ya convertido en getModelById a string en AVAX si existe)
        const priceReadable = (m.forSale ? (m.salePrice ?? m.salePriceWei) : (m.basePrice ?? m.basePriceWei)) ?? null
        const priceText = priceReadable ? `${priceReadable} AVAX` : 'No disponible'

        return {
          id: m.id,
          author: m.author,
          name: displayName,
          description,
          price: priceText,
          priceRaw: priceReadable,
          category,
          ipfsHash: m.ipfsHash,
          tokenURI: m.tokenURI,
        }
      })
    )

    // Filtrar nulos y asignar
    models.value = enriched.filter(Boolean)
  } catch (err) {
    console.error('Error cargando modelos desde la blockchain:', err)
  } finally {
    loadingModels.value = false
  }

  console.log('Modelos transformados:', models.value)
})



const handleUploadModel = () => {
  if (!isConnected.value) {
    return
  }
  isUploadModalOpen.value = true
}

const handleCloseModal = () => {
  isUploadModalOpen.value = false
}

// se tiene que cambiar para que se active cuando se suba el modelo a la BLOCKCHAIN
const handleSubmitModel = (formData: any) => {
  console.log('Modelo a subir:', formData)
  isUploadModalOpen.value = false
  
  const newModel = {
    id: models.value.length + 1,
    name: formData.title,
    description: formData.description,
    price: `${formData.price} AVAX`,
    category: formData.category
  }
  models.value.push(newModel)
  
}


const handleViewDetails = (modelId: number) => {
  selectedModelId.value = modelId
  
  // Determinar si mostrar modal de detalles o de compra
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

const handleCloseDetailsModal = () => {
  isDetailsModalOpen.value = false
  selectedModelId.value = null
}

const handleCloseBuyModal = () => {
  isBuyModalOpen.value = false
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
  // Cerrar modal de compra si viene de allí
  if (isBuyModalOpen.value) {
    isBuyModalOpen.value = false
    selectedModelId.value = null
  }
}

const handleBuyModel = () => {
  console.log('buyModel:', selectedModelId.value)
  const model = selectedModel.value
  if (model) {
    alert(`Modelo "${model.name}" comprado exitosamente por ${model.price}!`)
    // Cerrar modal de compra
    isBuyModalOpen.value = false
    selectedModelId.value = null
    // Aquí puedes recargar los modelos o actualizar el estado
  }
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
</script>

<template>
  <div class="min-h-screen w-full bg-gray-50 app-dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <Header />

    <!-- Main Content -->
    <div class="min-h-screen w-full">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Upload Model Button -->
        <div class="flex justify-end py-4 sm:py-6">
          <button 
            @click="handleUploadModel"
            :disabled="!isConnected"
            class="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base bg-green-500 app-dark:bg-green-600 text-white rounded-lg font-medium hover:bg-green-600 app-dark:hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            <span class="hidden sm:inline">{{ isConnected ? 'Subir Modelo' : 'Conecta tu Wallet para Subir' }}</span>
            <span class="sm:hidden">{{ isConnected ? 'Subir' : 'Conectar' }}</span>
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loadingModels" class="flex flex-col items-center justify-center py-20">
          <div class="relative">
            <!-- Spinner externo -->
            <div class="w-20 h-20 border-4 border-blue-200 app-dark:border-blue-900 rounded-full animate-spin border-t-blue-600 app-dark:border-t-blue-400"></div>
            <!-- Spinner interno -->
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div class="w-12 h-12 border-4 border-purple-200 app-dark:border-purple-900 rounded-full animate-spin border-t-purple-600 app-dark:border-t-purple-400" style="animation-direction: reverse; animation-duration: 1s;"></div>
            </div>
          </div>
          <p class="mt-6 text-gray-600 app-dark:text-gray-400 text-lg font-medium animate-pulse">
            Cargando modelos desde la blockchain...
          </p>
          <p class="mt-2 text-gray-500 app-dark:text-gray-500 text-sm">
            Esto puede tomar unos segundos
          </p>
        </div>

        <!-- Models Grid -->
        <div v-else-if="!loadingModels && models.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-8">
          <ModelCard
            v-for="model in models"
            :key="model.id"
            :model="model"
            :is-connected="isConnected"
            @view-details="handleViewDetails"
          />
        </div>

        <!-- Empty State (solo cuando terminó de cargar y no hay modelos) -->
        <div 
          v-else-if="!loadingModels && models.length === 0"
          class="text-center py-20"
        >
          <div class="mb-6">
            <svg class="w-24 h-24 mx-auto text-gray-300 app-dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 class="text-xl sm:text-2xl font-bold text-gray-900 app-dark:text-gray-100 mb-3">
            No hay modelos disponibles
          </h3>
          <p class="text-gray-500 app-dark:text-gray-400 text-base sm:text-lg mb-6 max-w-md mx-auto">
            Sé el primero en subir un modelo de IA al marketplace
          </p>
          <button
            v-if="isConnected"
            @click="handleUploadModel"
            class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Subir Primer Modelo
          </button>
          <button
            v-else
            class="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 app-dark:bg-gray-700 text-gray-600 app-dark:text-gray-300 rounded-lg font-medium cursor-not-allowed"
            disabled
          >
            Conecta tu wallet para subir modelos
          </button>
        </div>
      </div>
    </div>

    <!-- Upload Model Modal -->
    <UploadModelModal 
      v-if="isUploadModalOpen"
      :is-open="isUploadModalOpen"
      @close="handleCloseModal"
      @submit="handleSubmitModel"
    />

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

    <!-- Buy Model Modal -->
    <BuyModelModal 
      v-if="isBuyModalOpen"
      :is-open="isBuyModalOpen"
      :model="selectedModel"
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

/* Spinner animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1.5s linear infinite;
}

/* Pulse animation for loading text */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>