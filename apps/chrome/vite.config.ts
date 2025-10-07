import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';

const CHROME_SCRIPT_NAMES = new Set(['content-script', 'background']);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'content-script': resolve(__dirname, 'src/scripts/content-script.ts'),
        background: resolve(__dirname, 'src/scripts/background.ts'),
      },
      output: {
        dir: 'dist',
        entryFileNames: (chunkInfo) => {
          if (CHROME_SCRIPT_NAMES.has(chunkInfo.name)) {
            return `scripts/${chunkInfo.name}.js`;
          }

          return '[name]-[hash].js';
        },
      },
    },
  },
});
