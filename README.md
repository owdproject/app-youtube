<p align="center">
  <img width="160" height="160" src="https://avatars.githubusercontent.com/u/65117737?s=160&v=4" />
</p>
<h1 align="center">YouTube</h1>
<h3 align="center">
  YouTube App for Open Web Desktop.
</h3>

<br />

## Overview

This app for Open Web Desktop provides a YouTube and YouTube Music player with a rotating featured gallery on the dashboard.

[Demo](https://owdproject.github.io/app-youtube/) · [Documentation](https://owdproject.github.io/docs/) · [Support](https://github.com/sponsors/owdproject)

## Installation

```bash
pnpm desktop add @owdproject/app-youtube
```

## Usage

#### Available commands

```
youtube <youtube-url>
youtube <youtube-url> --new
youtube <youtube-url> --music
youtube <youtube-url> --autoplay
youtube <youtube-url> --no-check
```

## Configuration

Add the app to your `desktop.config.ts` and customize the featured gallery:

```ts
import { defineDesktopConfig } from '@owdproject/core'

export default defineDesktopConfig({
  apps: [
    '@owdproject/app-youtube'
  ],
  youtube: {
    galleryRotateIntervalMs: 8000,
    featuredStations: [
      { id: 'jfKfPfyJRdk', title: 'Lofi Girl' },
      { id: 'tNkZs5MStGQ', title: 'Ambient Nature Sounds' },
    ]
  }
})
```

Each featured station supports an optional `thumbnail` URL. Video IDs (11 characters) get a YouTube cover automatically. The dashboard shows a 2×2 gallery; every `galleryRotateIntervalMs` milliseconds one tile cycles to the next featured item. Click a tile to play.

## License

This application is released under the [MIT License](LICENSE).
