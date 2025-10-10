<!-- 
  SaleManagementTab.vue
  
  Responsabilidad única: Gestionar la venta del modelo NFT
  
  Incluye:
  - Poner modelo en venta (establecer precio)
  - Cancelar venta activa
  - Mostrar estado actual de venta
  
  Props:
  - isForSale: Boolean indicando si el modelo está actualmente en venta
  - currentPrice: Precio actual de venta (string o null)
  - settingForSale: Boolean indicando si se está procesando poner en venta
  - cancellingSale: Boolean indicando si se está procesando cancelar venta
  
  Events:
  - setForSale: Emitido cuando se establece un precio de venta { price }
  - cancelSale: Emitido cuando se cancela la venta
-->

<script setup lang="ts">
import { ref } from 'vue'

// Props
defineProps<{
  isForSale: boolean
  currentPrice: string | null
  settingForSale: boolean
  cancellingSale: boolean
}>()

// Emits
const emit = defineEmits<{
  setForSale: [price: string]
  cancelSale: []
}>()

// Estado Local
const salePrice = ref('')

// Métodos
const validatePrice = (): boolean => {
  if (!salePrice.value) {
    alert('Ingresa un precio')
    return false
  }
  return true
}

const handleSetForSale = () => {
  if (!validatePrice()) return
  
  // Emitir precio al componente padre
  emit('setForSale', salePrice.value)
  
  // Resetear formulario
  salePrice.value = ''
}

const handleCancelSale = () => {
  emit('cancelSale')
}
</script>

<template>
  <div class="space-y-4">
    <!-- Formulario: Poner en Venta (Si NO está en venta) -->
    <div v-if="!isForSale">
      <h3 class="font-bold text-gray-900 app-dark:text-white mb-4 text-lg">
        Poner Modelo en Venta
      </h3>
      <form @submit.prevent="handleSetForSale" class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 app-dark:text-gray-300 mb-2">
            Precio en AVAX
          </label>
          <input 
            v-model="salePrice"
            placeholder="Ej: 100"
            class="w-full bg-gray-50 app-dark:bg-gray-800 rounded-md border border-gray-300 app-dark:border-gray-700 text-gray-900 app-dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            type="number"
            step="0.01"
            min="0"
            required
          >
        </div>
        <button 
          type="submit"
          :disabled="settingForSale"
          :class="[
            'w-full px-4 py-3 rounded-lg font-medium transition-colors',
            settingForSale 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-green-500 app-dark:bg-green-600 text-white hover:bg-green-600 app-dark:hover:bg-green-700'
          ]"
        >
          <span v-if="!settingForSale">Poner en Venta</span>
          <span v-else class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            Procesando...
          </span>
        </button>
      </form>
    </div>

    <!-- Estado: Modelo en Venta (Si SÍ está en venta) -->
    <div 
      v-else 
      class="p-6 bg-green-50 app-dark:bg-green-900/20 border border-green-200 app-dark:border-green-800 rounded-lg"
    >
      <h3 class="font-bold text-green-900 app-dark:text-green-100 text-lg">
        ✓ Modelo en Venta
      </h3>
      <p class="text-3xl font-bold text-green-600 app-dark:text-green-400 mt-3">
        {{ currentPrice ?? '-' }} AVAX
      </p>
      <button 
        @click="handleCancelSale"
        :disabled="cancellingSale"
        :class="[
          'mt-6 w-full px-4 py-2 rounded-lg transition-colors font-medium',
          cancellingSale 
            ? 'bg-gray-400 text-white cursor-not-allowed' 
            : 'bg-red-500 app-dark:bg-red-600 text-white hover:bg-red-600 app-dark:hover:bg-red-700'
        ]"
      >
        <span v-if="!cancellingSale">Cancelar Venta</span>
        <span v-else class="flex items-center justify-center gap-2">
          <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          Cancelando...
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Animación del spinner */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
