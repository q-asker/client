import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '#entities/auth';
import { restoreThemeBeforeMount } from '#shared/themes';
import './globals.css';
import App from './App';

// React 마운트 전 저장된 테마 CSS 변수 즉시 적용 (플래싱 방지)
restoreThemeBeforeMount();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
