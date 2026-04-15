import type { StateStorage } from 'zustand/middleware';

const DEFAULT_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/** 24시간 TTL이 적용된 Zustand persist용 StateStorage */
export const createExpiringStorage = (
  expirationMs: number = DEFAULT_EXPIRATION_MS,
): StateStorage => ({
  getItem: (name: string): string | null => {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { savedAt?: number; value?: string };
      const savedAt = Number(parsed?.savedAt);
      if (!savedAt || Date.now() - savedAt > expirationMs) {
        localStorage.removeItem(name);
        return null;
      }
      return (parsed?.value as string) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    localStorage.setItem(
      name,
      JSON.stringify({
        value,
        savedAt: Date.now(),
      }),
    );
  },
  removeItem: (name: string): void => {
    localStorage.removeItem(name);
  },
});
