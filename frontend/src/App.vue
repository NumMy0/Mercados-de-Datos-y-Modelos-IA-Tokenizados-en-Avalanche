<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const transitionName = computed(() => {
  return (route.meta?.transition as string) || 'page'
})
</script>

<template>
  <div class="min-h-screen w-full">
    <router-view v-slot="{ Component, route }">
      <Transition
        :name="transitionName"
        mode="out-in"
        appear
      >
        <component 
          :is="Component" 
          :key="route.path"
          v-motion
          :initial="{ opacity: 0, y: 50 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 500, ease: 'easeOut' } }"
          :leave="{ opacity: 0, y: -50, transition: { duration: 300, ease: 'easeIn' } }"
        />
      </Transition>
    </router-view>
  </div>
</template>

<style>
/* Transiciones entre páginas */
.page-enter-active,
.page-leave-active {
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

/* Transición suave para elementos con fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Transición slide para modales */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(100px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100px);
}

/* Transición scale para modales */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.modal-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.modal-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

/* Backdrop blur mejorado para modales */
.modal-backdrop {
  backdrop-filter: blur(8px) saturate(120%);
  -webkit-backdrop-filter: blur(8px) saturate(120%);
}

/* Soporte para navegadores que no soportan backdrop-filter */
@supports not (backdrop-filter: blur(8px)) {
  .modal-backdrop {
    background: rgba(255, 255, 255, 0.8);
  }
  
  .app-dark .modal-backdrop {
    background: rgba(0, 0, 0, 0.8);
  }
}
</style>