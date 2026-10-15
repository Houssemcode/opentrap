import { defineConfig } from 'wxt';

export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'OpenTrap for YouTube',
    description: 'Privacy-first, local-only YouTube distraction blocker. Surgically hide distracting elements, sanitize thumbnails, and redirect URLs.',
    version: '1.0.0',
    // === [ADD START: Inside manifest configuration in wxt.config.ts] ===
    permissions: ['storage', 'alarms'],
    // === [ADD END] ===
    icons: {
      '16': 'icon/16.png',
      '32': 'icon/32.png',
      '48': 'icon/48.png',
      '96': 'icon/96.png',
      '128': 'icon/128.png',
    },
  },
});
