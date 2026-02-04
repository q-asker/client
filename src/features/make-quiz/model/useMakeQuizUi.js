import { useCallback, useState } from 'react';
import { useClickOutside } from '#shared/lib/useClickOutside';

export const useMakeQuizUi = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  useClickOutside({
    containerId: 'sidebar',
    triggerId: 'menuButton',
    onOutsideClick: () => setIsSidebarOpen(false),
  });

  return {
    state: {
      isSidebarOpen,
      showHelp,
    },
    actions: {
      toggleSidebar,
      setIsSidebarOpen,
      setShowHelp,
    },
  };
};
