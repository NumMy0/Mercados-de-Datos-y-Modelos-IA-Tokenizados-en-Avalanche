<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">Documentación</h1>
      <p class="text-muted-foreground">
        Guías y referencias para el uso de la plataforma
      </p>
    </div>
    
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <h2 class="text-xl font-semibold">Guías de Inicio</h2>
        <div class="space-y-2">
          <router-link to="/documentation/introduction" class="block p-4 rounded-lg border hover:bg-accent">
            <h3 class="font-medium">Introducción</h3>
            <p class="text-sm text-muted-foreground">Conoce los conceptos básicos de la plataforma</p>
          </router-link>
          <router-link to="/documentation/get-started" class="block p-4 rounded-lg border hover:bg-accent">
            <h3 class="font-medium">Primeros Pasos</h3>
            <p class="text-sm text-muted-foreground">Configura tu cuenta y realiza tu primera transacción</p>
          </router-link>
        </div>
      </div>
      
      <div class="space-y-4">
        <h2 class="text-xl font-semibold">Recursos</h2>
        <div class="space-y-2">
          <router-link to="/documentation/tutorials" class="block p-4 rounded-lg border hover:bg-accent">
            <h3 class="font-medium">Tutoriales</h3>
            <p class="text-sm text-muted-foreground">Aprende a usar características avanzadas</p>
          </router-link>
          <router-link to="/documentation/changelog" class="block p-4 rounded-lg border hover:bg-accent">
            <h3 class="font-medium">Changelog</h3>
            <p class="text-sm text-muted-foreground">Últimas actualizaciones y mejoras</p>
          </router-link>
        </div>
      </div>
    </div>
    
    <div class="mt-8">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
// Vista de documentación y guías
</script>