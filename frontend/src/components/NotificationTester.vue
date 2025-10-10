<script setup lang="ts">
import { useNotifications } from '../composables/useNotifications'
import { useBlockchainErrorHandler } from '../composables/useBlockchainErrorHandler'

const { 
  notifySuccess, 
  notifyError, 
  notifyWarning, 
  notifyInfo,
  notifyTransactionSuccess,
  notifyTransactionCancelled,
  notifyTransactionError
} = useNotifications()

const { handleAsyncOperation } = useBlockchainErrorHandler()

const testNotifications = () => {
  // Test different notification types
  notifySuccess('Operación Exitosa', 'La transacción se completó correctamente')
  
  setTimeout(() => {
    notifyError('Error Crítico', 'Algo salió mal en la operación')
  }, 1000)
  
  setTimeout(() => {
    notifyWarning('Advertencia', 'Ten cuidado con esta acción')
  }, 2000)
  
  setTimeout(() => {
    notifyInfo('Información', 'Esto es solo informativo')
  }, 3000)
}

const testBlockchainErrors = () => {
  // Test user cancellation
  const cancelledError = new Error('User rejected the request.') as any
  cancelledError.code = 4001
  
  handleAsyncOperation(
    () => Promise.reject(cancelledError),
    'operación de prueba'
  )
  
  // Test blockchain error after 2 seconds
  setTimeout(() => {
    const blockchainError = new Error('execution reverted: insufficient funds for gas * price + value')
    handleAsyncOperation(
      () => Promise.reject(blockchainError),
      'transacción de prueba'
    )
  }, 2000)
}

const testTransactionNotifications = () => {
  notifyTransactionSuccess(
    'Modelo Comprado',
    'Has adquirido exitosamente el modelo "GPT-4" por 10 AVAX'
  )
  
  setTimeout(() => {
    notifyTransactionCancelled()
  }, 1500)
  
  setTimeout(() => {
    notifyTransactionError('Red sobrecargada. Intenta aumentar el gas price.')
  }, 3000)
}
</script>

<template>
  <div class="fixed bottom-4 left-4 space-y-2 z-[9998] bg-white/80 app-dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 app-dark:border-gray-700">
    <h3 class="font-semibold text-gray-900 app-dark:text-white mb-3">Pruebas de Notificaciones</h3>
    
    <button
      @click="testNotifications"
      class="block w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
    >
      Probar Notificaciones Básicas
    </button>
    
    <button
      @click="testBlockchainErrors"
      class="block w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
    >
      Probar Errores de Blockchain
    </button>
    
    <button
      @click="testTransactionNotifications"
      class="block w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm"
    >
      Probar Notificaciones de Transacciones
    </button>
  </div>
</template>