import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppThemeId = 'parchment' | 'obsidian' | 'sage' | 'indigo';

export interface ThemeOption {
  id: AppThemeId;
  name: string;
  description: string;
  icon: string;
  previewBg: string;
  previewAccent: string;
  isDark: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'parchment',
    name: 'Editorial Parchment',
    description: 'Warm ivory paper, rich espresso ink, and sepia accents',
    icon: '📜',
    previewBg: '#F8F6F0',
    previewAccent: '#8B5A2B',
    isDark: false,
  },
  {
    id: 'obsidian',
    name: 'Obsidian Velvet',
    description: 'Deep midnight charcoal with warm amber and platinum highlights',
    icon: '✨',
    previewBg: '#0F1117',
    previewAccent: '#F59E0B',
    isDark: true,
  },
  {
    id: 'sage',
    name: 'Nordic Sage',
    description: 'Calming mist green, deep pine, and eucalyptus tones',
    icon: '🌿',
    previewBg: '#F2F6F4',
    previewAccent: '#2D6A4F',
    isDark: false,
  },
  {
    id: 'indigo',
    name: 'Twilight Slate',
    description: 'Deep celestial slate, soft violet, and luminous starlight cyan',
    icon: '🌌',
    previewBg: '#0F172A',
    previewAccent: '#38BDF8',
    isDark: true,
  },
];

interface ThemeContextValue {
  theme: AppThemeId;
  setTheme: (theme: AppThemeId) => void;
  currentThemeConfig: ThemeOption;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'personal_gemini_journal_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppThemeId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppThemeId;
      if (saved && THEME_OPTIONS.some((t) => t.id === saved)) {
        return saved;
      }
    }
    return 'parchment';
  });

  const setTheme = (newTheme: AppThemeId) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      if (newTheme === 'obsidian' || newTheme === 'indigo') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'obsidian' || theme === 'indigo') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const currentThemeConfig = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        currentThemeConfig,
        isDark: currentThemeConfig.isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
