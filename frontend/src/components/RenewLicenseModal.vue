<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNotifications } from '../composables/useNotifications'
import { useBlockchainErrorHandler } from '../composables/useBlockchainErrorHandler'
import { buyLicense } from '../composables/blockchain'
import { ethers } from 'ethers'

interface LicensePlan {
  id: number
  name: string
  price: string
  priceWei?: string
  duration: number
  active: boolean
}

interface RenewLicenseData {
  modelId: number
  licenseId: string
  modelName: string
  currentPlan: string
  availablePlans: LicensePlan[]
}

const props = defineProps<{
  isOpen: boolean
  licenseData: RenewLicenseData | null
}>()

const emit = defineEmits<{
  close: []
  success: [planId: number]
}>()

const selectedPlanId = ref<number | null>(null)
const isProcessing = ref(false)

const { notifyTransactionSuccess } = useNotifications()
const { handleAsyncOperation } = useBlockchainErrorHandler()

const selectedPlan = computed(() => {
  if (!selectedPlanId.value || !props.licenseData) return null
  return props.licenseData.availablePlans.find(p => p.id === selectedPlanId.value) || null
})

const canRenew = computed(() => {
  return selectedPlan.value && !isProcessing.value
})

const handleRenew = async () => {
  if (!canRenew.value || !props.licenseData || !selectedPlan.value) return

  isProcessing.value = true
  
  try {
    // Obtener precio en wei
    let priceWei: any = selectedPlan.value.priceWei
    if (!priceWei) {
      const priceAvax = String(selectedPlan.value.price)
      priceWei = ethers.parseEther ? ethers.parseEther(priceAvax) : (ethers as any).utils.parseEther(priceAvax)
    }

    // Comprar nueva licencia (equivalente a renovar)
    const receipt = await buyLicense(props.licenseData.modelId, selectedPlan.value.id, priceWei)
    console.log('License renewal receipt:', receipt)

    notifyTransactionSuccess(
      'Licencia Renovada',
      `Has renovado exitosamente tu licencia del plan "${selectedPlan.value.name}" por ${selectedPlan.value.price} AVAX`
    )

    emit('success', selectedPlan.value.id)
    handleClose()
  } catch (err: any) {
    console.error('Error renovando licencia:', err)
    await handleAsyncOperation(
      () => Promise.reject(err),
      'renovación de licencia'
    )
  } finally {
    isProcessing.value = false
  }
}

const handleClose = () => {
  if (!isProcessing.value) {
    selectedPlanId.value = null
    emit('close')
  }
}

const formatDuration = (days: number) => {
  if (days === 1) return '1 día'
  if (days < 30) return `${days} días`
  if (days === 30) return '1 mes'
  if (days < 365) return `${Math.round(days / 30)} meses`
  return `${Math.round(days / 365)} años`
}
</script>

<template>
  <Transition name="modal" appear>
    <div 
      v-if="isOpen && licenseData"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 app-dark:bg-black/20 backdrop-blur-lg modal-backdrop"
      @click.self="handleClose"
      v-motion
      :initial="{ opacity: 0 }"
      :enter="{ opacity: 1, transition: { duration: 300 } }"
      :leave="{ opacity: 0, transition: { duration: 200 } }"
    >
      <div 
        class="w-full max-w-2xl bg-white/95 app-dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden border border-white/20 app-dark:border-gray-700/50"
        v-motion
        :initial="{ scale: 0.9, y: 50 }"
        :enter="{ scale: 1, y: 0, transition: { duration: 400, ease: 'easeOut' } }"
        :leave="{ scale: 0.9, y: 50, transition: { duration: 200, ease: 'easeIn' } }"
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-green-500 to-blue-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 class="text-white font-bold text-2xl">Renovar Licencia</h2>
            <p class="text-green-100 text-sm mt-1">{{ licenseData.modelName }}</p>
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

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Current License Info -->
          <div class="bg-gray-50 app-dark:bg-gray-800 rounded-lg p-4">
            <h3 class="font-semibold text-gray-900 app-dark:text-white mb-2">
              Licencia Actual
            </h3>
            <p class="text-gray-600 app-dark:text-gray-400">
              Plan: <span class="font-medium text-gray-900 app-dark:text-white">{{ licenseData.currentPlan }}</span>
            </p>
            <p class="text-sm text-gray-500 app-dark:text-gray-500 mt-1">
              Al renovar, obtendrás una nueva licencia con duración completa
            </p>
          </div>

          <!-- Available Plans -->
          <div>
            <h3 class="font-semibold text-gray-900 app-dark:text-white mb-4">
              Selecciona un Plan para Renovar
            </h3>
            
            <div v-if="licenseData.availablePlans.length === 0" class="text-center py-8 bg-gray-50 app-dark:bg-gray-800 rounded-lg">
              <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p class="text-gray-500 app-dark:text-gray-400">
                No hay planes de renovación disponibles
              </p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="plan in licenseData.availablePlans"
                :key="plan.id"
                @click="selectedPlanId = plan.id"
                :class="[
                  'border-2 rounded-lg p-4 cursor-pointer transition-all',
                  selectedPlanId === plan.id
                    ? 'border-green-500 bg-green-50 app-dark:bg-green-900/20 app-dark:border-green-400'
                    : 'border-gray-200 app-dark:border-gray-700 hover:border-gray-300 app-dark:hover:border-gray-600 bg-white app-dark:bg-gray-800'
                ]"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <h4 class="font-semibold text-gray-900 app-dark:text-white">
                        {{ plan.name }}
                      </h4>
                      <div 
                        :class="[
                          'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                          selectedPlanId === plan.id
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300 app-dark:border-gray-600'
                        ]"
                      >
                        <svg 
                          v-if="selectedPlanId === plan.id"
                          class="w-3 h-3 text-white" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <p class="text-sm text-gray-600 app-dark:text-gray-400 mb-2">
                      Duración: {{ formatDuration(plan.duration) }}
                    </p>
                  </div>
                  <div class="text-right">
                    <div class="text-2xl font-bold text-gray-900 app-dark:text-white">
                      {{ plan.price }}
                    </div>
                    <div class="text-sm text-gray-500 app-dark:text-gray-400">
                      AVAX
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Plan Summary -->
          <div v-if="selectedPlan" class="bg-green-50 app-dark:bg-green-900/20 border border-green-200 app-dark:border-green-700 rounded-lg p-4">
            <h4 class="font-semibold text-green-900 app-dark:text-green-100 mb-2">
              Resumen de Renovación
            </h4>
            <div class="space-y-1 text-sm text-green-800 app-dark:text-green-200">
              <p>Plan: <span class="font-medium">{{ selectedPlan.name }}</span></p>
              <p>Duración: <span class="font-medium">{{ formatDuration(selectedPlan.duration) }}</span></p>
              <p>Precio: <span class="font-medium">{{ selectedPlan.price }} AVAX</span></p>
            </div>
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
              @click="handleRenew"
              :disabled="!canRenew"
              class="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg v-if="isProcessing" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isProcessing ? 'Renovando...' : 'Renovar Licencia' }}</span>
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
</style>