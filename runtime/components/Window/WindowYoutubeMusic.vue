<script setup lang="ts">
const props = defineProps<{
  window?: IWindowController
}>()
</script>

<template>
  <Window v-bind="$props" >
      <iframe
        width="315" height="315"
        :src="`https://www.youtube.com/embed/${props.window.meta.videoId}`"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerpolicy="strict-origin-when-cross-origin" allowfullscreen
      />
  </Window>
</template>
