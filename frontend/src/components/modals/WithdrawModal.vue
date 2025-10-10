<script setup lang="ts">
import { ref } from 'vue'
import { withdraw } from '../../composables/blockchain'
import { useNotifications } from '../../composables/useNotifications'
import { useBlockchainErrorHandler } from '../../composables/useBlockchainErrorHandler'

defineProps<{
  isOpen: boolean
  availableBalance: string
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const isWithdrawing = ref(false)
const { notifyTransactionSuccess } = useNotifications()
const { handleAsyncOperation } = useBlockchainErrorHandler()

const handleWithdraw = async () => {
  try {
    isWithdrawing.value = true

    // Llamar a la función withdraw del contrato
    const receipt = await withdraw()
    console.log('Retiro exitoso:', receipt)
    
    notifyTransactionSuccess(
      'Retiro Exitoso',
      `Tu retiro ha sido procesado exitosamente. Hash: ${receipt.hash || receipt.transactionHash}`
    )
    
    // Emitir evento de éxito para actualizar el balance
    emit('success')
    emit('close')
  } catch (err: any) {
    console.error('Error al retirar fondos:', err)
    handleAsyncOperation(
      () => Promise.reject(err),
      'retiro de fondos'
    )
  } finally {
    isWithdrawing.value = false
  }
}

const handleClose = () => {
  if (!isWithdrawing.value) {
    emit('close')
  }
}
</script>

<template>
  <Transition name="modal" appear>
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/20 app-dark:bg-black/20 backdrop-blur-lg modal-backdrop"
      @click.self="handleClose"
      v-motion
      :initial="{ opacity: 0 }"
      :enter="{ opacity: 1, transition: { duration: 300 } }"
      :leave="{ opacity: 0, transition: { duration: 200 } }"
    >
      <div 
        class="w-full max-w-md bg-white/95 app-dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden border border-white/20 app-dark:border-gray-700/50"
        v-motion
        :initial="{ scale: 0.9, y: 50 }"
        :enter="{ scale: 1, y: 0, transition: { duration: 400, ease: 'easeOut' } }"
        :leave="{ scale: 0.9, y: 50, transition: { duration: 200, ease: 'easeIn' } }"
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 flex justify-between items-center">
          <h2 class="text-white font-bold text-xl">Retirar Fondos</h2>
          <button
            @click="handleClose"
            :disabled="isWithdrawing"
            class="text-white hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <!-- Balance Info -->
          <div class="bg-blue-50 app-dark:bg-blue-900/20 border border-blue-200 app-dark:border-blue-800 rounded-lg p-4">
            <div class="text-sm text-blue-600 app-dark:text-blue-400 mb-1">Balance Disponible para Retiro</div>
            <div class="text-2xl font-bold text-blue-900 app-dark:text-blue-100">{{ availableBalance }} AVAX</div>
          </div>

          <!-- Explanation -->
          <div class="bg-gray-50 app-dark:bg-gray-800 border border-gray-200 app-dark:border-gray-700 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <svg class="w-6 h-6 text-blue-600 app-dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div class="text-sm text-gray-700 app-dark:text-gray-300">
                <p class="font-semibold mb-2">¿Qué es el retiro de fondos?</p>
                <ul class="space-y-1 list-disc list-inside">
                  <li>Esta función retira tus ganancias acumuladas del contrato</li>
                  <li>Los fondos provienen de ventas de modelos y licencias</li>
                  <li>El retiro se enviará a tu wallet conectada</li>
                  <li>La transacción requiere confirmación en MetaMask</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Warning -->
          <div class="bg-yellow-50 app-dark:bg-yellow-900/20 border border-yellow-300 app-dark:border-yellow-700 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <svg class="w-5 h-5 text-yellow-600 app-dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <div class="text-xs text-yellow-800 app-dark:text-yellow-200">
                <p class="font-semibold mb-1">Importante</p>
                <p>Solo puedes retirar fondos si tienes un balance disponible en el contrato. Asegúrate de tener suficiente AVAX para pagar las tarifas de gas.</p>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="handleClose"
              :disabled="isWithdrawing"
              class="flex-1 px-4 py-2.5 bg-gray-200 app-dark:bg-gray-700 text-gray-900 app-dark:text-white rounded-lg font-medium hover:bg-gray-300 app-dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="handleWithdraw"
              :disabled="isWithdrawing"
              class="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="!isWithdrawing" class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Retirar Fondos
              </span>
              <span v-else class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Procesando...
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Modal transitions */
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
