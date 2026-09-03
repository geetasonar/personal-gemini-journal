import { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown, Moon, Sun } from 'lucide-react';
import { useTheme, THEME_OPTIONS, AppThemeId } from '../context/ThemeContext';

export function ThemeSelector() {
  const { theme, setTheme, currentThemeConfig } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="theme-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition shadow-2xs"
        style={{
          backgroundColor: 'var(--bg-surface-subtle)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
        title="Change application theme"
        aria-label="Change theme"
      >
        <span className="text-sm">{currentThemeConfig.icon}</span>
        <span className="hidden sm:inline font-medium">{currentThemeConfig.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-xl border p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <div className="px-2.5 py-1.5 border-b mb-1" style={{ borderColor: 'var(--border-subtle)' }}>
            <p className="text-[11px] font-bold uppercase tracking-wider opacity-60">Color Atmosphere</p>
          </div>

          <div className="space-y-1">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition ${
                    isSelected ? 'font-semibold' : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Color Swatch */}
                    <div
                      className="w-4 h-4 rounded-full border shadow-2xs shrink-0 flex items-center justify-center text-[10px]"
                      style={{
                        backgroundColor: opt.previewBg,
                        borderColor: opt.previewAccent,
                      }}
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{opt.name}</span>
                        {opt.isDark ? (
                          <Moon className="w-2.5 h-2.5 opacity-50 shrink-0" />
                        ) : (
                          <Sun className="w-2.5 h-2.5 opacity-50 shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] opacity-60 truncate">{opt.description}</p>
                    </div>
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2 text-current" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
