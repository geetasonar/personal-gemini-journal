import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppThemeId = 'parchment' | 'obsidian' | 'sage' | 'indigo' | 'rose';

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
    name: 'Editorial Linen & Amber',
    description: 'Warm ivory paper, rich espresso ink, and artisanal honey amber',
    icon: '📜',
    previewBg: '#FAF7F2',
    previewAccent: '#A35C27',
    isDark: false,
  },
  {
    id: 'obsidian',
    name: 'Velvet Obsidian',
    description: 'Deep midnight charcoal with warm astral amber starlight',
    icon: '✨',
    previewBg: '#0B0D13',
    previewAccent: '#F59E0B',
    isDark: true,
  },
  {
    id: 'sage',
    name: 'Kyoto Forest & Pine',
    description: 'Tranquil matcha mist, soothing cypress, and cedar tones',
    icon: '🌿',
    previewBg: '#F2F6F3',
    previewAccent: '#246648',
    isDark: false,
  },
  {
    id: 'indigo',
    name: 'Celestial Twilight',
    description: 'Deep cosmic sapphire, astral silver, and starlight cyan',
    icon: '🌌',
    previewBg: '#090D18',
    previewAccent: '#0EA5E9',
    isDark: true,
  },
  {
    id: 'rose',
    name: 'Cashmere Rose & Plum',
    description: 'Soft porcelain blush, dusky vintage plum, and rose terracotta',
    icon: '🌸',
    previewBg: '#FAF4F4',
    previewAccent: '#B75369',
    isDark: false,
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
    return 'indigo';
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

  const currentThemeConfig = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS.find((t) => t.id === 'indigo') || THEME_OPTIONS[0];

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
