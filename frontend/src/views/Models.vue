<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">Modelos IA</h1>
      <p class="text-muted-foreground">
        Explora y gestiona modelos de IA tokenizados
      </p>
    </div>
    
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h3 class="font-semibold mb-2">Genesis</h3>
        <p class="text-sm text-muted-foreground mb-4">
          Modelo de lenguaje natural avanzado para procesamiento de texto
        </p>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">0.05 AVAX</span>
          <button class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors">
            Acceder
          </button>
        </div>
      </div>
      
      <div class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h3 class="font-semibold mb-2">Explorer</h3>
        <p class="text-sm text-muted-foreground mb-4">
          Modelo de análisis de datos y predicciones de mercado
        </p>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">0.08 AVAX</span>
          <button class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors">
            Acceder
          </button>
        </div>
      </div>
      
      <div class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h3 class="font-semibold mb-2">Quantum</h3>
        <p class="text-sm text-muted-foreground mb-4">
          Modelo cuántico para optimización y simulaciones complejas
        </p>
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">0.12 AVAX</span>
          <button class="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90 transition-colors">
            Acceder
          </button>
        </div>
      </div>
    </div>
    
    <div class="mt-8">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
// Vista de modelos IA disponibles
</script>