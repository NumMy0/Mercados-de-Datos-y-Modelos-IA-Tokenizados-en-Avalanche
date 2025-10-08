<script setup lang="ts">
import {
  Home,
  Bot,
  Settings2,
  Wallet,
} from "lucide-vue-next"
import { ref, onMounted } from 'vue'

interface Props {
  collapsible?: "icon" | "none" | "offcanvas"
}

defineProps<Props>()

// Estado de la wallet
const isWalletConnected = ref(false)
const walletAddress = ref('')
const networkName = ref('')
const isCoreWallet = ref(false)

// Función para conectar wallet
const connectWallet = async () => {
  try {
    // Verificar si Core Wallet está instalado
    if (typeof window.ethereum !== 'undefined') {
      // Verificar si es Core Wallet específicamente
      const provider = window.ethereum
      
      // Core Wallet se identifica con isAvalanche o isCoreWallet
      if (provider.isAvalanche || provider.isCoreWallet || provider.isCore) {
        isCoreWallet.value = true
        // Solicitar conexión a Core Wallet
        const accounts = await provider.request({ 
          method: 'eth_requestAccounts' 
        })
        
        if (accounts.length > 0) {
          // Verificar que estamos en Avalanche Network
          try {
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xA86A' }], // Avalanche C-Chain mainnet
            })
            networkName.value = 'Avalanche C-Chain'
          } catch (switchError: any) {
            // Si la red no está agregada, agregarla
            if (switchError.code === 4902) {
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xA86A',
                  chainName: 'Avalanche Network',
                  nativeCurrency: {
                    name: 'Avalanche',
                    symbol: 'AVAX',
                    decimals: 18
                  },
                  rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
                  blockExplorerUrls: ['https://snowtrace.io/']
                }]
              })
              networkName.value = 'Avalanche C-Chain'
            }
          }
          
          isWalletConnected.value = true
          walletAddress.value = accounts[0]
          console.log('Core Wallet conectada en Avalanche:', accounts[0])
        }
      } else {
        isCoreWallet.value = false
        // Si no es Core Wallet, intentar conectar de todas formas pero avisar
        const accounts = await provider.request({ 
          method: 'eth_requestAccounts' 
        })
        
        if (accounts.length > 0) {
          isWalletConnected.value = true
          walletAddress.value = accounts[0]
          networkName.value = 'Red desconocida'
          console.log('Wallet conectada (no Core):', accounts[0])
          alert('Se recomienda usar Core Wallet para la mejor experiencia en Avalanche')
        }
      }
    } else {
      alert('Core Wallet no está instalado. Por favor, instala Core Wallet desde https://core.app/ para continuar.')
    }
  } catch (error) {
    console.error('Error al conectar Core Wallet:', error)
    alert('Error al conectar la wallet. Asegúrate de tener Core Wallet instalado y desbloqueado.')
  }
}

// Función para desconectar wallet
const disconnectWallet = () => {
  isWalletConnected.value = false
  walletAddress.value = ''
  networkName.value = ''
  isCoreWallet.value = false
  console.log('Core Wallet desconectada')
}

// Detectar conexión automática al cargar
const checkWalletConnection = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        isWalletConnected.value = true
        walletAddress.value = accounts[0]
        
        // Verificar si es Core Wallet
        const provider = window.ethereum
        if (provider.isAvalanche || provider.isCoreWallet || provider.isCore) {
          isCoreWallet.value = true
          networkName.value = 'Avalanche C-Chain'
        } else {
          isCoreWallet.value = false
          networkName.value = 'Red desconocida'
        }
        
        console.log('Wallet ya conectada:', accounts[0])
      }
    } catch (error) {
      console.error('Error al verificar conexión de wallet:', error)
    }
  }
}

// Ejecutar al montar el componente
onMounted(() => {
  checkWalletConnection()
})

// Elementos de navegación simplificados
const navigationItems = [
  {
    name: "Dashboard",
    to: "/",
    icon: Home,
  },
  {
    name: "Modelos",
    to: "/models",
    icon: Bot,
  },
  {
    name: "Configuración",
    to: "/settings",
    icon: Settings2,
  },
]
</script>

<template>
  <div class="flex flex-col h-screen w-64 sidebar-container">
    <!-- Header -->
    <div class="p-4 sidebar-header">
      <h2 class="text-lg font-semibold">Mercados IA</h2>
      <p class="text-sm" style="color: hsl(var(--muted-foreground))">Avalanche Platform</p>
    </div>
    
    <!-- Wallet Connection Section -->
    <div class="p-4" style="border-bottom: 1px solid hsl(var(--border))">
      <button
        v-if="!isWalletConnected"
        @click="connectWallet"
        class="flex items-center justify-center w-full px-3 py-2 text-sm font-medium rounded-md wallet-connect-btn"
        style="background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground))"
      >
        <Wallet class="w-4 h-4 mr-2" />
        Conectar Core Wallet
      </button>
      
      <div v-else class="space-y-2">
        <div class="flex items-center justify-center w-full px-3 py-2 text-sm font-medium rounded-md wallet-connected-indicator"
             style="background-color: hsl(var(--secondary)); color: hsl(var(--secondary-foreground))">
          <Wallet class="w-4 h-4 mr-2" />
          {{ isCoreWallet ? 'Core Wallet' : 'Wallet' }} Conectada
        </div>
        <div class="text-xs truncate text-center" style="color: hsl(var(--muted-foreground))">
          {{ walletAddress.slice(0, 6) }}...{{ walletAddress.slice(-4) }}
        </div>
        <div v-if="networkName" class="text-xs text-center" style="color: hsl(var(--muted-foreground))">
          {{ networkName }}
        </div>
        <button
          @click="disconnectWallet"
          class="w-full px-2 py-1 text-xs rounded-md btn-hover"
          style="background-color: hsl(var(--destructive)); color: hsl(var(--destructive-foreground))"
        >
          Desconectar
        </button>
      </div>
    </div>
    
    <!-- Navigation Content -->
    <div class="flex-1 overflow-y-auto">
      <nav class="space-y-1 p-2">
        <router-link
          v-for="item in navigationItems"
          :key="item.name"
          :to="item.to"
          class="flex items-center px-3 py-2 text-sm font-medium rounded-md sidebar-nav-item"
          :class="[
            $route.path === item.to 
              ? 'active' 
              : ''
          ]"
        >
          <component :is="item.icon" class="w-4 h-4 mr-3" />
          {{ item.name }}
        </router-link>
      </nav>
    </div>
    
    <!-- Footer -->
    <div class="p-4 sidebar-footer">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground))">
          <span class="text-xs font-medium">U</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">Usuario</p>
          <p class="text-xs truncate" style="color: hsl(var(--muted-foreground))">usuario@avalanche.com</p>
        </div>
      </div>
    </div>
  </div>
</template>
