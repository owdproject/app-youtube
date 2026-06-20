export function isValidYouTubeUrl(url: string) {
  const regex =
    /^(https?:\/\/)?(www\.)?(m\.)?(music\.)?youtube\.com\/(watch\?v=|playlist\?list=|embed\/|shorts\/)?([a-zA-Z0-9_-]+)(&.*)?$|^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)$/
  return regex.test(url)
}

export function isYouTubeMusicUrl(url: string) {
  // detect "music.youtube.com"
  return /^https?:\/\/(www\.)?(m\.)?music\.youtube\.com\//.test(url)
}

export function getYouTubeId(urlOrId: string) {
  // Check if it matches a query parameter first, especially list= for playlists
  const playlistMatch = urlOrId.match(/[?&]list=([a-zA-Z0-9_-]+)/)
  if (playlistMatch && playlistMatch[1]) {
    return playlistMatch[1]
  }

  // if it's already a valid video ID (11 characters) or playlist ID (usually starts with PL, 18-34 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId) || /^(PL)?[a-zA-Z0-9_-]{18,34}$/.test(urlOrId)) {
    return urlOrId
  }

  // try matching standard YouTube URLs
  let match = urlOrId.match(
    /^(https?:\/\/)?(www\.)?(m\.)?(music\.)?youtube\.com\/(watch\?v=|playlist\?list=|embed\/|shorts\/)?([a-zA-Z0-9_-]+)(&.*)?$/,
  )
  if (match && match[6]) {
    return match[6]
  }

  // try shortened URL format
  match = urlOrId.match(/^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)$/)
  if (match && match[1]) {
    return match[1]
  }

  return null
}

export function getYoutubeThumbnail(id: string): string | undefined {
  if (/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
  }
  return undefined
}
