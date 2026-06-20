export function formatWatchedAt(watchedAt: number): string {
  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(watchedAt))

  return formatted.replace(',', ' at')
}

export function normalizeLegacyDate(date?: string): number | undefined {
  if (!date) return undefined
  const parsed = Date.parse(date.replace(' alle ', ' '))
  return Number.isNaN(parsed) ? undefined : parsed
}
