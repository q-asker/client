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
          // 대형 라이브러리를 별도 청크로 분리 (초기 로드 최적화)
          // vite 8(rolldown)은 manualChunks 객체 형식을 거부 → 함수 형식 사용
          manualChunks: (id) => {
            if (id.includes('node_modules/react-pdf') || id.includes('node_modules/pdfjs-dist'))
              return 'pdf-viewer';
            if (id.includes('node_modules/framer-motion')) return 'framer-motion';
            if (
              /node_modules\/react\//.test(id) ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router')
            )
              return 'react-vendor';
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
