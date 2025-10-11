<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
}>()
</script>

<template>
  <div>
    <h3 class="text-sm font-semibold text-gray-500 app-dark:text-gray-400 uppercase">
      {{ title }}
    </h3>
    <p class="mt-1 text-gray-900 app-dark:text-white">
      {{ value }}
    </p>
  </div>
</template>
