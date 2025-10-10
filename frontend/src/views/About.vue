<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTransitions } from '../composables/useTransitions'
import Header from '../components/ui/header.vue'
import { 
  Lock, 
  DollarSign, 
  Zap, 
  Globe, 
  Shield, 
  ShoppingCart,
  Wallet,
  Bot,
  Gem,
  Triangle,
  Package,
  FileCode,
  ChevronDown,
  Github,
} from 'lucide-vue-next'

const router = useRouter()
const { staggeredList } = useTransitions()

const features = [
  {
    icon: Lock,
    title: 'Propiedad Descentralizada',
    description: 'Posee tus modelos de IA de forma segura mediante NFTs en la blockchain de Avalanche.'
  },
  {
    icon: DollarSign,
    title: 'Monetización Flexible',
    description: 'Vende modelos completos o crea planes de licencia para generar ingresos recurrentes.'
  },
  {
    icon: Zap,
    title: 'Transacciones Rápidas',
    description: 'Aprovecha la velocidad y bajas comisiones de la red Avalanche para operaciones instantáneas.'
  },
  {
    icon: Globe,
    title: 'Almacenamiento IPFS',
    description: 'Modelos almacenados de forma distribuida y permanente en IPFS.'
  },
  {
    icon: Shield,
    title: 'Smart Contracts',
    description: 'Transacciones seguras y transparentes mediante contratos inteligentes auditables.'
  },
  {
    icon: ShoppingCart,
    title: 'Marketplace Abierto',
    description: 'Descubre, compra y vende modelos de IA en un mercado global descentralizado.'
  }
]

const team = [
  {
    name: 'Santiago Rodríguez',
    role: 'Frontend y Backend Developer',
    initials: 'SR',
    description: 'Especialista en Web3 y Smart Contracts'
  },
  {
    name: 'Juan Esteban Agudelo',
    role: 'Blockchain Developer',
    initials: 'JA',
    description: 'Experto en desarrollo de Smart Contracts'
  },
  {
    name: 'Juan Alejandro Salgado',
    role: 'Backend Developer',
    initials: 'JS',
    description: 'Desarrollador de soluciones IA y ML'
  },
  {
    name: 'Valeria Roche Diago',
    role: 'DevOps y QA',
    initials: 'VR',
    description: 'Experta en integración y despliegue continuo'
  }
]

const stats = [
  { value: '5+', label: 'Modelos Disponibles' },
  { value: '100%', label: 'Descentralizado' },
  { value: '$0.01', label: 'Comisión Promedio' }
]

const techStack = [
  { icon: Triangle, name: 'Avalanche', description: 'Blockchain' },
  { icon: Package, name: 'IPFS', description: 'Almacenamiento' },
  { icon: FileCode, name: 'Solidity', description: 'Smart Contracts' },
  { icon: Zap, name: 'Vue 3', description: 'Frontend' }
]

const faqs = [
  {
    question: '¿Qué es un modelo de IA tokenizado?',
    answer: 'Es un modelo de inteligencia artificial cuya propiedad se representa mediante un NFT en la blockchain, permitiendo compra, venta y licenciamiento de forma descentralizada.',
    open: ref(false)
  },
  {
    question: '¿Por qué usar Avalanche?',
    answer: 'Avalanche ofrece transacciones ultrarrápidas (menos de 1 segundo), comisiones muy bajas y una red altamente escalable, ideal para un marketplace de modelos de IA.',
    open: ref(false)
  },
  {
    question: '¿Cómo funcionan las licencias?',
    answer: 'Los propietarios de modelos pueden crear planes de licencia con diferentes precios, duraciones y límites de uso. Los usuarios compran acceso temporal sin adquirir la propiedad completa.',
    open: ref(false)
  },
  {
    question: '¿Dónde se almacenan los modelos?',
    answer: 'Los modelos se almacenan en IPFS (InterPlanetary File System), garantizando almacenamiento distribuido, permanente y resistente a la censura.',
    open: ref(false)
  },
  {
    question: '¿Necesito conocimientos técnicos?',
    answer: 'No necesariamente. La interfaz está diseñada para ser intuitiva. Solo necesitas una wallet compatible (como MetaMask) y algo de AVAX para las transacciones.',
    open: ref(false)
  },
  {
    question: '¿Puedo vender mis propios modelos?',
    answer: 'Sí, cualquier usuario puede subir, tokenizar y vender sus modelos de IA. Tú decides el precio, las condiciones de venta y los planes de licencia.',
    open: ref(false)
  }
]

const toggleFaq = (index: number) => {
  if (faqs[index] && faqs[index].open) {
    faqs[index].open.value = !faqs[index].open.value
  }
}

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 app-dark:bg-gray-950 transition-colors duration-200">
    <Header 
      v-motion
      :initial="{ opacity: 0, y: -50 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 500, ease: 'easeOut' } }"
    />
    
    <!-- Hero Section -->
    <section 
      class="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 text-white py-20 sm:py-24"
      v-motion
      :initial="{ opacity: 0, scale: 0.95 }"
      :enter="{ opacity: 1, scale: 1, transition: { duration: 800, ease: 'easeOut', delay: 200 } }"
    >
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6TTI0IDM0YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00ek0xMiAzNGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6bTAtMTBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
      
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 class="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
          Mercado de Modelos IA<br/>Tokenizados en Avalanche
        </h1>
        <p class="text-lg sm:text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
          Descentralizando el futuro de la Inteligencia Artificial mediante blockchain
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <button 
            @click="scrollToSection('features')"
            class="px-6 sm:px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Descubre Más
          </button>
          <button 
            @click="router.push('/models')"
            class="px-6 sm:px-8 py-3 bg-blue-500 bg-opacity-20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-opacity-30 transition-all duration-200 border border-white border-opacity-20"
          >
            Explorar Modelos
          </button>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section 
      class="py-12 bg-white app-dark:bg-gray-900 transition-colors duration-200"
      v-motion
      :initial="{ opacity: 0, y: 50 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 600, ease: 'easeOut', delay: 400 } }"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 md:grid-cols-3 gap-8">
          <div 
            v-for="(stat, index) in stats" 
            :key="stat.label" 
            class="text-center"
            v-motion
            :initial="{ opacity: 0, scale: 0.8 }"
            :enter="{ 
              opacity: 1, 
              scale: 1, 
              transition: { 
                duration: 400,
                delay: 600 + (index * 100),
                ease: 'easeOut'
              } 
            }"
          >
            <div class="text-3xl sm:text-4xl font-bold text-blue-600 app-dark:text-blue-400 mb-2">
              {{ stat.value }}
            </div>
            <div class="text-sm sm:text-base text-gray-600 app-dark:text-gray-400">
              {{ stat.label }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-16 sm:py-20 bg-gray-50 app-dark:bg-gray-950 transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 sm:mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 app-dark:text-white mb-4">
            ¿Por qué Elegirnos?
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 app-dark:text-gray-400 max-w-2xl mx-auto">
            Combinamos lo mejor de la IA y la blockchain para crear un ecosistema único
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div 
            v-for="(feature, index) in features" 
            :key="feature.title"
            class="bg-white app-dark:bg-gray-900 p-6 sm:p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 border border-gray-200 app-dark:border-gray-800 group"
            v-motion
            v-bind="staggeredList(index, 100)"
          >
            <div class="w-12 h-12 mb-4 bg-blue-100 app-dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <component :is="feature.icon" class="w-6 h-6 text-blue-600 app-dark:text-blue-400" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 app-dark:text-white mb-3">
              {{ feature.title }}
            </h3>
            <p class="text-gray-600 app-dark:text-gray-400">
              {{ feature.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="py-16 sm:py-20 bg-white app-dark:bg-gray-900 transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 sm:mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 app-dark:text-white mb-4">
            ¿Cómo Funciona?
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 app-dark:text-gray-400 max-w-2xl mx-auto">
            Simple, seguro y transparente
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
          <div class="text-center group">
            <div class="w-16 h-16 mx-auto mb-6 bg-blue-100 app-dark:bg-blue-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Wallet class="w-8 h-8 text-blue-600 app-dark:text-blue-400" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 app-dark:text-white mb-3">1. Conecta tu Wallet</h3>
            <p class="text-gray-600 app-dark:text-gray-400">
              Conecta MetaMask u otra wallet compatible con Avalanche C-Chain
            </p>
          </div>

          <div class="text-center group">
            <div class="w-16 h-16 mx-auto mb-6 bg-purple-100 app-dark:bg-purple-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Bot class="w-8 h-8 text-purple-600 app-dark:text-purple-400" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 app-dark:text-white mb-3">2. Sube o Explora</h3>
            <p class="text-gray-600 app-dark:text-gray-400">
              Tokeniza tus modelos de IA o explora el marketplace para encontrar el perfecto
            </p>
          </div>

          <div class="text-center group">
            <div class="w-16 h-16 mx-auto mb-6 bg-green-100 app-dark:bg-green-900/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Gem class="w-8 h-8 text-green-600 app-dark:text-green-400" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 app-dark:text-white mb-3">3. Compra o Licencia</h3>
            <p class="text-gray-600 app-dark:text-gray-400">
              Adquiere propiedad completa o compra una licencia temporal de uso
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Technology Stack -->
    <section class="py-16 sm:py-20 bg-gray-50 app-dark:bg-gray-950 transition-colors duration-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 sm:mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 app-dark:text-white mb-4">
            Stack Tecnológico
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 app-dark:text-gray-400 max-w-2xl mx-auto">
            Construido con las mejores tecnologías del ecosistema Web3
          </p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div 
            v-for="tech in techStack" 
            :key="tech.name"
            class="bg-white app-dark:bg-gray-900 p-6 rounded-xl border border-gray-200 app-dark:border-gray-800 text-center group hover:shadow-lg transition-all duration-200"
          >
            <div class="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-purple-100 app-dark:from-blue-900/30 app-dark:to-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <component :is="tech.icon" class="w-6 h-6 text-blue-600 app-dark:text-blue-400" />
            </div>
            <h4 class="font-bold text-gray-900 app-dark:text-white mb-1">{{ tech.name }}</h4>
            <p class="text-sm text-gray-600 app-dark:text-gray-400">{{ tech.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="py-16 sm:py-20 bg-white app-dark:bg-gray-900 transition-colors duration-200">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 sm:mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 app-dark:text-white mb-4">
            Preguntas Frecuentes
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 app-dark:text-gray-400">
            Todo lo que necesitas saber
          </p>
        </div>

        <div class="space-y-4">
          <div 
            v-for="(faq, index) in faqs" 
            :key="index"
            class="bg-gray-50 app-dark:bg-gray-950 rounded-lg border border-gray-200 app-dark:border-gray-800 overflow-hidden transition-colors duration-200"
          >
            <button
              @click="toggleFaq(index)"
              class="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-gray-100 app-dark:hover:bg-gray-800 transition-colors"
            >
              <span class="font-semibold text-gray-900 app-dark:text-white pr-4">
                {{ faq.question }}
              </span>
              <ChevronDown
                :class="{ 'rotate-180': faq.open.value }"
                class="w-5 h-5 text-gray-500 app-dark:text-gray-400 transition-transform flex-shrink-0"
              />
            </button>
            <Transition name="faq">
              <div v-if="faq.open.value" class="px-6 pb-4">
                <p class="text-gray-600 app-dark:text-gray-400">
                  {{ faq.answer }}
                </p>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="py-16 sm:py-20 bg-gray-50 app-dark:bg-gray-950 transition-colors duration-200s">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12 sm:mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 app-dark:text-white mb-4">
            Nuestro Equipo
          </h2>
          <p class="text-lg sm:text-xl text-gray-600 app-dark:text-gray-400">
            Apasionados por la descentralización y la IA
          </p>
        </div>

        <div class="flex justify-center gap-5">
          <div 
            v-for="member in team" 
            :key="member.name"
            class="bg-white app-dark:bg-gray-900 p-8 rounded-xl shadow-md border border-gray-200 app-dark:border-gray-800 text-center max-w-sm hover:shadow-xl transition-all duration-200"
          >
            <div class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {{ member.initials }}
            </div>
            <h3 class="text-xl font-bold text-gray-900 app-dark:text-white mb-2">
              {{ member.name }}
            </h3>
            <p class="text-blue-600 app-dark:text-blue-400 mb-3">{{ member.role }}</p>
            <p class="text-gray-600 app-dark:text-gray-400">
              {{ member.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 sm:py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl sm:text-4xl font-bold mb-6">
          ¿Listo para Empezar?
        </h2>
        <p class="text-lg sm:text-xl mb-8 text-blue-100">
          Únete al futuro descentralizado de la Inteligencia Artificial
        </p>
        <div class="flex flex-wrap justify-center gap-4">
          <button 
            @click="router.push('/models')"
            class="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            Explorar Marketplace
          </button>
          <a 
            href="https://github.com/NumMy0/Mercados-de-Datos-y-Modelos-IA-Tokenizados-en-Avalanche"
            target="_blank"
            class="px-8 py-3 bg-blue-500 bg-opacity-20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-opacity-30 transition-all duration-200 border border-white border-opacity-20 inline-flex items-center gap-2"
          >
            <Github class="w-5 h-5" />
            Ver en GitHub
          </a>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-gray-400 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p class="mb-2 flex items-center justify-center gap-2">
          © 2025 AI Marketplace. Diseñado con Avalanche
        </p>
        <p class="text-sm">
          Descentralizando el futuro de la Inteligencia Artificial
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Smooth transitions */
* {
  transition-property: background-color, border-color, color, box-shadow, transform;
  transition-duration: 200ms;
  transition-timing-function: ease-in-out;
}

/* FAQ Transition */
.faq-enter-active,
.faq-leave-active {
  transition: all 0.3s ease;
}

.faq-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.faq-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
