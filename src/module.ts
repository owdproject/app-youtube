import {
  defineNuxtModule,
  createResolver,
  addComponentsDir,
  addPlugin,
  installModule,
} from '@nuxt/kit'
import { registerTailwindPath } from '@owdproject/kit-tailwind/kit/registerTailwindPath'

export default defineNuxtModule({
  meta: {
    name: 'desktop-app-youtube',
    configKey: 'youtube',
  },
  defaults: {
    galleryRotateIntervalMs: 8000,
    featuredStations: [
      { id: 'jEOnbNzYbIM', title: '__error.gif' },
      { id: 'oZ71RokWFNs', title: 'Eroi di un Sogno™ (ビデオ)' },
      { id: 'bXT5kC7-mpE', title: 'M Ø N S T E R 「お化け」' },
      { id: 'oktcFBPLlv8', title: 'Horizon Highway' },
      { id: 'BgQXB-K-JE8', title: 'Beats to get LOST in Space' },
    ],
  },
  async setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    await installModule('@nuxt/fonts', {
      families: [
        {
          name: 'Roboto Condensed',
          provider: 'google',
          weights: [600, 700],
        },
      ],
    })

    nuxt.options.runtimeConfig.public.desktop ??= {}
    nuxt.options.runtimeConfig.public.desktop.youtube = options

    addComponentsDir({
      path: resolve('./runtime/components'),
    })

    addPlugin(resolve('./runtime/plugin'))

    registerTailwindPath(
      nuxt,
      resolve('./runtime/components/**/*.{vue,mjs,ts}'),
    )
  },
})
