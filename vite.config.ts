import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Configuração para desenvolvimento
  server: {
    port: 3000,
    host: true,
    open: true,
  },

  // Configuração de build
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          vendor: ['@types/node'],
        },
      },
    },
  },

  // Configuração de paths
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/components': resolve(__dirname, 'src/components'),
    },
  },

  // Configuração de CSS
  css: {
    devSourcemap: true,
  },

  // Configuração para trabalhar com assets
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],

  // Configuração específica para o projeto CFTV
  define: {
    __DEV__: JSON.stringify(true),
    __VERSION__: JSON.stringify('1.0.0'),
  },

  // Otimizações
  optimizeDeps: {
    include: [],
  },
});