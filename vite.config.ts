import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import path from "path"

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'), // Include popup.html or index.html for the default popup
        background: resolve(__dirname, 'src/background/background.ts'), // Background script
      },
      output: {
        entryFileNames: '[name].js', // Ensures consistent file names
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
