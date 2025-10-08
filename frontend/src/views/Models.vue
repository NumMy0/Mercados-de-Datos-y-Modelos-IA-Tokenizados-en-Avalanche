<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">Modelos IA</h1>
      <p class="text-muted-foreground">
        Explora y gestiona modelos de IA tokenizados
      </p>
    </div>
    
    <!-- Toggle para modo de prueba -->
    <div class="mb-6 p-4 rounded-lg" style="background-color: hsl(var(--secondary)); color: hsl(var(--secondary-foreground))">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-semibold">🧪 Modo de Prueba</h3>
          <p class="text-sm">Permite comprar modelos con 0 AVAX para testing</p>
        </div>
        <button 
          @click="toggleTestMode"
          :class="testMode ? 'bg-green-500' : 'bg-gray-400'"
          class="px-3 py-1 rounded text-white text-sm transition-colors"
        >
          {{ testMode ? 'Activo' : 'Inactivo' }}
        </button>
      </div>
    </div>
    
    <!-- Alerta de wallet no conectada -->
    <div v-if="!walletConnected" class="mb-6 p-4 rounded-lg" style="background-color: hsl(var(--muted)); color: hsl(var(--muted-foreground))">
      <p class="text-sm">
        ⚠️ Conecta tu Core Wallet para acceder a los modelos
      </p>
    </div>
    
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div 
        v-for="model in models" 
        :key="model.id"
        class="rounded-lg border p-6 shadow-sm"
        style="background-color: hsl(var(--card)); color: hsl(var(--card-foreground))"
      >
        <!-- Badge de acceso -->
        <div v-if="hasAccess(model.id)" class="mb-2">
          <span class="px-2 py-1 text-xs rounded-full" style="background-color: hsl(var(--secondary)); color: hsl(var(--secondary-foreground))">
            ✓ Acceso completo
          </span>
        </div>
        
        <h3 class="font-semibold mb-2">{{ model.name }}</h3>
        <p class="text-sm mb-4" style="color: hsl(var(--muted-foreground))">
          {{ model.description }}
        </p>
        
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">
            {{ hasAccess(model.id) ? 'Acceso completo' : `${model.price} AVAX` }}
          </span>
          <button 
            @click="accessModel(model)"
            :disabled="isLoading"
            :class="getButtonClass(model)"
            :style="hasAccess(model.id) 
              ? 'background-color: hsl(var(--secondary)); color: hsl(var(--secondary-foreground))' 
              : 'background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground))'"
          >
            {{ getButtonText(model) }}
          </button>
        </div>
        
        <!-- Progress bar para carga -->
        <div v-if="isLoading" class="mt-4">
          <div class="w-full rounded-full h-2" style="background-color: hsl(var(--muted))">
            <div class="h-2 rounded-full loading-bar" style="background-color: hsl(var(--primary))"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Información adicional -->
    <div class="mt-8 p-4 rounded-lg" style="background-color: hsl(var(--muted)); color: hsl(var(--muted-foreground))">
      <h3 class="font-semibold mb-2">💡 Información sobre los modelos</h3>
      <ul class="text-sm space-y-1">
        <li>• Los pagos se procesan automáticamente con Core Wallet</li>
        <li>• Una vez pagado, tendrás acceso permanente al modelo</li>
        <li>• Los modelos se ejecutan en la red Avalanche</li>
        <li>• Todos los pagos son seguros y verificables en blockchain</li>
      </ul>
    </div>
    
    <div class="mt-8">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Estados de la aplicación
const isLoading = ref(false)
const accessedModels = ref<string[]>([])
const walletConnected = ref(false)
const walletAddress = ref('')
const testMode = ref(true) // Modo de prueba activado por defecto

// Información de los modelos
const models = [
  {
    id: 'genesis',
    name: 'Genesis',
    description: 'Modelo de lenguaje natural avanzado para procesamiento de texto',
    price: '0.00',
    priceWei: '00000000000000000', // 0.05 AVAX en wei
    contractAddress: '0x1234567890123456789012345678901234567890' // Dirección del contrato del modelo
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Modelo de análisis de datos y predicciones de mercado',
    price: '0.00',
    priceWei: '0000000000000000', // 0.08 AVAX en wei
    contractAddress: '0x2234567890123456789012345678901234567890'
  },
  {
    id: 'quantum',
    name: 'Quantum',
    description: 'Modelo cuántico para optimización y simulaciones complejas',
    price: '0.0',
    priceWei: '000000000000000000', // 0.12 AVAX en wei
    contractAddress: '0x3234567890123456789012345678901234567890'
  }
]

// Función para alternar modo de prueba
const toggleTestMode = () => {
  testMode.value = !testMode.value
  if (testMode.value) {
    alert('🧪 Modo de prueba activado: Puedes comprar modelos con 0 AVAX')
  } else {
    alert('💰 Modo normal activado: Se requiere AVAX real para comprar modelos')
  }
}

// Verificar si el usuario ya tiene acceso al modelo
const hasAccess = (modelId: string) => {
  return accessedModels.value.includes(modelId)
}

// Verificar conexión de wallet
const checkWalletConnection = () => {
  if (typeof window.ethereum !== 'undefined' && window.ethereum.selectedAddress) {
    walletConnected.value = true
    walletAddress.value = window.ethereum.selectedAddress
    return true
  }
  return false
}

// Función para acceder al modelo
const accessModel = async (model: any) => {
  try {
    // Verificar conexión de wallet
    if (!checkWalletConnection()) {
      alert('Por favor conecta tu Core Wallet primero')
      return
    }

    // Verificar si ya tiene acceso
    if (hasAccess(model.id)) {
      // Si ya tiene acceso, redirigir al playground del modelo
      router.push(`/models/${model.id}/playground`)
      return
    }

    isLoading.value = true

    // Confirmar el pago
    const confirmed = confirm(`¿Deseas acceder al modelo ${model.name} por ${model.price} AVAX?`)
    if (!confirmed) {
      isLoading.value = false
      return
    }

    // Si está en modo de prueba, omitir la transacción real
    if (testMode.value) {
      // Simular un pequeño delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Agregar el modelo a la lista de accedidos sin transacción real
      accessedModels.value.push(model.id)
      
      // Guardar en localStorage para persistencia
      localStorage.setItem('accessedModels', JSON.stringify(accessedModels.value))
      
      alert(`🧪 [Modo Prueba] ¡Acceso concedido al modelo ${model.name}! (No se debitó AVAX)`)
      
      // Redirigir al playground del modelo
      router.push(`/models/${model.id}/playground`)
    } else {
      // Realizar la transacción de pago real
      const transactionHash = await payForModel(model)
      
      if (transactionHash) {
        // Agregar el modelo a la lista de accedidos
        accessedModels.value.push(model.id)
        
        // Guardar en localStorage para persistencia
        localStorage.setItem('accessedModels', JSON.stringify(accessedModels.value))
        
        alert(`¡Pago exitoso! Ya tienes acceso al modelo ${model.name}`)
        
        // Redirigir al playground del modelo
        router.push(`/models/${model.id}/playground`)
      }
    }

  } catch (error) {
    console.error('Error al acceder al modelo:', error)
    alert('Error al procesar el pago. Inténtalo de nuevo.')
  } finally {
    isLoading.value = false
  }
}

// Función para realizar el pago del modelo
const payForModel = async (model: any): Promise<string | null> => {
  try {
    if (!window.ethereum) {
      throw new Error('Wallet no disponible')
    }

    // Parámetros de la transacción
    const transactionParameters = {
      to: model.contractAddress,
      value: model.priceWei, // Precio en wei
      gas: '0x5208', // 21000 gas límite estándar
      gasPrice: '0x09184e72a000', // 10 gwei
    }

    // Enviar la transacción
    const transactionHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    })

    console.log('Transaction Hash:', transactionHash)
    
    // Simular espera de confirmación (en producción usarías web3 para verificar)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    return transactionHash

  } catch (error: any) {
    console.error('Error en la transacción:', error)
    
    if (error.code === 4001) {
      alert('Transacción cancelada por el usuario')
    } else if (error.code === -32603) {
      alert('Error interno de la wallet')
    } else {
      alert(`Error en la transacción: ${error.message}`)
    }
    
    return null
  }
}

// Cargar modelos accedidos del localStorage al iniciar
const loadAccessedModels = () => {
  const saved = localStorage.getItem('accessedModels')
  if (saved) {
    accessedModels.value = JSON.parse(saved)
  }
}

// Inicializar
loadAccessedModels()
checkWalletConnection()

// Texto del botón según el estado
const getButtonText = (model: any) => {
  if (isLoading.value) return 'Procesando...'
  if (hasAccess(model.id)) return 'Entrar'
  return 'Acceder'
}

// Clase del botón según el estado
const getButtonClass = (model: any) => {
  const baseClass = "px-3 py-1 rounded text-sm transition-colors"
  
  if (isLoading.value) {
    return `${baseClass} bg-gray-400 text-gray-700 cursor-not-allowed`
  }
  
  if (hasAccess(model.id)) {
    return `${baseClass} btn-hover`
  }
  
  return `${baseClass} btn-hover`
}
</script>