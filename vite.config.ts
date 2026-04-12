/// <reference types="vitest" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      nodePolyfills({
        include: ['buffer', 'process', 'util', 'stream', 'vm'],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'lcov', 'html'],
        exclude: [
          'node_modules/**',
          'dist/**',
          'src/vite-env.d.ts',
          'src/main.tsx',
          'src/types/supabase.ts',
          'e2e/**',
          '*.config.*',
        ],
      },
    },
  };
});
