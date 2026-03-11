const STORAGE_KEY: string = 'lastEndpoint';

export const readLastEndpoint = (): string => localStorage.getItem(STORAGE_KEY) || '/';

export const writeLastEndpoint = (value: string): string => {
  localStorage.setItem(STORAGE_KEY, value);
  return value;
};

export const normalizeLastEndpoint = (value: string): string => {
  if (!value || value === '/login/redirect' || value.startsWith('/login')) {
    return '/';
  }
  return value;
};
