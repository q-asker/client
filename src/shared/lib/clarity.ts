interface ClarityFn {
  (...args: unknown[]): void;
  q?: unknown[][];
}

declare global {
  interface Window {
    clarity?: ClarityFn;
  }
}

export const initClarity = (projectId: string): void => {
  if (!projectId || typeof window === 'undefined' || window.clarity) return;

  const clarity: ClarityFn = function (...args: unknown[]) {
    (clarity.q = clarity.q || []).push(args);
  };
  window.clarity = clarity;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${projectId}`;
  const first = document.getElementsByTagName('script')[0];
  first?.parentNode?.insertBefore(script, first);
};
