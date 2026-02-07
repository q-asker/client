const STORAGE_KEY = 'lastEndpoint';

export const readLastEndpoint = () => localStorage.getItem(STORAGE_KEY) || '/';

export const writeLastEndpoint = (value) => {
  localStorage.setItem(STORAGE_KEY, value);
  return value;
};

export const normalizeLastEndpoint = (value) => {
  if (!value || value === '/login/redirect' || value.startsWith('/login')) {
    return '/';
  }
  return value;
};
