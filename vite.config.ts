// vite.config.ts
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import process from 'process';
import { createRequire } from 'module';
import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const require = createRequire(import.meta.url);
export default defineConfig(({ command }) => {
  const proxyTarget = loadEnv('prod', process.cwd(), '').VITE_BASE_URL;

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // 대형 라이브러리를 별도 청크로 분리 (초기 로드 최적화)
            'pdf-viewer': ['react-pdf', 'pdfjs-dist'],
            'framer-motion': ['framer-motion'],
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      allowedHosts: true,
      proxy: {
        '/files': {
          target: 'https://files.q-asker.com',
          changeOrigin: true,
        },
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
            });
          },
        },
      },
    },
  };
});
