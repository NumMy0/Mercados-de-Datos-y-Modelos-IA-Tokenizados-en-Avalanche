<template>
  <div class="p-6">
    <div class="mb-8">
      <h1 class="text-3xl font-bold tracking-tight">Configuración</h1>
      <p class="text-muted-foreground">
        Gestiona la configuración de tu cuenta y preferencias
      </p>
    </div>
    
    <div class="grid gap-6 md:grid-cols-2">
      <div class="space-y-4">
        <router-link to="/settings/general" class="block p-6 rounded-lg border hover:bg-accent">
          <h3 class="font-semibold mb-2">General</h3>
          <p class="text-sm text-muted-foreground">
            Configuración básica de la cuenta y preferencias personales
          </p>
        </router-link>
        
        <router-link to="/settings/team" class="block p-6 rounded-lg border hover:bg-accent">
          <h3 class="font-semibold mb-2">Equipo</h3>
          <p class="text-sm text-muted-foreground">
            Gestiona miembros del equipo y permisos
          </p>
        </router-link>
      </div>
      
      <div class="space-y-4">
        <router-link to="/settings/billing" class="block p-6 rounded-lg border hover:bg-accent">
          <h3 class="font-semibold mb-2">Facturación</h3>
          <p class="text-sm text-muted-foreground">
            Configuración de pagos y historial de transacciones
          </p>
        </router-link>
        
        <router-link to="/settings/limits" class="block p-6 rounded-lg border hover:bg-accent">
          <h3 class="font-semibold mb-2">Límites</h3>
          <p class="text-sm text-muted-foreground">
            Configuración de límites de uso y cuotas
          </p>
        </router-link>
      </div>
    </div>
    
    <div class="mt-8">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
// Vista de configuración del sistema
</script>