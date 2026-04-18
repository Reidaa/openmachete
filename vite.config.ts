import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import zipPack from 'vite-plugin-zip-pack';
import manifest from './manifest.config';

export default defineConfig({
  plugins: [
    crx({ manifest }),
    zipPack({
      outDir: 'release',
      outFileName: 'openmachete.zip',
    }),
  ],
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});
