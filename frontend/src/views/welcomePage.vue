<script setup lang="ts">
import { computed } from 'vue'
import { useWallet } from '../composables/useWallet'
import { useRouter } from 'vue-router'
import { useTransitions } from '../composables/useTransitions'
import WelcomeCard from '../components/cards/WelcomeCard.vue'

const { connectWallet, isConnecting, error } = useWallet()
const router = useRouter()
const { scaleIn } = useTransitions()

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
  <div 
    class="min-h-screen w-full bg-gray-50 app-dark:bg-gray-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 transition-colors duration-200"
    v-motion
    :initial="{ opacity: 0 }"
    :enter="{ opacity: 1, transition: { duration: 600 } }"
  >
    <WelcomeCard
      title="IA Marketplace"
      subtitle="Mercado de Modelos de IA"
      description="Descubre y tokeniza modelos de inteligencia artificial en la blockchain de Avalanche. Conecta tu wallet para comenzar a explorar."
      :buttons="cardButtons"
      :error="error"
      v-motion
      v-bind="scaleIn(200)"
    />
  </div>
</template>


