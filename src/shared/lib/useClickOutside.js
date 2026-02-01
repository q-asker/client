import { useEffect } from "react";

export const useClickOutside = ({
  containerId,
  triggerId,
  onOutsideClick,
  isEnabled = true,
}) => {
  useEffect(() => {
    if (!isEnabled) return;

    const handler = (e) => {
      const container = document.getElementById(containerId);
      const trigger = triggerId ? document.getElementById(triggerId) : null;
      if (
        container &&
        !container.contains(e.target) &&
        (!trigger || !trigger.contains(e.target))
      ) {
        onOutsideClick?.(e);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [containerId, triggerId, onOutsideClick, isEnabled]);
};
