import { ref, watch, onMounted, onUnmounted, unref, type Ref } from 'vue'

export interface GalleryTile<T = unknown> {
  key: string
  item: T
  thumbnail?: string
}

export function useRotatingGallery<T>(
  pool: Ref<T[]>,
  {
    slotCount = 4,
    intervalMs = 8000,
    getKey,
    getThumbnail,
  }: {
    slotCount?: number
    intervalMs?: Ref<number> | number
    getKey: (item: T) => string
    getThumbnail?: (item: T) => string | undefined
  },
) {
  const slots = ref<GalleryTile<T>[]>([])
  let nextSlotIndex = 0
  let rotationCounter = 0

  function tileFromItem(item: T): GalleryTile<T> {
    rotationCounter++
    return {
      key: `${getKey(item)}@${rotationCounter}`,
      item,
      thumbnail: getThumbnail?.(item),
    }
  }

  function pickUniqueItems(count: number): T[] {
    const items = pool.value
    const picked: T[] = []
    const used = new Set<string>()

    for (const item of items) {
      if (picked.length >= count) break
      const key = getKey(item)
      if (!used.has(key)) {
        used.add(key)
        picked.push(item)
      }
    }

    while (picked.length < count && items.length) {
      picked.push(items[picked.length % items.length])
    }

    return picked
  }

  function pickNextForSlot(slotIdx: number): GalleryTile<T> {
    const items = pool.value
    const currentKey = getKey(slots.value[slotIdx].item)
    const visibleKeys = new Set(
      slots.value
        .filter((_, i) => i !== slotIdx)
        .map(slot => getKey(slot.item)),
    )

    const unseen = items.filter(item => !visibleKeys.has(getKey(item)))
    const candidates = unseen.length
      ? unseen
      : items.filter(item => getKey(item) !== currentKey)

    const nextItem = candidates[Math.floor(Math.random() * candidates.length)] ?? items[0]
    return tileFromItem(nextItem)
  }

  function initSlots() {
    const items = pool.value
    if (!items.length) {
      slots.value = []
      return
    }

    rotationCounter = 0
    slots.value = pickUniqueItems(slotCount).map(item => tileFromItem(item))
    nextSlotIndex = 0
  }

  watch(pool, initSlots, { deep: true, immediate: true })

  onMounted(() => {
    const ms = unref(intervalMs) ?? 8000
    const timer = setInterval(() => {
      if (pool.value.length < 2) return

      const slotIdx = nextSlotIndex % slotCount
      slots.value[slotIdx] = pickNextForSlot(slotIdx)
      nextSlotIndex++
    }, ms)

    onUnmounted(() => clearInterval(timer))
  })

  return { slots }
}
