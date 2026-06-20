<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { getYouTubeId, getYoutubeThumbnail, isValidYouTubeUrl } from '../../utils/utilYoutube'
import { formatWatchedAt, normalizeLegacyDate } from '../../utils/utilFormat'
import { useRotatingGallery } from '../../composables/useRotatingGallery'
import FeaturedGallery from '../FeaturedGallery/FeaturedGallery.vue'

import { useRuntimeConfig } from '#imports'

interface HistoryItem {
  id: string
  title: string
  watchedAt: number
}

interface FeaturedItem {
  id: string
  title: string
  thumbnail?: string
}

const props = defineProps<{
  window: IWindowController
}>()

const runtimeConfig = useRuntimeConfig()
const youtubeConfig = computed(
  () => runtimeConfig.public.desktop?.youtube || {},
)
const inputUrl = ref('')
const inputError = ref('')
const history = ref<HistoryItem[]>([])

watch(inputUrl, () => {
  if (inputError.value) {
    inputError.value = ''
  }
})

const featuredPool = computed(() => youtubeConfig.value.featuredStations ?? [])
const rotateIntervalMs = computed(() => youtubeConfig.value.galleryRotateIntervalMs ?? 8000)

const { slots: gallerySlots } = useRotatingGallery(featuredPool, {
  intervalMs: rotateIntervalMs,
  getKey: item => item.id,
  getThumbnail: item => item.thumbnail || getYoutubeThumbnail(item.id),
})

const galleryTiles = computed(() =>
  gallerySlots.value.map(slot => ({
    key: slot.key,
    title: slot.item.title,
    thumbnail: slot.thumbnail,
  })),
)

const showPlayer = computed(() => !!(props.window.meta.videoId))

onMounted(() => {
  const stored = localStorage.getItem('owd_youtube_history')
  if (!stored) return

  try {
    const parsed = JSON.parse(stored) as Array<HistoryItem & { date?: string }>
    history.value = parsed.map((item) => ({
      id: item.id,
      title: item.title,
      watchedAt: item.watchedAt ?? normalizeLegacyDate(item.date) ?? Date.now(),
    }))
  } catch {
    history.value = []
  }
})

function persistHistory() {
  localStorage.setItem('owd_youtube_history', JSON.stringify(history.value))
}

function saveToHistory(id: string, title: string) {
  history.value = history.value.filter(item => item.id !== id)
  history.value.unshift({
    id,
    title: title || `Video #${id}`,
    watchedAt: Date.now(),
  })
  if (history.value.length > 12) {
    history.value.pop()
  }
  persistHistory()
}

function clearHistory() {
  history.value = []
  localStorage.removeItem('owd_youtube_history')
}

async function fetchVideoTitle(id: string): Promise<string | null> {
  try {
    const url = id.startsWith('PL') || id.length > 18
      ? `https://www.youtube.com/playlist?list=${id}`
      : `https://www.youtube.com/watch?v=${id}`
    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`)
    if (response.ok) {
      const data = await response.json()
      if (data?.title) {
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

function playGalleryTile(index: number) {
  const slot = gallerySlots.value[index]
  if (slot) {
    playVideo(slot.item.id, slot.item.title)
  }
}

function playFeatured(item: FeaturedItem) {
  playVideo(item.id, item.title)
}

function handleInputSubmit() {
  const value = inputUrl.value.trim()
  if (!value) return
  if (isValidYouTubeUrl(value) || /^[a-zA-Z0-9_-]{11}$/.test(value) || /^(PL)?[a-zA-Z0-9_-]{18,34}$/.test(value)) {
    inputError.value = ''
    playVideo(value)
    inputUrl.value = ''
  } else {
    inputError.value = 'Enter a valid YouTube URL, video ID, or playlist ID.'
  }
}

function closeVideo() {
  props.window.meta.videoId = ''
  props.window.meta.autoplay = false
}

function thumbFor(id: string, custom?: string) {
  return custom || getYoutubeThumbnail(id)
}
</script>

<template>
  <DesktopWindow v-bind="$props" :content="{ padded: false }">
    <template #nav-append>
      <DesktopWindowNavButton
        v-if="showPlayer"
        rounded
        title="Back to home"
        @click="closeVideo"
      >
        <Icon name="mdi:arrow-left" />
      </DesktopWindowNavButton>
    </template>

    <div class="youtube-app">
      <DesktopCoreSplash icon="simple-icons:youtube" title="YouTube Client" />

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

      <div v-show="!showPlayer" class="youtube-home">
        <header class="youtube-home__toolbar">
          <div class="youtube-home__brand">
            <span class="youtube-home__mark" aria-hidden="true" />
            <span class="youtube-home__wordmark">YouTube</span>
          </div>

          <div class="youtube-home__search-field">
            <form class="youtube-home__search" @submit.prevent="handleInputSubmit">
              <InputText
                v-model="inputUrl"
                placeholder="Search or paste a URL..."
                autocomplete="off"
                spellcheck="false"
                :invalid="!!inputError"
                aria-describedby="youtube-search-error"
              />
              <Button type="submit" severity="danger" aria-label="Search" class="youtube-home__play-btn">
                <Icon name="mdi:magnify" size="22" />
              </Button>
            </form>

            <Transition name="youtube-search-error">
              <Message
                v-if="inputError"
                id="youtube-search-error"
                severity="error"
                variant="simple"
                size="small"
                closable
                class="youtube-home__search-error"
                role="alert"
                @close="inputError = ''"
              >
                {{ inputError }}
              </Message>
            </Transition>
          </div>
        </header>

        <div class="youtube-home__body">
          <aside class="youtube-home__featured">
            <h3 class="youtube-home__heading">
              <Icon name="mdi:television-play" />
              Featured
            </h3>
            <FeaturedGallery
              v-if="galleryTiles.length"
              fill
              :tiles="galleryTiles"
              brand-icon="simple-icons:youtube"
              @play="playGalleryTile"
            />
          </aside>

          <main class="youtube-home__feed">
            <div class="youtube-home__feed-header">
              <h3 class="youtube-home__heading">
                <Icon :name="history.length ? 'mdi:history' : 'mdi:compass-outline'" />
                {{ history.length ? 'Watch history' : 'Recommended for you' }}
              </h3>
              <button
                v-if="history.length"
                type="button"
                class="youtube-home__clear"
                @click="clearHistory"
              >
                Clear all
              </button>
            </div>

            <div v-if="history.length" class="youtube-home__list">
              <article
                v-for="item in history"
                :key="item.id"
                class="video-row"
                @click="playVideo(item.id, item.title)"
              >
                <div class="video-row__thumb">
                  <img
                    v-if="thumbFor(item.id)"
                    :src="thumbFor(item.id)"
                    :alt="item.title"
                    loading="lazy"
                  >
                  <div v-else class="video-row__thumb-fallback">
                    <Icon name="simple-icons:youtube" />
                  </div>
                  <Icon name="mdi:play-circle" class="video-row__play" />
                </div>
                <div class="video-row__info">
                  <h4 class="video-row__title">{{ item.title }}</h4>
                  <p class="video-row__meta">Watched {{ formatWatchedAt(item.watchedAt) }}</p>
                </div>
              </article>
            </div>

            <div v-else class="youtube-home__list">
              <article
                v-for="item in featuredPool"
                :key="item.id"
                class="video-row"
                @click="playFeatured(item)"
              >
                <div class="video-row__thumb">
                  <img
                    v-if="thumbFor(item.id, item.thumbnail)"
                    :src="thumbFor(item.id, item.thumbnail)"
                    :alt="item.title"
                    loading="lazy"
                  >
                  <div v-else class="video-row__thumb-fallback">
                    <Icon name="simple-icons:youtube" />
                  </div>
                  <Icon name="mdi:play-circle" class="video-row__play" />
                </div>
                <div class="video-row__info">
                  <h4 class="video-row__title">{{ item.title }}</h4>
                  <p class="video-row__meta">Featured stream</p>
                </div>
              </article>
            </div>
          </main>
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
  color: inherit;
  background: transparent;
}

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

.youtube-home {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &__toolbar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }

  &__mark {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 21px;
    border-radius: 7px;
    background: #ff0000;
    flex-shrink: 0;

    &::after {
      content: '';
      display: block;
      width: 0;
      height: 0;
      margin-left: 2px;
      border-style: solid;
      border-width: 4px 0 4px 7px;
      border-color: transparent transparent transparent #fff;
    }
  }

  &__wordmark {
    font-family: 'Roboto Condensed', 'Roboto', sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 1;
  }

  &__search-field {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__search {
    flex: 1;
    display: flex;
    gap: 8px;
    min-width: 0;

    :deep(.p-inputtext) {
      flex: 1;
      border-radius: 999px;
      padding-left: 16px;
    }

    :deep(.youtube-home__play-btn) {
      border-radius: 999px;
      width: 32px;
      min-width: 32px;
      height: 32px;
      padding: 0;
      flex-shrink: 0;
    }
  }

  &__search-error {
    margin: 0;
    width: 100%;

    :deep(.p-message) {
      margin: 0;
      width: 100%;
    }

    :deep(.p-message-text) {
      font-size: 12px;
      line-height: 1.35;
    }
  }

  &__body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 0;
  }

  &__featured {
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 14px 12px 14px 16px;
  }

  &__feed {
    min-height: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 14px 16px 14px 12px;
    overflow: hidden;
  }

  &__feed-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  &__heading {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.01em;

    .youtube-home__feed-header & {
      margin-bottom: 0;
    }
  }

  &__clear {
    padding: 0;
    border: 0;
    background: none;
    font-size: 12px;
    color: inherit;
    opacity: 0.55;
    cursor: pointer;

    &:hover {
      opacity: 0.9;
      text-decoration: underline;
    }
  }

  &__list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-right: 2px;
  }
}

.youtube-search-error-enter-active,
.youtube-search-error-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.youtube-search-error-enter-from,
.youtube-search-error-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.video-row {
  display: flex;
  gap: 12px;
  padding: 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: color-mix(in srgb, currentColor 7%, transparent);

    .video-row__play {
      opacity: 1;
    }
  }

  &__thumb {
    position: relative;
    flex-shrink: 0;
    width: 128px;
    aspect-ratio: 16 / 9;
    border-radius: 8px;
    overflow: hidden;
    background: color-mix(in srgb, currentColor 10%, transparent);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  &__thumb-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: 28px;
    opacity: 0.35;
  }

  &__play {
    position: absolute;
    inset: 0;
    margin: auto;
    width: 28px;
    height: 28px;
    font-size: 28px;
    color: #fff;
    opacity: 0;
    filter: drop-shadow(0 2px 6px rgb(0 0 0 / 55%));
    transition: opacity 0.15s ease;
    pointer-events: none;
  }

  &__info {
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
  }

  &__title {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__meta {
    margin: 0;
    font-size: 11px;
    opacity: 0.5;
  }
}
</style>
