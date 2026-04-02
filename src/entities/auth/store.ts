import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AuthState } from './types';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hasHydrated: false,
      setAuth: ({ accessToken, user }) =>
        set({
          accessToken: accessToken ?? null,
          user: user ?? null,
        }),
      clearAuth: () => set({ accessToken: null, user: null }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);

// 클라이언트에서만 hydration 완료를 감지
if (typeof window !== 'undefined') {
  const unsub = useAuthStore.persist.onFinishHydration(() => {
    useAuthStore.getState().setHasHydrated(true);
    unsub();
  });
  // 이미 hydration이 끝난 경우 (동기적 복원)
  if (useAuthStore.persist.hasHydrated()) {
    useAuthStore.getState().setHasHydrated(true);
  }
}

export const getAccessToken = (): string | null => useAuthStore.getState().accessToken;
