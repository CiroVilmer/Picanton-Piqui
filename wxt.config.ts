import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'Piqui',
    description: 'Tu mascota de Chrome con onda',
    permissions: [
      'tabs',
      'tabGroups',
      'storage',
      'sidePanel',
      'sessions',
      'scripting',
      'downloads',
    ],
    host_permissions: ['<all_urls>'],
    side_panel: { default_path: 'sidepanel.html' },
    action: { default_title: 'Abrir Piqui' },
  },
});
