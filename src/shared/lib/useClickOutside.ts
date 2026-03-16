import { useEffect } from 'react';

interface UseClickOutsideParams {
  containerId: string;
  triggerId?: string;
  onOutsideClick?: (e: MouseEvent) => void;
  isEnabled?: boolean;
}

export const useClickOutside = ({
  containerId,
  triggerId,
  onOutsideClick,
  isEnabled = true,
}: UseClickOutsideParams): void => {
  useEffect(() => {
    if (!isEnabled) return;

    const handler = (e: MouseEvent): void => {
      const container = document.getElementById(containerId);
      const trigger = triggerId ? document.getElementById(triggerId) : null;
      if (
        container &&
        !container.contains(e.target as Node) &&
        (!trigger || !trigger.contains(e.target as Node))
      ) {
        onOutsideClick?.(e);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [containerId, triggerId, onOutsideClick, isEnabled]);
};
