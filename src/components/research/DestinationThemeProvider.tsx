'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import {
  DestinationTheme,
  getDestinationTheme,
  getThemeCSSVariables,
  DEFAULT_THEME
} from '@/lib/theming/destinationThemes';

interface ThemeContextValue {
  theme: DestinationTheme;
  cssVariables: Record<string, string>;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  cssVariables: getThemeCSSVariables(DEFAULT_THEME),
});

interface DestinationThemeProviderProps {
  destinationName: string | undefined;
  children: React.ReactNode;
}

export function DestinationThemeProvider({
  destinationName,
  children
}: DestinationThemeProviderProps) {
  const theme = useMemo(() => getDestinationTheme(destinationName), [destinationName]);
  const cssVariables = useMemo(() => getThemeCSSVariables(theme), [theme]);

  // Apply CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;

    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Cleanup on unmount or theme change
    return () => {
      Object.keys(cssVariables).forEach((key) => {
        root.style.removeProperty(key);
      });
    };
  }, [cssVariables]);

  const value = useMemo(() => ({ theme, cssVariables }), [theme, cssVariables]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useDestinationTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useDestinationTheme must be used within a DestinationThemeProvider');
  }
  return context;
}
