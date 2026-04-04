import { configureAuth } from '#shared/api';
import { getAccessToken, useAuthStore } from './store';
import { authService } from './service';

configureAuth({
  getAccessToken,
  clearAuth: () => useAuthStore.getState().clearAuth(),
  refreshAuthToken: async () => {
    await authService.refresh();
  },
});

export { useAuthStore, getAccessToken } from './store';
export { authService } from './service';
export type { User, AuthState, AuthResponse } from './types';
