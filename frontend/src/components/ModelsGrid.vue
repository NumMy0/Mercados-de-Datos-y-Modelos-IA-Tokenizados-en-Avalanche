<!--
  Componente: ModelsGrid
  
  RESPONSABILIDAD ÚNICA: Renderizar la cuadrícula de modelos con sus estados
  
  Proporciona:
  - Loading state (spinners animados)
  - Empty state (sin modelos)
  - Grid de ModelCards
  - Botón de "Subir Modelo"
  - Estados responsive
-->

<script setup lang="ts">
import type { Model } from '../composables/useModels'
import ModelCard from './ui/ModelCard.vue'

// ========================================
// PROPS
// ========================================

interface Props {
  models: Model[]
  loading: boolean
  isConnected: boolean
  showUploadButton?: boolean
  emptyMessage?: string
  emptySubMessage?: string
}

withDefaults(defineProps<Props>(), {
  showUploadButton: true,
  emptyMessage: 'No hay modelos subidos aún',
  emptySubMessage: 'Sé el primero en subir un modelo de IA al marketplace'
})

// ========================================
// EVENTS
// ========================================

const emit = defineEmits<{
  'view-details': [modelId: number]
  'upload-model': []
}>()

// ========================================
// HANDLERS
// ========================================

function handleViewDetails(modelId: number) {
  emit('view-details', modelId)
}

function handleUploadModel() {
  emit('upload-model')
}
</script>

<template>
  <div class="w-full">
    <!-- Upload Model Button -->
    <div v-if="showUploadButton" class="flex justify-end py-4 sm:py-6">
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
    <div v-if="loading" class="flex flex-col items-center justify-center py-20">
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
    <div 
      v-else-if="!loading && models.length > 0" 
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-8"
    >
      <ModelCard
        v-for="model in models"
        :key="model.id"
        :model="model"
        :is-connected="isConnected"
        @view-details="handleViewDetails"
      />
    </div>

    <!-- Empty State -->
    <div 
      v-else-if="!loading && models.length === 0"
      class="text-center py-20"
    >
      <div class="mb-6">
        <svg class="w-24 h-24 mx-auto text-gray-300 app-dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      
      <h3 class="text-xl sm:text-2xl font-bold text-gray-900 app-dark:text-gray-100 mb-3">
        {{ emptyMessage }}
      </h3>
      
      <p class="text-gray-500 app-dark:text-gray-400 text-base sm:text-lg mb-6 max-w-md mx-auto">
        {{ emptySubMessage }}
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
