<script setup lang="ts">
import { useNotifications, type Notification } from '../composables/useNotifications'

const { notifications, removeNotification } = useNotifications()

const handleClose = (id: string) => {
  removeNotification(id)
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'error':
      return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'warning':
      return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    case 'info':
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    default:
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }
}

const getNotificationClasses = (type: Notification['type']) => {
  const baseClasses = 'border backdrop-blur-sm shadow-xl'
  
  switch (type) {
    case 'success':
      return `${baseClasses} bg-green-50/95 app-dark:bg-green-900/95 border-green-200 app-dark:border-green-700 text-green-800 app-dark:text-green-200`
    case 'error':
      return `${baseClasses} bg-red-50/95 app-dark:bg-red-900/95 border-red-200 app-dark:border-red-700 text-red-800 app-dark:text-red-200`
    case 'warning':
      return `${baseClasses} bg-yellow-50/95 app-dark:bg-yellow-900/95 border-yellow-200 app-dark:border-yellow-700 text-yellow-800 app-dark:text-yellow-200`
    case 'info':
      return `${baseClasses} bg-blue-50/95 app-dark:bg-blue-900/95 border-blue-200 app-dark:border-blue-700 text-blue-800 app-dark:text-blue-200`
    default:
      return `${baseClasses} bg-gray-50/95 app-dark:bg-gray-900/95 border-gray-200 app-dark:border-gray-700 text-gray-800 app-dark:text-gray-200`
  }
}

const getIconClasses = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'text-green-500 app-dark:text-green-400'
    case 'error':
      return 'text-red-500 app-dark:text-red-400'
    case 'warning':
      return 'text-yellow-500 app-dark:text-yellow-400'
    case 'info':
      return 'text-blue-500 app-dark:text-blue-400'
    default:
      return 'text-gray-500 app-dark:text-gray-400'
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none">
      <TransitionGroup
        name="notification"
        tag="div"
        appear
      >
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'max-w-sm w-full rounded-lg p-4 pointer-events-auto transform transition-all duration-300',
            getNotificationClasses(notification.type)
          ]"
          v-motion
          :initial="{ opacity: 0, x: 100, scale: 0.95 }"
          :enter="{ opacity: 1, x: 0, scale: 1, transition: { duration: 400, ease: 'easeOut' } }"
          :leave="{ opacity: 0, x: 100, scale: 0.95, transition: { duration: 300, ease: 'easeIn' } }"
        >
          <div class="flex items-start gap-3">
            <!-- Icon -->
            <div class="flex-shrink-0">
              <svg 
                :class="['w-6 h-6', getIconClasses(notification.type)]"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                  stroke-width="2" 
                  :d="getNotificationIcon(notification.type)"
                />
              </svg>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-sm leading-tight">
                {{ notification.title }}
              </h4>
              <p 
                v-if="notification.message"
                class="mt-1 text-xs opacity-90 leading-relaxed"
              >
                {{ notification.message }}
              </p>
            </div>

            <!-- Close Button -->
            <button
              @click="handleClose(notification.id)"
              class="flex-shrink-0 p-1 rounded-full hover:bg-black/10 app-dark:hover:bg-white/10 transition-colors"
              :aria-label="`Cerrar notificación: ${notification.title}`"
            >
              <svg class="w-4 h-4 opacity-60 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Progress bar for timed notifications -->
          <div 
            v-if="!notification.persistent && notification.duration"
            class="mt-3 h-1 bg-black/10 app-dark:bg-white/10 rounded-full overflow-hidden"
          >
            <div 
              class="h-full bg-current opacity-30 rounded-full animate-notification-progress"
              :style="{ animationDuration: `${notification.duration}ms` }"
            ></div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
/* Notification transitions */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.notification-move {
  transition: transform 0.3s ease;
}

/* Progress bar animation */
@keyframes notification-progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.animate-notification-progress {
  animation: notification-progress linear forwards;
}
</style>