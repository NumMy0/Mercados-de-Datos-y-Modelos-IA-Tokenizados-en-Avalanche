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
    <div class="min-w-full min-h-[10vh] flex justify-between px-4 py-3">
      <!-- Logo -->
      <button 
        @click="navigateTo('/')" 
        class="flex items-center cursor-pointer"
      >
        <span class="text-xl font-semibold whitespace-nowrap app-dark:text-white transition-colors duration-200 p-4">
          Data & AI Models Marketplace
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

      <!-- Navigation Menu -->
      <div 
        :class="{ 'hidden': !isMenuOpen }" 
        class="w-full md:flex md:w-auto md:items-center" 
        id="navbar-default"
      >
        <ul class="font-medium h-full flex flex-col md:flex-row md:space-x-8 mt-4 md:mt-0 md:items-center gap-4">
          <li>
            <button
              @click="navigateTo('/')"
              class="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 app-dark:text-white md:app-dark:hover:text-blue-500 app-dark:hover:bg-gray-700 app-dark:hover:text-white md:app-dark:hover:bg-transparent transition-colors duration-200"
            >
              Inicio
            </button>
          </li>
          <li>
            <button
              @click="navigateTo('/models')"
              class="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 app-dark:text-white md:app-dark:hover:text-blue-500 app-dark:hover:bg-gray-700 app-dark:hover:text-white md:app-dark:hover:bg-transparent transition-colors duration-200"
            >
              Modelos
            </button>
          </li>
          <li>
            <button
              @click="navigateTo('/data')"
              class="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 app-dark:text-white md:app-dark:hover:text-blue-500 app-dark:hover:bg-gray-700 app-dark:hover:text-white md:app-dark:hover:bg-transparent transition-colors duration-200"
            >
              Datos
            </button>
          </li>
          <li>
            <button
              @click="navigateTo('/about')"
              class="block py-2 pl-3 pr-4 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 app-dark:text-white md:app-dark:hover:text-blue-500 app-dark:hover:bg-gray-700 app-dark:hover:text-white md:app-dark:hover:bg-transparent transition-colors duration-200"
            >
              Acerca de
            </button>
          </li>

          <!-- Wallet Connection -->
          <li class="mt-2 md:mt-0">
            <button
              v-if="!isConnected"
              @click="handleConnectWallet"
              class="block w-full md:w-auto px-5 py-2.5 text-white bg-blue-500 rounded-lg hover:bg-blue-600 app-dark:bg-blue-600 app-dark:hover:bg-blue-700 transition-colors duration-200 text-center"
            >
              Conectar Wallet
            </button>
            <div
              v-else
              class="flex items-center gap-2 px-3 py-2 bg-green-50 app-dark:bg-green-900/20 text-green-700 app-dark:text-green-400 rounded-lg border border-green-200 app-dark:border-green-800 transition-colors duration-200"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="3"/>
              </svg>
              <span class="text-sm font-medium">{{ truncateAddress(account!) }}</span>
            </div>
          </li>
        </ul>
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