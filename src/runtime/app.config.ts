import {
  getYouTubeId,
  isValidYouTubeUrl,
  isYouTubeMusicUrl,
} from './utils/utilYoutube'

export default {
  id: 'org.owdproject.youtube',
  title: 'YouTube',
  singleton: true,
  icon: 'simple-icons:youtube',
  featuredStations: [
    { id: 'jfKfPfyJRdk', title: 'Lofi Girl - Lofi Hip Hop Radio' },
    { id: '5qap5aO4i9A', title: 'Lofi Hip Hop Radio - Beats to Study/Relax' },
    { id: 'tNkZs5MStGQ', title: 'Ambient Nature Sounds for Study' }
  ],
  windows: {
    main: {
      component: () => import('./components/Window/WindowYoutube.vue'),
      resizable: true,
      size: {
        width: 640,
        height: 'auto',
        minWidth: 400,
        minHeight: 320,
        maxHeight: 600,
      },
      position: {
        x: 350,
        y: 180,
        z: 0,
      },
    },
    music: {
      component: () => import('./components/Window/WindowYoutubeMusic.vue'),
      title: 'YouTube Music',
      resizable: false,
      size: {
        width: 'auto',
        height: 'auto',
      },
      position: {
        x: 400,
        y: 240,
        z: 0,
      },
    },
  },
  entries: {
    youtube: {
      command: 'youtube --new --no-check',
    },
  },
  terminal: {
    youtube: {
      description: 'YouTube player',
      usage: 'youtube [url] [--new] [--music] [--autoplay]',
      args: [
        {
          name: 'url',
          description: 'YouTube URL or video ID',
          required: false,
        },
      ],
      options: [
        {
          flag: '--new',
          description: 'Force open a new window',
        },
        {
          flag: '--music',
          description: 'Open in YouTube Music mode',
        },
        {
          flag: '--autoplay',
          description: 'Autoplay the video',
        },
      ],
    },
  },
  commands: {
    youtube: (app: IApplicationController, args: any) => {
      const url = args?._[1] || ''
      const doNotCheckUrlValidity = args.noCheck
      const forceNewWindow = args.new
      const forceMusic = args.music
      const autoplay = args.autoplay

      // validate input: must be a valid youtube url or a direct video id
      if (
        url &&
        !doNotCheckUrlValidity &&
        !isValidYouTubeUrl(url) &&
        !/^[a-zA-Z0-9_-]{11}$/.test(url)
      ) {
        return {
          message: 'YouTube URL or ID is not valid',
        }
      }

      const videoId = getYouTubeId(url)
      const isMusicUrl = isYouTubeMusicUrl(url)
      const windowType = forceMusic || isMusicUrl ? 'music' : 'main'

      // if --new is not passed, try to reuse an existing window of the same type
      const existingWindow = !forceNewWindow
        ? app.getFirstWindowByModel(windowType)
        : null

      if (existingWindow) {
        // update metadata of existing window
        existingWindow.meta.videoId = videoId
        existingWindow.meta.autoplay = autoplay

        existingWindow.unminimize()
        existingWindow.focus()
        return
      }

      // open a new window if no reusable one exists or --new was passed
      app.openWindow(windowType, undefined, {
        videoId,
        autoplay,
      })
    },
  },
}
