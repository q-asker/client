import { useEffect } from 'react';
import { initGA } from '#shared/lib/analytics';

export const useInitGA = (measurementId: string | undefined): void => {
  useEffect(() => {
    if (!measurementId) return;
    initGA(measurementId);
  }, [measurementId]);
};
