import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '#entities/auth';
import './globals.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
