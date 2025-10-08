<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">Proyectos</h1>
      <p class="text-muted-foreground">
        Gestiona tus proyectos y colaboraciones
      </p>
    </div>
    
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <router-link to="/projects/design-engineering" class="block">
        <div class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm hover:bg-accent transition-colors">
          <div class="flex items-center space-x-4 mb-4">
            <div class="p-2 bg-primary/10 rounded-lg">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3V21H21V3H3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 9H15V15H9V9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold">Design Engineering</h3>
              <p class="text-sm text-muted-foreground">5 modelos activos</p>
            </div>
          </div>
          <p class="text-sm text-muted-foreground">
            Proyecto de diseño de interfaces y experiencia de usuario
          </p>
        </div>
      </router-link>
      
      <router-link to="/projects/sales-marketing" class="block">
        <div class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm hover:bg-accent transition-colors">
          <div class="flex items-center space-x-4 mb-4">
            <div class="p-2 bg-primary/10 rounded-lg">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold">Sales & Marketing</h3>
              <p class="text-sm text-muted-foreground">3 modelos activos</p>
            </div>
          </div>
          <p class="text-sm text-muted-foreground">
            Análisis de mercado y estrategias de ventas automatizadas
          </p>
        </div>
      </router-link>
      
      <router-link to="/projects/travel" class="block">
        <div class="rounded-lg border bg-card p-6 text-card-foreground shadow-sm hover:bg-accent transition-colors">
          <div class="flex items-center space-x-4 mb-4">
            <div class="p-2 bg-primary/10 rounded-lg">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 10C21 17 12 23 12 23S3 17 3 10A9 9 0 0 1 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold">Travel</h3>
              <p class="text-sm text-muted-foreground">2 modelos activos</p>
            </div>
          </div>
          <p class="text-sm text-muted-foreground">
            Optimización de rutas y predicción de demanda turística
          </p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// Vista de proyectos y colaboraciones
</script>