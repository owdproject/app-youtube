<p align="center">
  <img width="160" height="160" src="https://avatars.githubusercontent.com/u/65117737?s=160&v=4" />
</p>
<h1 align="center">YouTube</h1>
<h3 align="center">
  YouTube App for Open Web Desktop.
</h3>

<br />

## Overview

This app for Open Web Desktop provides a YouTube and YouTube Music player.

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

You can customize the list of featured stations displayed on the initial dashboard inside your desktop configuration (`desktop.config.ts`):

```ts
import { defineDesktopConfig } from '@owdproject/core'

export default defineDesktopConfig({
  // ...
  'org.owdproject.youtube': {
    featuredStations: [
      { id: 'jfKfPfyJRdk', title: 'Lofi Girl - Lofi Hip Hop Radio' },
      { id: '5qap5aO4i9A', title: 'Lofi Hip Hop Radio - Beats to Study/Relax' }
    ]
  }
})
```

## License

The application is released under the [MIT License](LICENSE).
