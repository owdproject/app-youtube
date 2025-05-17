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
  windows: {
    main: {
      component: () => import('./components/Window/WindowYoutube.vue'),
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
  commands: {
    youtube: (app: IApplicationController, args: any) => {
      const lastArg = args?.[args.length - 1] || ''
      const doNotCheckUrlValidity = args?.includes('--no-check')
      const forceNewWindow = args?.includes('--new')
      const forceMusic = args?.includes('--music')
      const youtubeAutoplay = args?.includes('--autoplay')

      // validate input: must be a valid youtube url or a direct video id
      if (
        !doNotCheckUrlValidity &&
        !isValidYouTubeUrl(lastArg) &&
        !/^[a-zA-Z0-9_-]{11}$/.test(lastArg)
      ) {
        return {
          message: 'YouTube URL or ID is not valid',
        }
      }

      const videoId = getYouTubeId(lastArg)
      const isMusicUrl = isYouTubeMusicUrl(lastArg)
      const windowType = forceMusic || isMusicUrl ? 'music' : 'main'

      // if --new is not passed, try to reuse an existing window of the same type
      const existingWindow = !forceNewWindow
        ? app.getFirstWindowByModel(windowType)
        : null

      if (existingWindow) {
        // update metadata of existing window
        existingWindow.meta.videoId = videoId
        existingWindow.meta.autoplay = youtubeAutoplay

        existingWindow.unminimize()
        existingWindow.focus()
        return
      }

      // open a new window if no reusable one exists or --new was passed
      app.openWindow(windowType, undefined, {
        videoId,
        autoplay: youtubeAutoplay,
      })
    },
  },
}
