import React, { createContext, useContext, useState, useEffect } from 'react';
import { HeroUIProvider } from '@heroui/react';
import { useAuth } from './AuthContext';

export type ColorMode = 'light' | 'dark';

interface ColorModeContextType {
  mode: ColorMode;
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'light',
  toggleColorMode: () => {},
  setColorMode: () => {},
});

export const ColorModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<ColorMode>(() => {
    const saved = localStorage.getItem('theme_mode');
    if (saved === 'dark' || saved === 'light') return saved;
    // Default to system preference or light
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  // Sync with user preferences if available
  useEffect(() => {
    if (user?.preferences?.theme && ['light', 'dark'].includes(user.preferences.theme)) {
      setMode(user.preferences.theme as ColorMode);
    }
  }, [user?.preferences?.theme]);

  // Synchronize <html> element class and CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('theme_mode', mode);
  }, [mode]);

  const toggleColorMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setColorMode = (newMode: ColorMode) => {
    setMode(newMode);
  };

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode, setColorMode }}>
      <HeroUIProvider>
        <div className={`${mode} text-foreground bg-background min-h-screen transition-colors duration-150`}>
          {children}
        </div>
      </HeroUIProvider>
    </ColorModeContext.Provider>
  );
};

export const useColorMode = () => useContext(ColorModeContext);
