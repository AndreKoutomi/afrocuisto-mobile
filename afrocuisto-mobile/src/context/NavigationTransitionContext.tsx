import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface NavigationTransitionContextType {
  loadingScreen: string | null;
  triggerScreenLoading: (screenName: string, durationMs?: number) => void;
  isScreenLoading: (screenName: string) => boolean;
}

const NavigationTransitionContext = createContext<NavigationTransitionContextType | undefined>(undefined);

export const NavigationTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingScreens, setLoadingScreens] = useState<Record<string, boolean>>({});
  const timeoutsRef = useRef<Record<string, any>>({});

  const triggerScreenLoading = useCallback((screenName: string, durationMs: number = 1500) => {
    if (timeoutsRef.current[screenName]) {
      clearTimeout(timeoutsRef.current[screenName]);
    }
    setLoadingScreens(prev => ({ ...prev, [screenName]: true }));
    timeoutsRef.current[screenName] = setTimeout(() => {
      setLoadingScreens(prev => {
        const next = { ...prev };
        delete next[screenName];
        return next;
      });
      delete timeoutsRef.current[screenName];
    }, durationMs);
  }, []);

  const isScreenLoading = useCallback((screenName: string) => {
    return !!loadingScreens[screenName];
  }, [loadingScreens]);

  const loadingScreen = Object.keys(loadingScreens)[0] || null;

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
