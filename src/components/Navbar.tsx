import { User } from 'firebase/auth';
import { logOut } from '../lib/firebase';
import { Sparkles, ShieldCheck, LogOut, Plus } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';

interface NavbarProps {
  user: User | null;
  onNewEntry: () => void;
  onOpenSecurityModal: () => void;
  entriesCount: number;
}

export function Navbar({ user, onNewEntry, onOpenSecurityModal, entriesCount }: NavbarProps) {
  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <header
      className="sticky top-0 z-30 border-b shadow-2xs transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
        color: 'var(--text-primary)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shadow-2xs transition-colors"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#FFFFFF',
            }}
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight font-serif" style={{ color: 'var(--text-primary)' }}>
                Personal Gemini Journal
              </span>
              <span
                className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md border"
                style={{
                  backgroundColor: 'var(--badge-bg)',
                  borderColor: 'var(--badge-border)',
                  color: 'var(--badge-text)',
                }}
              >
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs hidden sm:block opacity-70" style={{ color: 'var(--text-secondary)' }}>
              Private Introspective Studio & Vault
            </p>
          </div>
        </div>

        {/* Right: Actions and User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme Selector */}
          <ThemeSelector />

          <button
            id="nav-security-btn"
            onClick={onOpenSecurityModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition hover:opacity-90"
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            title="View Security & Firestore Isolation Architecture"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Security</span>
          </button>

          {user && (
            <>
              <button
                id="nav-new-entry-btn"
                onClick={onNewEntry}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition shadow-2xs hover:opacity-90"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Reflection</span>
              </button>

              <div className="h-5 w-px mx-0.5 sm:mx-1 hidden sm:block" style={{ backgroundColor: 'var(--border-subtle)' }} />

              <div className="flex items-center gap-2 pl-1">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User Avatar'}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full ring-1 ring-stone-300 object-cover"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full font-semibold text-xs flex items-center justify-center ring-1"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-medium leading-none truncate max-w-[130px]" style={{ color: 'var(--text-primary)' }}>
                    {user.displayName || (user.isAnonymous ? 'Guest Explorer' : user.email?.split('@')[0])}
                  </p>
                  <p className="text-[10px] truncate max-w-[130px] opacity-70" style={{ color: 'var(--text-secondary)' }}>
                    {user.email || 'Anonymous Vault'}
                  </p>
                </div>

                <button
                  id="nav-logout-btn"
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg transition opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5"
                  title="Sign Out"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
