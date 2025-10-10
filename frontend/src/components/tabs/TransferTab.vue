<!-- 
  TransferTab.vue
  
  Responsabilidad única: Transferir la propiedad del modelo NFT
  
  Incluye:
  - Formulario para ingresar dirección de destino
  - Validación de dirección Ethereum
  - Advertencia sobre irreversibilidad
  
  Props: Ninguno requerido
  
  Events:
  - transfer: Emitido cuando se solicita transferir { toAddress }
-->

<script setup lang="ts">
import { ref } from 'vue'

// Emits
const emit = defineEmits<{
  transfer: [toAddress: string]
}>()

// Estado Local
const transferAddress = ref('')

// Métodos
const validateAddress = (): boolean => {
  if (!transferAddress.value || !transferAddress.value.startsWith('0x')) {
    alert('Ingresa una dirección válida')
    return false
  }
  
  // Validar longitud (debe ser 42 caracteres: 0x + 40 hex)
  if (transferAddress.value.length !== 42) {
    alert('La dirección debe tener 42 caracteres (0x + 40 dígitos hexadecimales)')
    return false
  }
  
  return true
}

const handleTransfer = () => {
  if (!validateAddress()) return
  
  // Confirmar acción crítica
  const confirmed = confirm(
    `¿Estás seguro de que deseas transferir este modelo a ${transferAddress.value}?\n\n` +
    'Esta acción es IRREVERSIBLE y perderás la propiedad del modelo.'
  )
  
  if (!confirmed) return
  
  // Emitir evento al componente padre
  emit('transfer', transferAddress.value)
  
  // Resetear formulario
  transferAddress.value = ''
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="font-bold text-gray-900 app-dark:text-white text-lg">
      Transferir Modelo
    </h3>
    
    <!-- Advertencia -->
    <div class="p-4 bg-amber-50 app-dark:bg-amber-900/20 border border-amber-200 app-dark:border-amber-800 rounded-lg">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-amber-600 app-dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <div>
          <h4 class="font-semibold text-amber-800 app-dark:text-amber-400">
            ⚠️ Advertencia Importante
          </h4>
          <p class="text-sm text-amber-700 app-dark:text-amber-300 mt-1">
            Transferir la propiedad de este modelo es una acción <strong>irreversible</strong>. 
            Una vez transferido, perderás todos los derechos sobre el modelo, incluidas las ganancias futuras.
          </p>
        </div>
      </div>
    </div>
    
    <!-- Formulario de Transferencia -->
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
          Debe ser una dirección Ethereum válida (42 caracteres comenzando con 0x)
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
</template>
