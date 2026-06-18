<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getYouTubeId, isValidYouTubeUrl } from '../../utils/utilYoutube'

import { useRuntimeConfig } from '#imports'

const props = defineProps<{
  window: IWindowController
}>()

const runtimeConfig = useRuntimeConfig()
const youtubeConfig = runtimeConfig.public.desktop?.['org.owdproject.youtube'] || {}
const inputUrl = ref('')
const history = ref<{ id: string; title: string; date: string }[]>([])
const favorites = ref<{ id: string; title: string }[]>(
  youtubeConfig.featuredStations || [
    { id: 'jfKfPfyJRdk', title: 'Lofi Girl - Lofi Hip Hop Radio' },
    { id: '5qap5aO4i9A', title: 'Lofi Hip Hop Radio - Beats to Study/Relax' },
    { id: 'tNkZs5MStGQ', title: 'Ambient Nature Sounds for Study' }
  ]
)
// showPlayer is derived per-window from meta — no global state
const showPlayer = computed(() => !!(props.window.meta.videoId))

// Load history from localStorage
onMounted(() => {
  const stored = localStorage.getItem('owd_youtube_history')
  if (stored) {
    try {
      history.value = JSON.parse(stored)
    } catch (e) {
      history.value = []
    }
  }
})

function saveToHistory(id: string, title: string) {
  // Remove if duplicate to move to top
  history.value = history.value.filter(item => item.id !== id)
  const now = new Date()
  const dateStr = now.toLocaleDateString()
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  history.value.unshift({
    id,
    title: title || `Video #${id}`,
    date: `${dateStr} alle ${timeStr}`
  })
  // Limit history length to 10 items
  if (history.value.length > 10) {
    history.value.pop()
  }
  localStorage.setItem('owd_youtube_history', JSON.stringify(history.value))
}

function clearHistory() {
  history.value = []
  localStorage.removeItem('owd_youtube_history')
}

async function fetchVideoTitle(id: string): Promise<string | null> {
  try {
    // If it looks like a playlist
    const url = id.startsWith('PL') || id.length > 18
      ? `https://www.youtube.com/playlist?list=${id}`
      : `https://www.youtube.com/watch?v=${id}`
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
    if (response.ok) {
      const data = await response.json()
      if (data && data.title) {
        return data.title
      }
    }
  } catch (e) {
    console.error('Failed to fetch YouTube title:', e)
  }
  return null
}

function playVideo(urlOrId: string, title?: string) {
  const id = getYouTubeId(urlOrId)
  if (id) {
    props.window.meta.videoId = id
    props.window.meta.autoplay = true
    // showPlayer updates automatically via computed
    saveToHistory(id, title || `YouTube Video (${id})`)

    if (!title) {
      fetchVideoTitle(id).then((fetchedTitle) => {
        if (fetchedTitle) {
          saveToHistory(id, fetchedTitle)
        }
      })
    }
  }
}

function handleInputSubmit() {
  const value = inputUrl.value.trim()
  if (!value) return
  if (isValidYouTubeUrl(value) || /^[a-zA-Z0-9_-]{11}$/.test(value) || /^(PL)?[a-zA-Z0-9_-]{18,34}$/.test(value)) {
    playVideo(value)
    inputUrl.value = ''
  } else {
    alert('Please enter a valid YouTube URL, video ID, or playlist ID.')
  }
}

function closeVideo() {
  props.window.meta.videoId = ''
  props.window.meta.autoplay = false
  // showPlayer updates automatically via computed
}
</script>

<template>
  <DesktopWindow v-bind="$props" :content="{ padded: false }">
    <template #nav-append>
      <DesktopWindowNavButton
        v-if="showPlayer"
        rounded
        title="Back to Dashboard"
        @click="closeVideo"
      >
        <Icon name="mdi:arrow-left" />
      </DesktopWindowNavButton>
    </template>

    <div class="youtube-app">
      <!-- Splash Loading Component -->
      <DesktopCoreSplash icon="simple-icons:youtube" title="YouTube Client" />

      <!-- Video Player View (persistent via v-show to keep iframe running in background) -->
      <div v-show="showPlayer && props.window.meta.videoId" class="youtube-player">
        <div class="youtube-player__frame-container">
          <iframe
            v-if="props.window.meta.videoId"
            width="100%"
            height="100%"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            :src="props.window.meta.videoId && props.window.meta.videoId.startsWith('PL') || (props.window.meta.videoId && props.window.meta.videoId.length > 18)
              ? `https://www.youtube.com/embed/videoseries?list=${props.window.meta.videoId}&autoplay=1`
              : `https://www.youtube.com/embed/${props.window.meta.videoId}?autoplay=1`"
          />
        </div>
      </div>

      <!-- Initial Dashboard View -->
      <div v-show="!showPlayer" class="youtube-dashboard">
        <div class="youtube-dashboard__hero">
          <Icon name="simple-icons:youtube" class="youtube-dashboard__logo" />
          <h2 class="youtube-dashboard__title">YouTube Player</h2>
          <p class="youtube-dashboard__subtitle">Play YouTube videos instantly</p>
        </div>

        <form class="youtube-dashboard__form" @submit.prevent="handleInputSubmit">
          <InputText
            v-model="inputUrl"
            placeholder="Paste YouTube Video URL or ID here..."
            autocomplete="off"
            spellcheck="false"
          />
          <Button type="submit">Play Video</Button>
        </form>

        <div class="youtube-dashboard__content">
          <!-- Favorites -->
          <div class="youtube-dashboard__section">
            <h4 class="youtube-dashboard__section-title">
              Featured Stations
            </h4>
            <div class="youtube-dashboard__list">
              <div
                v-for="fav in favorites"
                :key="fav.id"
                class="youtube-dashboard__card"
                @click="playVideo(fav.id, fav.title)"
              >
                <div class="youtube-dashboard__card-info">
                  <span class="youtube-dashboard__card-title">{{ fav.title }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- History -->
          <div class="youtube-dashboard__section">
            <div class="youtube-dashboard__section-header">
              <h4 class="youtube-dashboard__section-title">
                Recent Videos
              </h4>
              <a v-if="history.length > 0" class="youtube-dashboard__clear-btn" @click="clearHistory">Clear</a>
            </div>
            
            <div v-if="history.length === 0" class="youtube-dashboard__empty">
              No recently played videos
            </div>
            <div v-else class="youtube-dashboard__list">
              <div
                v-for="item in history"
                :key="item.id"
                class="youtube-dashboard__card"
                @click="playVideo(item.id, item.title)"
              >
                <div class="youtube-dashboard__card-info">
                  <span class="youtube-dashboard__card-title">{{ item.title }}</span>
                  <span class="youtube-dashboard__card-meta">Watched: {{ item.date }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DesktopWindow>
</template>

<style scoped lang="scss">
.youtube-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--paper-bg, #ececee);
  color: var(--paper-text, #2c2c30);
  font-family: var(--paper-font, sans-serif);
}

// Player Styles
.youtube-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  background: #000;

  &__frame-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 0;

    iframe {
      border: 0;
      aspect-ratio: 16 / 9;
      width: 100%;
      height: auto;
      max-width: 100%;
      max-height: 100%;
    }
  }
}

// Dashboard Styles
.youtube-dashboard {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;

  &__hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 8px;
  }

  &__logo {
    font-size: 48px;
    color: #ff0000;
    margin-bottom: 8px;
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
  }

  &__subtitle {
    font-size: 13px;
    color: var(--paper-text-secondary, #68686f);
    margin: 4px 0 0 0;
  }

  &__form {
    display: flex;
    gap: 8px;
    width: 100%;

    :deep(.p-inputtext) {
      flex: 1;
    }
  }

  &__content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__section-title {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--paper-text, #2c2c30);
  }

  &__clear-btn {
    font-size: 12px;
    color: var(--paper-accent, #3b6fd4);
    cursor: pointer;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &__empty {
    font-size: 13px;
    color: var(--paper-text-tertiary, #98989f);
    padding: 16px;
    text-align: center;
    border: 1px dashed var(--paper-border, #d1d1d6);
    border-radius: var(--paper-radius, 6px);
    background: var(--paper-surface, #f4f4f6);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--paper-surface, #f4f4f6);
    border: 1px solid var(--paper-border, #d1d1d6);
    border-radius: var(--paper-radius, 6px);
    cursor: pointer;
    transition: all 0.15s ease-in-out;

    &:hover {
      background: color-mix(in srgb, var(--paper-surface) 95%, var(--paper-text));
      border-color: color-mix(in srgb, var(--paper-border) 70%, var(--paper-text));
    }
  }

  &__card-icon {
    font-size: 20px;
    color: var(--paper-accent, #3b6fd4);
    display: flex;
    align-items: center;
  }

  &__card-info {
    display: flex;
    flex-direction: column;
    min-width: 0; // enables truncation
  }

  &__card-title {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__card-meta {
    font-size: 11px;
    color: var(--paper-text-tertiary, #98989f);
    margin-top: 2px;
  }
}
</style>
