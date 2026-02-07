import { useEffect } from 'react';
import { initGA } from '#shared/lib/analytics';

export const useInitGA = (measurementId) => {
  useEffect(() => {
    if (!measurementId) return;
    initGA(measurementId);
  }, [measurementId]);
};
