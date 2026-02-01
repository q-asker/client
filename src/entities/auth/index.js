import { configureAuth } from "#shared/api";
import { getAccessToken, useAuthStore } from "./store";

configureAuth({
  getAccessToken,
  clearAuth: () => useAuthStore.getState().clearAuth(),
});

export { useAuthStore, getAccessToken } from "./store";
export { authService } from "./service";
