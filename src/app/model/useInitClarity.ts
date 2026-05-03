import { useEffect } from 'react';
import { initClarity } from '#shared/lib/clarity';

export const useInitClarity = (projectId: string | undefined): void => {
  useEffect(() => {
    if (!projectId) return;
    initClarity(projectId);
  }, [projectId]);
};
