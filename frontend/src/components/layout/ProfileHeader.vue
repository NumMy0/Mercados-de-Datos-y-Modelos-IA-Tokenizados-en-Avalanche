<!--
  Componente: ProfileHeader
  
  RESPONSABILIDAD ÚNICA: Renderizar la cabecera del perfil del usuario
  
  Proporciona:
  - Avatar con iniciales del usuario
  - Dirección con botón de copiar
  - Stats cards (Balance, Modelos, Licencias)
  - Botón de retiro de fondos
  
  Props:
  - address: Dirección completa del usuario
  - truncatedAddress: Dirección truncada
  - walletBalance: Balance en AVAX
  - modelsCount: Cantidad de modelos del usuario
  - licensesCount: Cantidad de licencias activas
  
  Events:
  - copy-address: Emitido cuando se hace click en copiar dirección
  - open-withdraw: Emitido cuando se hace click en retirar fondos
-->

<script setup lang="ts">
// ========================================
// PROPS
// ========================================

defineProps<{
  address: string | null
  truncatedAddress: string
  walletBalance: string
  modelsCount: number
  licensesCount: number
}>()

// ========================================
// EVENTS
// ========================================

const emit = defineEmits<{
  'copy-address': []
  'open-withdraw': []
}>()

// ========================================
// HANDLERS
// ========================================

function handleCopyAddress() {
  emit('copy-address')
}

function handleOpenWithdraw() {
  emit('open-withdraw')
}
</script>

<template>
  <div class="bg-white app-dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8 border border-gray-200 app-dark:border-gray-700">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <!-- User Info -->
      <div class="flex items-center gap-4">
        <!-- Avatar con iniciales -->
        <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {{ address?.slice(2, 4).toUpperCase() || '??' }}
        </div>
        
        <!-- Detalles del usuario -->
        <div>
          <h1 class="text-2xl font-bold text-gray-900 app-dark:text-gray-100 mb-2">
            Mi Perfil
          </h1>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 app-dark:text-gray-400 font-mono">
              {{ truncatedAddress }}
            </span>
            <button
              @click="handleCopyAddress"
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

      <!-- Wallet Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
        <!-- Balance Card -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 app-dark:from-blue-900/20 app-dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 app-dark:border-blue-800">
          <div class="text-xs text-blue-600 app-dark:text-blue-400 font-medium mb-1">
            Balance
          </div>
          <div class="text-xl font-bold text-blue-900 app-dark:text-blue-100 mb-2">
            {{ walletBalance }} AVAX
          </div>
          <button
            @click="handleOpenWithdraw"
            class="w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded transition-colors"
          >
            Retirar Fondos
          </button>
        </div>

        <!-- Models Count Card -->
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 app-dark:from-purple-900/20 app-dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 app-dark:border-purple-800">
          <div class="text-xs text-purple-600 app-dark:text-purple-400 font-medium mb-1">
            Mis Modelos
          </div>
          <div class="text-xl font-bold text-purple-900 app-dark:text-purple-100">
            {{ modelsCount }}
          </div>
        </div>

        <!-- Licenses Count Card -->
        <div class="bg-gradient-to-br from-green-50 to-green-100 app-dark:from-green-900/20 app-dark:to-green-800/20 p-4 rounded-lg border border-green-200 app-dark:border-green-800">
          <div class="text-xs text-green-600 app-dark:text-green-400 font-medium mb-1">
            Licencias Activas
          </div>
          <div class="text-xl font-bold text-green-900 app-dark:text-green-100">
            {{ licensesCount }}
          </div>
        </div>
      </div>
    </div>
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
