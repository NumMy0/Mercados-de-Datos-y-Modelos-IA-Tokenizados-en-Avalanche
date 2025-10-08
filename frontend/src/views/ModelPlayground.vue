<template>
  <div class="p-6">
    <!-- Header del playground -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">{{ modelInfo.name }} Playground</h1>
          <p class="text-muted-foreground">
            {{ modelInfo.description }}
          </p>
        </div>
        <button 
          @click="goBack"
          class="px-4 py-2 text-sm rounded-md btn-hover"
          style="background-color: hsl(var(--secondary)); color: hsl(var(--secondary-foreground))"
        >
          ← Volver a Modelos
        </button>
      </div>
    </div>

    <!-- Status del modelo -->
    <div class="space-y-4 mb-6">
      <div class="p-4 rounded-lg" style="background-color: hsl(var(--secondary)); color: hsl(var(--secondary-foreground))">
        <div class="flex items-center space-x-3">
          <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span class="text-sm font-medium">Modelo activo y listo para usar</span>
        </div>
      </div>
      
      <!-- Indicador de modo de prueba -->
      <div v-if="testMode" class="p-3 rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-300">
        <div class="flex items-center space-x-2">
          <span class="text-lg">🧪</span>
          <span class="text-sm font-medium">Modo de Prueba Activo</span>
          <span class="text-xs">• Los costos de ejecución no se cobrarán</span>
        </div>
      </div>
    </div>

    <!-- Interfaz del playground -->
    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Panel de entrada -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Entrada</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Prompt / Consulta</label>
            <textarea
              v-model="inputPrompt"
              placeholder="Escribe tu consulta aquí..."
              class="w-full h-32 p-3 rounded-md border text-sm"
              style="background-color: hsl(var(--background)); border-color: hsl(var(--border)); color: hsl(var(--foreground))"
            ></textarea>
          </div>
          
          <div v-if="modelInfo.id === 'explorer'" class="space-y-2">
            <label class="block text-sm font-medium">Datos de mercado (opcional)</label>
            <input
              v-model="marketData"
              type="text"
              placeholder="Ej: BTC, ETH, AVAX"
              class="w-full p-2 rounded-md border text-sm"
              style="background-color: hsl(var(--background)); border-color: hsl(var(--border)); color: hsl(var(--foreground))"
            />
          </div>
          
          <div v-if="modelInfo.id === 'quantum'" class="space-y-2">
            <label class="block text-sm font-medium">Parámetros cuánticos</label>
            <div class="grid grid-cols-2 gap-2">
              <input
                v-model="quantumParams.qubits"
                type="number"
                placeholder="Qubits"
                min="1"
                max="20"
                class="p-2 rounded-md border text-sm"
                style="background-color: hsl(var(--background)); border-color: hsl(var(--border)); color: hsl(var(--foreground))"
              />
              <input
                v-model="quantumParams.iterations"
                type="number"
                placeholder="Iteraciones"
                min="1"
                max="1000"
                class="p-2 rounded-md border text-sm"
                style="background-color: hsl(var(--background)); border-color: hsl(var(--border)); color: hsl(var(--foreground))"
              />
            </div>
          </div>
          
          <button
            @click="executeModel"
            :disabled="isExecuting || !inputPrompt.trim()"
            class="w-full py-3 rounded-md font-medium transition-colors"
            :class="isExecuting || !inputPrompt.trim() 
              ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
              : 'btn-hover'"
            :style="!(isExecuting || !inputPrompt.trim()) 
              ? 'background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground))' 
              : ''"
          >
            {{ isExecuting ? 'Ejecutando...' : `Ejecutar ${modelInfo.name}` }}
          </button>
        </div>
      </div>

      <!-- Panel de salida -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold">Resultado</h3>
        
        <div 
          class="min-h-64 p-4 rounded-md border"
          style="background-color: hsl(var(--muted)); border-color: hsl(var(--border))"
        >
          <div v-if="isExecuting" class="flex items-center justify-center h-32">
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 bg-primary rounded-full animate-bounce"></div>
              <div class="w-4 h-4 bg-primary rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
              <div class="w-4 h-4 bg-primary rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
          </div>
          
          <div v-else-if="result" class="space-y-4">
            <div class="text-sm font-medium">Respuesta del modelo:</div>
            <div class="text-sm whitespace-pre-wrap" style="color: hsl(var(--foreground))">{{ result }}</div>
            
            <div v-if="executionStats" class="pt-4 border-t" style="border-color: hsl(var(--border))">
              <div class="text-xs space-y-1" style="color: hsl(var(--muted-foreground))">
                <div>Tiempo de ejecución: {{ executionStats.time }}ms</div>
                <div>Tokens procesados: {{ executionStats.tokens }}</div>
                <div>
                  Costo: {{ executionStats.cost }} AVAX
                  <span v-if="testMode" class="text-yellow-600">🧪 (Sin cargo)</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="flex items-center justify-center h-32 text-sm" style="color: hsl(var(--muted-foreground))">
            Los resultados aparecerán aquí después de la ejecución
          </div>
        </div>
      </div>
    </div>

    <!-- Historial de ejecuciones -->
    <div v-if="executionHistory.length > 0" class="mt-8">
      <h3 class="text-lg font-semibold mb-4">Historial de ejecuciones</h3>
      <div class="space-y-2">
        <div 
          v-for="(execution, index) in executionHistory.slice().reverse()" 
          :key="index"
          class="p-3 rounded-md border cursor-pointer hover:bg-accent"
          style="border-color: hsl(var(--border))"
          @click="loadExecution(execution)"
        >
          <div class="text-sm font-medium truncate">{{ execution.prompt }}</div>
          <div class="text-xs mt-1" style="color: hsl(var(--muted-foreground))">
            {{ new Date(execution.timestamp).toLocaleString() }} • {{ execution.cost }} AVAX
            <span v-if="execution.testMode" class="text-yellow-600">🧪</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Estados reactivos
const inputPrompt = ref('')
const result = ref('')
const isExecuting = ref(false)
const marketData = ref('')
const quantumParams = ref({
  qubits: 5,
  iterations: 100
})
const executionStats = ref<any>(null)
const executionHistory = ref<any[]>([])

// Estado del modo de prueba (sincronizado con Models.vue)
const testMode = ref(true) // Por defecto en modo de prueba

// Información del modelo según la ruta
const modelInfo = computed(() => {
  const modelId = route.path.split('/')[2] // Extrae el ID del modelo de la URL
  
  const models: any = {
    genesis: {
      id: 'genesis',
      name: 'Genesis',
      description: 'Modelo de lenguaje natural avanzado para procesamiento de texto',
      costPerToken: 0.000001
    },
    explorer: {
      id: 'explorer', 
      name: 'Explorer',
      description: 'Modelo de análisis de datos y predicciones de mercado',
      costPerToken: 0.000002
    },
    quantum: {
      id: 'quantum',
      name: 'Quantum',
      description: 'Modelo cuántico para optimización y simulaciones complejas',
      costPerToken: 0.000003
    }
  }
  
  return models[modelId] || models.genesis
})

// Ejecutar el modelo
const executeModel = async () => {
  if (!inputPrompt.value.trim()) return
  
  isExecuting.value = true
  result.value = ''
  executionStats.value = null
  
  try {
    // Simular tiempo de procesamiento
    const startTime = Date.now()
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
    
    // Generar respuesta simulada según el tipo de modelo
    let response = ''
    let tokens = 0
    
    if (modelInfo.value.id === 'genesis') {
      response = generateGenesisResponse(inputPrompt.value)
      tokens = Math.floor(response.length / 4) // Aproximadamente 4 chars por token
    } else if (modelInfo.value.id === 'explorer') {
      response = generateExplorerResponse(inputPrompt.value, marketData.value)
      tokens = Math.floor(response.length / 4)
    } else if (modelInfo.value.id === 'quantum') {
      response = generateQuantumResponse(inputPrompt.value, quantumParams.value)
      tokens = Math.floor(response.length / 4)
    }
    
    const endTime = Date.now()
    const executionTime = endTime - startTime
    const cost = (tokens * modelInfo.value.costPerToken).toFixed(6)
    
    result.value = response
    executionStats.value = {
      time: executionTime,
      tokens: tokens,
      cost: cost
    }
    
    // Agregar al historial
    const execution = {
      prompt: inputPrompt.value,
      response: response,
      timestamp: Date.now(),
      cost: cost,
      model: modelInfo.value.id,
      testMode: testMode.value // Incluir estado del modo de prueba
    }
    
    executionHistory.value.push(execution)
    
    // Guardar historial en localStorage
    localStorage.setItem(`${modelInfo.value.id}_history`, JSON.stringify(executionHistory.value))
    
  } catch (error) {
    console.error('Error ejecutando modelo:', error)
    result.value = 'Error: No se pudo ejecutar el modelo. Inténtalo de nuevo.'
  } finally {
    isExecuting.value = false
  }
}

// Generar respuestas simuladas
const generateGenesisResponse = (prompt: string) => {
  const responses = [
    `Análisis completo de: "${prompt}"\n\nBasado en el procesamiento de lenguaje natural avanzado, aquí están los insights principales:\n\n1. Contexto identificado: ${prompt.split(' ').slice(0, 3).join(' ')}\n2. Intención detectada: Consulta informativa\n3. Respuesta optimizada: [Contenido generado específicamente para tu consulta]\n\nEste análisis ha sido procesado utilizando técnicas de transformers y atención multi-cabeza para garantizar la máxima precisión en la comprensión del contexto.`,
    `Procesamiento Genesis completado para: "${prompt}"\n\nResultados del análisis semántico:\n\n✓ Entidades reconocidas: ${Math.floor(Math.random() * 10) + 1}\n✓ Sentimiento: ${['Positivo', 'Neutral', 'Analítico'][Math.floor(Math.random() * 3)]}\n✓ Complejidad: ${['Baja', 'Media', 'Alta'][Math.floor(Math.random() * 3)]}\n\nRespuesta generativa:\n${prompt.length > 50 ? 'Consulta compleja detectada. Generando respuesta detallada...' : 'Consulta directa procesada exitosamente.'}\n\nLa arquitectura Genesis ha optimizado esta respuesta usando ${Math.floor(Math.random() * 1000) + 500} parámetros activos.`
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}

const generateExplorerResponse = (prompt: string, market: string) => {
  const markets = market ? market.split(',').map(m => m.trim()) : ['BTC', 'ETH', 'AVAX']
  const predictions = markets.map(m => ({
    symbol: m,
    prediction: `${(Math.random() * 20 - 10).toFixed(2)}%`,
    confidence: `${(Math.random() * 40 + 60).toFixed(1)}%`
  }))
  
  return `Análisis Explorer para: "${prompt}"\n\nPREDICCIONES DE MERCADO:\n${predictions.map(p => `${p.symbol}: ${p.prediction} (Confianza: ${p.confidence})`).join('\n')}\n\nFACTORES ANALIZADOS:\n• Volatilidad histórica\n• Volumen de trading\n• Indicadores técnicos\n• Sentiment del mercado\n• Correlaciones cross-asset\n\nRECOMENDAC IÓN:\n${Math.random() > 0.5 ? 'MANTENER posiciones actuales' : 'REVISAR estrategia de portafolio'}\n\nNota: Predicciones basadas en modelos de machine learning entrenados con datos de mercado en tiempo real.`
}

const generateQuantumResponse = (prompt: string, params: any) => {
  const qubits = params.qubits || 5
  const iterations = params.iterations || 100
  
  return `Simulación Quantum completada para: "${prompt}"\n\nPARÁMETROS DE SIMULACIÓN:\n• Qubits utilizados: ${qubits}\n• Iteraciones: ${iterations}\n• Entrelazamiento: ${(Math.random() * 0.8 + 0.2).toFixed(3)}\n\nRESULTADOS CUÁNTICOS:\n• Estado final: |${Math.floor(Math.random() * 2)}${Math.floor(Math.random() * 2)}${Math.floor(Math.random() * 2)}⟩\n• Probabilidad dominante: ${(Math.random() * 0.6 + 0.4).toFixed(3)}\n• Ventaja cuántica: ${(Math.random() * 1000 + 100).toFixed(0)}x speedup\n\nOPTIMIZACIÓN ENCONTRADA:\nSolución óptima identificada con ${(Math.random() * 95 + 5).toFixed(1)}% de certeza.\nReducción de complejidad: O(2^n) → O(√2^n)\n\nEsta simulación aprovecha la superposición cuántica y el entrelazamiento para explorar exponencialmente más soluciones que los algoritmos clásicos.`
}

// Cargar ejecución del historial
const loadExecution = (execution: any) => {
  inputPrompt.value = execution.prompt
  result.value = execution.response
  executionStats.value = {
    time: 0,
    tokens: Math.floor(execution.response.length / 4),
    cost: execution.cost
  }
}

// Volver a la página de modelos
const goBack = () => {
  router.push('/models')
}

// Cargar historial al montar
onMounted(() => {
  const saved = localStorage.getItem(`${modelInfo.value.id}_history`)
  if (saved) {
    executionHistory.value = JSON.parse(saved)
  }
})
</script>

<style scoped>
.animate-bounce {
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.bg-green-500 {
  background-color: #10b981;
}

.hover\:bg-accent:hover {
  background-color: hsl(var(--accent));
}

.min-h-64 {
  min-height: 16rem;
}

.h-32 {
  height: 8rem;
}

.whitespace-pre-wrap {
  white-space: pre-wrap;
}
</style>