<script setup lang="ts">
withDefaults(
  defineProps<{
    tiles: Array<{
      key: string
      title: string
      thumbnail?: string
    }>
    brandIcon: string
    fill?: boolean
  }>(),
  { fill: false },
)

const emit = defineEmits<{
  play: [index: number]
}>()
</script>

<template>
  <div class="featured-gallery" :class="{ 'featured-gallery--fill': fill }">
    <button
      v-for="(tile, index) in tiles"
      :key="index"
      type="button"
      class="featured-gallery__tile"
      :title="tile.title"
      @click="emit('play', index)"
    >
      <Transition name="tile-swap" mode="out-in">
        <div :key="tile.key" class="featured-gallery__inner">
          <img
            v-if="tile.thumbnail"
            class="featured-gallery__cover"
            :src="tile.thumbnail"
            :alt="tile.title"
            loading="lazy"
          >
          <div v-else class="featured-gallery__placeholder">
            <Icon :name="brandIcon" />
          </div>
          <div class="featured-gallery__overlay">
            <Icon name="mdi:play-circle" class="featured-gallery__play" />
            <span class="featured-gallery__title">{{ tile.title }}</span>
          </div>
        </div>
      </Transition>
    </button>
  </div>
</template>

<style scoped lang="scss">
.featured-gallery {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 5px;
  width: 100%;
  aspect-ratio: 1;

  &--fill {
    flex: 1;
    min-height: 0;
    aspect-ratio: auto;
    height: 100%;
  }

  &__tile {
    position: relative;
    padding: 0;
    border: 0;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    background: color-mix(in srgb, currentColor 8%, transparent);
    min-width: 0;
    min-height: 0;
    color: inherit;

    &:focus-visible {
      outline: 2px solid color-mix(in srgb, currentColor 45%, transparent);
      outline-offset: 2px;
    }
  }

  &__inner {
    position: absolute;
    inset: 0;
  }

  &__cover {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  &__placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 24px;
    opacity: 0.4;
    background: color-mix(in srgb, currentColor 10%, transparent);
  }

  &__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 6px;
    background: linear-gradient(
      to top,
      rgb(0 0 0 / 78%) 0%,
      rgb(0 0 0 / 20%) 50%,
      transparent 75%
    );
  }

  &__play {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 32px;
    color: #fff;
    opacity: 0;
    filter: drop-shadow(0 2px 8px rgb(0 0 0 / 60%));
    transition: opacity 0.2s ease;
    pointer-events: none;
  }

  &__tile:hover &__play {
    opacity: 1;
  }

  &__title {
    position: relative;
    z-index: 1;
    font-size: 10px;
    font-weight: 600;
    line-height: 1.25;
    text-align: left;
    color: #fff;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.tile-swap-enter-active,
.tile-swap-leave-active {
  transition: opacity 0.35s ease;
}

.tile-swap-enter-from,
.tile-swap-leave-to {
  opacity: 0;
}
</style>
