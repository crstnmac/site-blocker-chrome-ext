import {defineConfig} from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Deepwork Pro',
    description: 'A productivity extension for deep work and focused sessions',
    version: '1.0.0',
    permissions: [
      'storage',
      'tabs',
      'webNavigation',
      'declarativeNetRequest',
      'declarativeNetRequestFeedback',
    ],
    host_permissions: ['<all_urls>'],
  },
})
