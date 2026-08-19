import React, { createContext, useContext, useState, useCallback } from 'react';

interface NavigationTransitionContextType {
  loadingScreen: string | null;
  triggerScreenLoading: (screenName: string) => void;
  isScreenLoading: (screenName: string) => boolean;
}

const NavigationTransitionContext = createContext<NavigationTransitionContextType | undefined>(undefined);

export const NavigationTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingScreen, setLoadingScreen] = useState<string | null>(null);
  const timeoutRef = React.useRef<any>(null);

  const triggerScreenLoading = useCallback((screenName: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setLoadingScreen(screenName);
    timeoutRef.current = setTimeout(() => {
      setLoadingScreen(null);
    }, 40);
  }, []);

  const isScreenLoading = useCallback((screenName: string) => {
    return loadingScreen === screenName;
  }, [loadingScreen]);

  return (
    <NavigationTransitionContext.Provider value={{ loadingScreen, triggerScreenLoading, isScreenLoading }}>
      {children}
    </NavigationTransitionContext.Provider>
  );
};

export const useNavigationTransition = () => {
  const context = useContext(NavigationTransitionContext);
  if (!context) {
    throw new Error('useNavigationTransition must be used within NavigationTransitionProvider');
  }
  return context;
};
