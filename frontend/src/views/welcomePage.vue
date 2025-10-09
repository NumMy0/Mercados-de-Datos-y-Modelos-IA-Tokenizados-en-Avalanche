<script setup lang="ts">
import { computed } from 'vue'
import { useWallet } from '../composables/useWallet'
import { useRouter } from 'vue-router'
import WelcomeCard from '../components/ui/WelcomeCard.vue'

const { connectWallet, isConnecting, error } = useWallet()
const router = useRouter()

const handleConnectWallet = async () => {
  try {
    await connectWallet()
    // Redirigir a ModelsPage después de conectar exitosamente
    router.push('/models')
  } catch (err) {
    console.error('Error al conectar:', err)
  }
}

const handleExploreModels = () => {
  router.push('/models')
}

// Configuración de botones para la card
const cardButtons = computed(() => [
  {
    label: 'Conectar Wallet',
    onClick: handleConnectWallet,
    variant: 'secondary' as const,
    disabled: isConnecting.value,
    loading: isConnecting.value
  },
  {
    label: 'Explorar Modelos',
    onClick: handleExploreModels,
    variant: 'primary' as const
  }
])
</script>

<template>
  <div class="min-h-screen w-full bg-gray-50 app-dark:bg-gray-900 flex items-center justify-center px-4 py-12 transition-colors duration-200">
    <WelcomeCard
      title="IA Marketplace"
      subtitle="Mercado de Modelos de IA"
      description="Descubre y tokeniza modelos de inteligencia artificial en la blockchain de Avalanche. Conecta tu wallet para comenzar a explorar."
      :buttons="cardButtons"
      :error="error"
    />
  </div>
</template>


