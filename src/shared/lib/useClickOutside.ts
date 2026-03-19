import { useEffect } from 'react';

interface UseClickOutsideParams {
  containerId: string | string[];
  triggerId?: string | string[];
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

    const containerIds = Array.isArray(containerId) ? containerId : [containerId];
    const triggerIds = Array.isArray(triggerId) ? triggerId : triggerId ? [triggerId] : [];

    const handler = (e: MouseEvent): void => {
      const target = e.target as Node;

      // 트리거 요소 클릭 시 무시
      for (const id of triggerIds) {
        const trigger = document.getElementById(id);
        if (trigger?.contains(target)) return;
      }

      // 컨테이너 내부 클릭 시 무시
      for (const id of containerIds) {
        const container = document.getElementById(id);
        if (container?.contains(target)) return;
      }

      // 컨테이너가 하나도 존재하지 않으면 무시
      const anyContainerExists = containerIds.some((id) => document.getElementById(id));
      if (!anyContainerExists) return;

      onOutsideClick?.(e);
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [containerId, triggerId, onOutsideClick, isEnabled]);
};
