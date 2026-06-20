import { defineNuxtPlugin } from 'nuxt/app'

export default defineNuxtPlugin({
  name: 'app-youtube-playground-launch',
  dependsOn: ['desktop-app-youtube-register'],
  setup(nuxtApp) {
    autoStartPlaygroundApps(nuxtApp, [
      {
        id: 'org.owdproject.youtube',
        entry: 'youtube --new --no-check',
        windowModel: 'main',
      },
    ])
  },
})
