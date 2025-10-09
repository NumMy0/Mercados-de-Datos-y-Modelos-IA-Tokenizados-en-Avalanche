<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useWallet } from '../composables/useWallet'
import Header from '../components/ui/header.vue'
import ModelCard from '../components/ui/ModelCard.vue'
import UploadModelModal from '../components/UploadModelModal.vue'
import ModelDetailsModal from '../components/ModelDetailsModal.vue'
import BuyModelModal from '../components/BuyModelModal.vue'
import { getAllModelIds, getModelById } from '../composables/blockchain'

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
    if (ids && ids.length) {
      const fetched = await Promise.all(ids.map((id: any) => getModelById(id)))
      // Transformar los datos de la blockchain al formato esperado
      models.value = fetched.map(model => ({
        id: model.id,
        name: model.name || model.modelName || `Model #${model.id}`,
        description: model.description || model.modelDescription || 'Sin descripción',
        price: model.price ? `${model.price} AVAX` : 'No disponible',
        category: model.category || model.modelCategory || 'General',
        owner: model.owner || '0x0000000000000000000000000000000000000000',
        forSale: model.forSale || false
      }))
    }
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

        <!-- Models Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-8">
          <ModelCard
            v-for="model in models"
            :key="model.id"
            :model="model"
            :is-connected="isConnected"
            @view-details="handleViewDetails"
          />
        </div>

        <!-- Empty State if no models -->
        <div 
          v-if="models.length === 0"
          class="text-center py-12 sm:py-16"
        >
          <p class="text-gray-500 app-dark:text-gray-400 text-base sm:text-lg">
            No hay modelos disponibles en este momento
          </p>
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