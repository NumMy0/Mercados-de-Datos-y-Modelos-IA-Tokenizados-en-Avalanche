<!-- 
  ModelDetailsTab.vue
  
  Responsabilidad única: Mostrar información detallada del modelo
  
  Props:
  - modelData: Objeto con toda la información del modelo
  - isOwner: Boolean indicando si el usuario actual es el propietario
  - hasForSalePrice: Boolean indicando si el modelo está en venta
  - displayPrice: Precio a mostrar (puede ser salePrice o basePrice)
  - ownerShort: Dirección del propietario en formato corto
  
  Events:
  - buyModel: Emitido cuando el usuario quiere comprar el modelo completo
  - executeInference: Emitido cuando el usuario quiere ejecutar una inferencia
-->

<script setup lang="ts">
import ModelInfoField from '../forms/ModelInfoField.vue'

interface ModelData {
  id: string
  name?: string | null
  description?: string | null
  category?: string | null
  modelType?: string | null
  features?: string | null
}

// Props
defineProps<{
  modelData: ModelData
  isOwner: boolean
  hasForSalePrice: boolean
  displayPrice: string | null
  ownerShort: string
}>()

// Emits
const emit = defineEmits<{
  buyModel: []
  executeInference: []
}>()
</script>

<template>
  <div class="space-y-6">
    <!-- Descripción -->
    <div>
      <h3 class="text-sm font-semibold text-gray-500 app-dark:text-gray-400 uppercase mb-2">
        Descripción
      </h3>
      <p class="text-gray-900 app-dark:text-white">{{ modelData.description || 'Sin descripción disponible' }}</p>
    </div>

    <!-- Grid de Información del Modelo -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <ModelInfoField 
        title="Propietario" 
        :value="ownerShort"
      />
      <ModelInfoField 
        title="Categoría" 
        :value="modelData.category ?? 'Sin categoría'" 
      />
      <ModelInfoField 
        v-if="modelData.modelType" 
        title="Tipo" 
        :value="modelData.modelType" 
      />
      <ModelInfoField 
        v-if="modelData.features" 
        title="Características" 
        :value="modelData.features" 
      />
    </div>

    <!-- Sección: Modelo en Venta -->
    <div 
      v-if="hasForSalePrice" 
      class="p-4 bg-green-50 app-dark:bg-green-900/20 border border-green-200 app-dark:border-green-800 rounded-lg"
    >
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div class="text-center sm:text-left">
          <h3 class="text-lg font-bold text-green-900 app-dark:text-green-100">
            Disponible para Compra
          </h3>
          <p class="text-3xl font-bold text-green-600 app-dark:text-green-400 mt-2">
            {{ displayPrice ?? '-' }} AVAX
          </p>
        </div>
        <!-- Solo mostrar botón si NO es el propietario -->
        <button 
          v-if="!isOwner"
          @click="emit('buyModel')"
          class="px-6 py-3 bg-green-500 app-dark:bg-green-600 text-white rounded-lg font-medium hover:bg-green-600 app-dark:hover:bg-green-700 transition-colors whitespace-nowrap"
        >
          Comprar Modelo
        </button>
      </div>
    </div>

    <!-- Botón: Ejecutar Inferencia -->
    <div class="mt-6">
      <button
        @click="emit('executeInference')"
        class="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Ejecutar Inferencia con este Modelo
      </button>
    </div>
  </div>
</template>
