import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';


import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Указываем базовый путь для GitHub Pages
  base: './', 
  plugins: [
    react()
    tailwindcss()
  ],
  resolve: {
    alias: {
      // Настройка @ для путей (чтобы не падали импорты)
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
  }
});