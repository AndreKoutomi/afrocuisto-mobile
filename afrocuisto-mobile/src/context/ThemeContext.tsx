import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageService } from '../services/storage';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mode clair par défaut fidèle aux maquettes Figma
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const stored = await StorageService.getItem<boolean | null>('afrocuisto_dark_mode', null);
      if (stored !== null) {
        setIsDark(stored);
      }
    })();
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await StorageService.setItem('afrocuisto_dark_mode', next);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
