<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue'
import { MenuIcon } from 'lucide-vue-next'
import { ref } from 'vue'

const sidebarOpen = ref(true)

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="flex h-screen" style="background-color: hsl(var(--background))">
    <!-- Sidebar -->
    <transition name="sidebar">
      <AppSidebar v-if="sidebarOpen" />
    </transition>
    
    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Top Bar -->
      <header class="px-4 py-3 flex items-center justify-between" style="background-color: hsl(var(--background)); border-bottom: 1px solid hsl(var(--border))">
        <div class="flex items-center space-x-4">
          <button 
            @click="toggleSidebar"
            class="p-2 rounded-md btn-hover"
          >
            <MenuIcon class="w-5 h-5" />
          </button>
          
          <nav class="text-sm" style="color: hsl(var(--muted-foreground))">
            <span class="font-medium" style="color: hsl(var(--foreground))">{{ $route.meta.title || 'Dashboard' }}</span>
          </nav>
        </div>
      </header>
      
      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 0.3s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(-100%);
}
</style>

