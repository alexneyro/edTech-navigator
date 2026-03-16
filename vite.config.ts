import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Если у тебя в проекте используется Tailwind 4, раскомментируй строку ниже и добавь tailwindcss() в plugins
// import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Указываем базовый путь для GitHub Pages
  base: './', 
  plugins: [
    react()
    // tailwindcss() // Раскомментируй, если билд потребует Tailwind
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