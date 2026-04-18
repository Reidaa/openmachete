import { defineManifest } from '@crxjs/vite-plugin';
import packageJson from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: 'OpenMachete',
  description: 'Hide Welcome to the Jungle job cards for companies you do not want to see.',
  version: packageJson.version,
  permissions: ['storage'],
  host_permissions: ['https://www.welcometothejungle.com/*'],
  action: {
    default_title: 'OpenMachete filters',
    default_popup: 'src/popup/index.html',
  },
  content_scripts: [
    {
      matches: ['https://www.welcometothejungle.com/fr/jobs*'],
      js: ['src/content/main.ts'],
      run_at: 'document_idle',
    },
  ],
});
