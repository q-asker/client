import { useCallback, useState } from 'react';
import { useClickOutside } from '#shared/lib/useClickOutside';

export interface PrepareQuizUiState {
  isSidebarOpen: boolean;
  showHelp: boolean;
}

export interface PrepareQuizUiActions {
  toggleSidebar: () => void;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShowHelp: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface PrepareQuizUiReturn {
  state: PrepareQuizUiState;
  actions: PrepareQuizUiActions;
}

export const usePrepareQuizUi = (): PrepareQuizUiReturn => {
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
