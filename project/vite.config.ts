import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), // Alias for src folder
    },
  },
  build: {
    outDir: 'dist', // Ensure Vite outputs to "dist"
    emptyOutDir: true, // Clears the output directory before building
  },
  server: {
    host: true, // Ensures Vite runs properly in Railway/Heroku
    port: 3000, // You can change this if needed
    strictPort: true,
  },
  root: './', // Keep this if your `index.html` is in the root directory
});
