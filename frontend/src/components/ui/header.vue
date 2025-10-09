<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWallet } from '../../composables/useWallet'

const router = useRouter()
const { isConnected, account, connectWallet } = useWallet()
const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const handleConnectWallet = async () => {
  try {
    await connectWallet()
  } catch (err) {
    console.error('Error al conectar:', err)
  }
}

const navigateTo = (path: string) => {
  router.push(path)
  isMenuOpen.value = false
}

const truncateAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
</script>

<template>
  <nav class="bg-white border-b border-gray-200 app-dark:bg-gray-900 app-dark:border-gray-800 transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <button 
          @click="navigateTo('/')" 
          class="flex items-center cursor-pointer flex-shrink-0"
        >
          <span class="text-lg md:text-xl font-semibold app-dark:text-white transition-colors duration-200">
            <span class="hidden sm:inline">Data & AI Models Marketplace</span>
            <span class="sm:hidden">AI Marketplace</span>
          </span>
        </button>

        <!-- Mobile menu button -->
        <button 
          @click="toggleMenu"
          type="button" 
          class="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 app-dark:text-gray-400 app-dark:hover:bg-gray-700 app-dark:focus:ring-gray-600 transition-colors duration-200" 
          :aria-expanded="isMenuOpen"
        >
          <span class="sr-only">Open main menu</span>
          <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h15M1 7h15M1 13h15"/>
          </svg>
        </button>

        <!-- Desktop Navigation Menu -->
        <div class="hidden md:flex md:items-center md:space-x-4 lg:space-x-6">
          <button
            @click="navigateTo('/')"
            class="px-3 py-2 text-sm lg:text-base text-gray-900 rounded hover:bg-gray-100 app-dark:text-white app-dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Inicio
          </button>
          <button
            @click="navigateTo('/models')"
            class="px-3 py-2 text-sm lg:text-base text-gray-900 rounded hover:bg-gray-100 app-dark:text-white app-dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Modelos
          </button>
          <button
            @click="navigateTo('/data')"
            class="px-3 py-2 text-sm lg:text-base text-gray-900 rounded hover:bg-gray-100 app-dark:text-white app-dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Datos
          </button>
          <button
            v-if="isConnected"
            @click="navigateTo('/profile')"
            class="px-3 py-2 text-sm lg:text-base text-gray-900 rounded hover:bg-gray-100 app-dark:text-white app-dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Mi Perfil
          </button>
          <button
            @click="navigateTo('/about')"
            class="px-3 py-2 text-sm lg:text-base text-gray-900 rounded hover:bg-gray-100 app-dark:text-white app-dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Acerca de
          </button>

          <!-- Wallet Connection Desktop -->
          <button
            v-if="!isConnected"
            @click="handleConnectWallet"
            class="px-4 lg:px-5 py-2 text-sm lg:text-base text-white bg-blue-500 rounded-lg hover:bg-blue-600 app-dark:bg-blue-600 app-dark:hover:bg-blue-700 transition-colors duration-200 whitespace-nowrap"
          >
            Conectar Wallet
          </button>
          <button
            v-else
            @click="navigateTo('/profile')"
            class="flex items-center gap-2 px-3 py-2 bg-green-50 app-dark:bg-green-900/20 text-green-700 app-dark:text-green-400 rounded-lg border border-green-200 app-dark:border-green-800 hover:bg-green-100 app-dark:hover:bg-green-900/30 transition-colors duration-200 cursor-pointer"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="3"/>
            </svg>
            <span class="text-xs lg:text-sm font-medium">{{ truncateAddress(account!) }}</span>
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Menu -->
      <div 
        :class="{ 'hidden': !isMenuOpen }" 
        class="md:hidden border-t border-gray-200 app-dark:border-gray-700"
      >
        <div class="px-2 pt-2 pb-3 space-y-1">
          <button
            @click="navigateTo('/')"
            class="block w-full text-left px-3 py-2 text-base text-gray-900 rounded hover:bg-gray-100 app-dark:text-white app-dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Inicio
          </button>
          <button
            @click="navigateTo('/models')"
            class="block w-full text-left px-3 py-2 text-base text-gray-900 rounded hover:bg-gray-100 app-dark:text-white app-dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Modelos
          </button>
          <button
            @click="navigateTo('/data')"
            class="block w-full text-left px-3 py-2 text-base text-gray-900 rounded hover:bg-gray-100 app-dark:text-white app-dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Datos
          </button>
          <button
            v-if="isConnected"
            @click="navigateTo('/profile')"
            class="block w-full text-left px-3 py-2 text-base text-gray-900 rounded hover:bg-gray-100 app-dark:text-white app-dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Mi Perfil
          </button>
          <button
            @click="navigateTo('/about')"
            class="block w-full text-left px-3 py-2 text-base text-gray-900 rounded hover:bg-gray-100 app-dark:text-white app-dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Acerca de
          </button>

          <!-- Wallet Connection Mobile -->
          <div class="pt-2">
            <button
              v-if="!isConnected"
              @click="handleConnectWallet"
              class="block w-full px-3 py-2.5 text-center text-white bg-blue-500 rounded-lg hover:bg-blue-600 app-dark:bg-blue-600 app-dark:hover:bg-blue-700 transition-colors duration-200"
            >
              Conectar Wallet
            </button>
            <button
              v-else
              @click="navigateTo('/profile')"
              class="flex items-center justify-center gap-2 w-full px-3 py-2 bg-green-50 app-dark:bg-green-900/20 text-green-700 app-dark:text-green-400 rounded-lg border border-green-200 app-dark:border-green-800 hover:bg-green-100 app-dark:hover:bg-green-900/30 transition-colors duration-200 cursor-pointer"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="3"/>
              </svg>
              <span class="text-sm font-medium">{{ truncateAddress(account!) }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Ensure smooth transitions */
button, div {
  transition-property: background-color, border-color, color;
  transition-duration: 200ms;
  transition-timing-function: ease-in-out;
}
</style>