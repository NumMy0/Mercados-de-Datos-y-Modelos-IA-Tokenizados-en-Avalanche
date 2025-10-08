<template>
  <div class="p-6 max-w-4xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">Configuración</h1>
      <p class="text-muted-foreground">
        Gestiona la configuración de tu cuenta y preferencias del sistema
      </p>
    </div>
    
    <!-- Configuración de Wallet -->
    <div class="mb-6 p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        🔐 Configuración de Wallet
      </h2>
      <p class="text-gray-600 mb-4">
        Gestiona la conexión y estado de tu Core Wallet
      </p>
      
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium">Core Wallet</h3>
            <p class="text-sm text-gray-500">Estado de conexión de tu wallet</p>
          </div>
          <div class="flex items-center space-x-2">
            <div 
              :class="walletConnected ? 'bg-green-500' : 'bg-red-500'"
              class="w-3 h-3 rounded-full"
            ></div>
            <span class="text-sm">{{ walletConnected ? 'Conectada' : 'Desconectada' }}</span>
          </div>
        </div>
        
        <div v-if="walletConnected" class="bg-green-50 border border-green-200 rounded p-3">
          <p class="text-sm text-green-800">
            <strong>Dirección:</strong> {{ walletAddress }}
          </p>
          <p class="text-sm text-green-800 mt-1">
            <strong>Red:</strong> Avalanche C-Chain
          </p>
        </div>
        
        <button 
          @click="toggleWalletConnection"
          :class="walletConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'"
          class="px-4 py-2 text-white rounded transition-colors font-medium"
        >
          {{ walletConnected ? 'Desconectar Wallet' : 'Conectar Wallet' }}
        </button>
      </div>
    </div>

    <!-- Configuración de Modo de Prueba -->
    <div class="mb-6 p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        🧪 Configuración de Desarrollo
      </h2>
      <p class="text-gray-600 mb-4">
        Controla el comportamiento de las transacciones y pagos
      </p>
      
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium">Modo de Prueba Global</h3>
            <p class="text-sm text-gray-500">Permite el uso de todas las funciones sin AVAX real</p>
          </div>
          
          <!-- Toggle Switch personalizado -->
          <button
            @click="handleTestModeChange(!testMode)"
            :class="testMode ? 'bg-green-500' : 'bg-gray-300'"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <span
              :class="testMode ? 'translate-x-6' : 'translate-x-1'"
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
            />
          </button>
        </div>
        
        <div v-if="testMode" class="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p class="text-sm text-yellow-800">
            ⚠️ <strong>Modo de Prueba Activo:</strong> Los pagos y transacciones son simulados. 
            No se debitará AVAX real de tu wallet.
          </p>
        </div>
      </div>
    </div>

    <!-- Configuración de Datos -->
    <div class="mb-6 p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        📊 Gestión de Datos
      </h2>
      <p class="text-gray-600 mb-4">
        Administra tus datos locales y configuraciones
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          @click="clearAccessedModels"
          class="p-4 text-left rounded-lg border border-orange-200 hover:bg-orange-50 transition-colors"
        >
          <h3 class="font-medium text-orange-700">Limpiar Modelos Accedidos</h3>
          <p class="text-sm text-orange-600">Elimina el historial de modelos comprados</p>
        </button>
        
        <button 
          @click="clearExecutionHistory"
          class="p-4 text-left rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
        >
          <h3 class="font-medium text-blue-700">Limpiar Historial de Ejecuciones</h3>
          <p class="text-sm text-blue-600">Elimina el historial de todas las ejecuciones</p>
        </button>
        
        <button 
          @click="exportData"
          class="p-4 text-left rounded-lg border border-green-200 hover:bg-green-50 transition-colors"
        >
          <h3 class="font-medium text-green-700">Exportar Datos</h3>
          <p class="text-sm text-green-600">Descarga todos tus datos en formato JSON</p>
        </button>
        
        <button 
          @click="clearAllData"
          class="p-4 text-left rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
        >
          <h3 class="font-medium text-red-700">Limpiar Todos los Datos</h3>
          <p class="text-sm text-red-600">⚠️ Elimina todos los datos locales</p>
        </button>
      </div>
    </div>

    <!-- Información del Sistema -->
    <div class="mb-6 p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        ℹ️ Información del Sistema
      </h2>
      <p class="text-gray-600 mb-4">
        Detalles técnicos y versión de la aplicación
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h3 class="font-medium mb-2">Versión de la Aplicación</h3>
          <p class="text-gray-500">v1.0.0-beta</p>
        </div>
        
        <div>
          <h3 class="font-medium mb-2">Red Blockchain</h3>
          <p class="text-gray-500">Avalanche C-Chain (Testnet)</p>
        </div>
        
        <div>
          <h3 class="font-medium mb-2">Modelos Disponibles</h3>
          <p class="text-gray-500">{{ totalModels }} modelos activos</p>
        </div>
        
        <div>
          <h3 class="font-medium mb-2">Última Actualización</h3>
          <p class="text-gray-500">{{ lastUpdate }}</p>
        </div>
      </div>
    </div>

    <!-- Acciones Rápidas -->
    <div class="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <h2 class="text-xl font-semibold mb-2 flex items-center gap-2">
        ⚡ Acciones Rápidas
      </h2>
      <p class="text-gray-600 mb-4">
        Navegación rápida y utilidades de la aplicación
      </p>
      
      <div class="flex flex-wrap gap-3">
        <button 
          @click="refreshApp"
          class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors font-medium flex items-center gap-2"
        >
          🔄 Refrescar Aplicación
        </button>
        
        <button 
          @click="goToModels"
          class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors font-medium flex items-center gap-2"
        >
          🤖 Ir a Modelos
        </button>
        
        <button 
          @click="goToDashboard"
          class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors font-medium flex items-center gap-2"
        >
          📊 Ir al Dashboard
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Estados reactivos
const walletConnected = ref(false)
const walletAddress = ref('')
const testMode = ref(true) // Por defecto en modo de prueba
const totalModels = ref(3)
const lastUpdate = ref('')

// Inicializar datos
onMounted(() => {
  checkWalletConnection()
  loadSettings()
  lastUpdate.value = new Date().toLocaleDateString()
})

// Verificar conexión de wallet
const checkWalletConnection = () => {
  if (typeof window.ethereum !== 'undefined' && window.ethereum.selectedAddress) {
    walletConnected.value = true
    walletAddress.value = window.ethereum.selectedAddress
  } else {
    walletConnected.value = false
    walletAddress.value = ''
  }
}

// Cargar configuraciones desde localStorage
const loadSettings = () => {
  const savedTestMode = localStorage.getItem('testMode')
  if (savedTestMode !== null) {
    testMode.value = JSON.parse(savedTestMode)
  }
}

// Alternar conexión de wallet
const toggleWalletConnection = async () => {
  if (walletConnected.value) {
    // Desconectar (simular desconexión)
    walletConnected.value = false
    walletAddress.value = ''
    alert('Wallet desconectada')
  } else {
    // Conectar wallet
    try {
      if (typeof window.ethereum === 'undefined') {
        alert('Por favor instala Core Wallet')
        return
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      
      if (accounts.length > 0) {
        walletConnected.value = true
        walletAddress.value = accounts[0]
        alert('Wallet conectada exitosamente')
      }
    } catch (error: any) {
      console.error('Error conectando wallet:', error)
      if (error.code === 4001) {
        alert('Conexión cancelada por el usuario')
      } else {
        alert('Error conectando la wallet')
      }
    }
  }
}

// Alternar modo de prueba
const handleTestModeChange = (value: boolean) => {
  testMode.value = value
  localStorage.setItem('testMode', JSON.stringify(testMode.value))
  
  if (testMode.value) {
    alert('🧪 Modo de prueba activado: Todas las funciones son gratuitas')
  } else {
    alert('💰 Modo normal activado: Se requiere AVAX real para las transacciones')
  }
}

// Limpiar modelos accedidos
const clearAccessedModels = () => {
  const confirmed = confirm('¿Estás seguro de que quieres limpiar todos los modelos accedidos?')
  if (confirmed) {
    localStorage.removeItem('accessedModels')
    alert('✅ Modelos accedidos eliminados. Tendrás que volver a comprarlos.')
  }
}

// Limpiar historial de ejecuciones
const clearExecutionHistory = () => {
  const confirmed = confirm('¿Estás seguro de que quieres limpiar todo el historial de ejecuciones?')
  if (confirmed) {
    // Limpiar historiales de todos los modelos
    const models = ['genesis', 'explorer', 'quantum']
    models.forEach(model => {
      localStorage.removeItem(`${model}_history`)
    })
    alert('✅ Historial de ejecuciones eliminado')
  }
}

// Exportar datos
const exportData = () => {
  try {
    const data = {
      exportDate: new Date().toISOString(),
      settings: {
        testMode: testMode.value,
        walletConnected: walletConnected.value,
        walletAddress: walletAddress.value
      },
      accessedModels: JSON.parse(localStorage.getItem('accessedModels') || '[]'),
      executionHistory: {
        genesis: JSON.parse(localStorage.getItem('genesis_history') || '[]'),
        explorer: JSON.parse(localStorage.getItem('explorer_history') || '[]'),
        quantum: JSON.parse(localStorage.getItem('quantum_history') || '[]')
      }
    }

    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `mercados-ia-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    alert('✅ Datos exportados exitosamente')
  } catch (error) {
    console.error('Error exportando datos:', error)
    alert('❌ Error exportando los datos')
  }
}

// Limpiar todos los datos
const clearAllData = () => {
  const confirmed = confirm('⚠️ ¿Estás seguro? Esto eliminará TODOS los datos locales (modelos accedidos, historial, configuraciones)')
  if (confirmed) {
    const doubleConfirm = confirm('Esta acción no se puede deshacer. ¿Continuar?')
    if (doubleConfirm) {
      // Limpiar todo el localStorage relacionado con la app
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.includes('accessedModels') || 
          key.includes('_history') || 
          key.includes('testMode')
        )) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Resetear estados
      testMode.value = true
      localStorage.setItem('testMode', 'true')
      
      alert('✅ Todos los datos han sido eliminados. La aplicación se ha reiniciado.')
      location.reload()
    }
  }
}

// Refrescar aplicación
const refreshApp = () => {
  location.reload()
}

// Navegar a modelos
const goToModels = () => {
  router.push('/models')
}

// Navegar al dashboard
const goToDashboard = () => {
  router.push('/dashboard')
}
</script>