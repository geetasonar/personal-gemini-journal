import { useState } from 'react';
import { signInWithGoogle, signInAsGuest } from '../lib/firebase';
import { Sparkles, Shield, Lock, Database, Brain, ArrowRight, CheckCircle2, AlertCircle, ShieldAlert, Copy, ExternalLink } from 'lucide-react';
import { UnauthorizedDomainModal } from './UnauthorizedDomainModal';
import firebaseConfig from '../../firebase-applet-config.json';

interface LandingPageProps {
  onOpenSecurityModal: () => void;
}

export function LandingPage({ onOpenSecurityModal }: LandingPageProps) {
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const projectId = firebaseConfig.projectId || 'your-project-id';
  const consoleAuthUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setIsUnauthorizedDomain(false);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign in error:', err);
      const isDomainError =
        err.code === 'auth/unauthorized-domain' ||
        (typeof err.message === 'string' && err.message.includes('auth/unauthorized-domain'));

      if (isDomainError) {
        setIsUnauthorizedDomain(true);
        setShowDomainModal(true);
        setErrorMsg(`Domain '${currentHostname}' is not yet authorized in Firebase Authentication.`);
      } else if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        setErrorMsg('Sign-in popup was blocked or closed. You can also use Quick Guest Sign-In below or allow popups for this site.');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      setGuestLoading(true);
      setErrorMsg(null);
      await signInAsGuest();
    } catch (err: any) {
      console.error('Guest sign in error:', err);
      setErrorMsg(err.message || 'Guest session initialization failed.');
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Top Banner & Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-4">
        {/* Left Column: Value Prop */}
        <div className="lg:col-span-7 space-y-6">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium transition shadow-2xs"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent-text)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-current" />
            <span>Powered by Gemini 3.8 Flash & Cloud Firestore</span>
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.12] font-serif"
            style={{ color: 'var(--text-primary)' }}
          >
            A private sanctuary for <span className="italic" style={{ color: 'var(--accent-text)' }}>deep reflection</span> and clarity.
          </h1>

          <p
            className="text-base sm:text-lg leading-relaxed max-w-2xl font-editorial"
            style={{ color: 'var(--text-secondary)' }}
          >
            Personal Gemini Journal pairs your stream of consciousness with Google's Gemini 3.8 Flash model. Converse across multi-turn sessions, uncover introspective insights, and synthesize reflections into actionable takeaways—all securely isolated in your private Cloud Firestore vault.
          </p>

          {/* Auth Action Box */}
          <div
            className="p-6 rounded-2xl border shadow-xs max-w-xl space-y-4 transition"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Authenticate to Enter Your Private Vault</span>
            </h2>

            {errorMsg && (
              <div className={`p-3.5 rounded-xl text-xs space-y-2.5 ${isUnauthorizedDomain ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500' : 'bg-red-500/10 border border-red-500/30 text-red-500'}`}>
                <div className="flex items-start gap-2">
                  {isUnauthorizedDomain ? (
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                  )}
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold">{errorMsg}</p>
                    {isUnauthorizedDomain && (
                      <p className="text-[11px] leading-normal opacity-90">
                        To enable Google Sign-In, add <code className="px-1 py-0.5 rounded font-mono font-bold bg-black/10 dark:bg-white/10">{currentHostname}</code> to Authorized Domains in Firebase Console.
                      </p>
                    )}
                  </div>
                </div>

                {isUnauthorizedDomain && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDomainModal(true)}
                      className="px-3 py-1.5 font-semibold rounded-lg text-[11px] transition shadow-2xs"
                      style={{
                        backgroundColor: 'var(--accent-subtle)',
                        color: 'var(--accent-text)',
                      }}
                    >
                      View Fix Guide & Copy Domain
                    </button>
                    <a
                      href={consoleAuthUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="px-3 py-1.5 border font-medium rounded-lg text-[11px] transition inline-flex items-center gap-1 shadow-2xs"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-medium)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span>Open Firebase Console</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Google Sign In Button */}
              <button
                id="landing-google-signin-btn"
                onClick={handleGoogleSignIn}
                disabled={loading || guestLoading}
                className="flex-1 flex items-center justify-center gap-3 px-5 py-2.5 rounded-lg font-medium text-sm text-white transition shadow-xs disabled:opacity-50 hover:opacity-90"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>

              {/* Guest Sign In for test fallback */}
              <button
                id="landing-guest-signin-btn"
                onClick={handleGuestSignIn}
                disabled={loading || guestLoading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium border transition disabled:opacity-50 hover:opacity-80"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {guestLoading ? (
                  <div className="w-4 h-4 border-2 border-stone-500/30 border-t-stone-700 rounded-full animate-spin" />
                ) : (
                  <span>Guest Demo Mode</span>
                )}
              </button>
            </div>

            <p className="text-[11px] text-center opacity-70" style={{ color: 'var(--text-secondary)' }}>
              Protected by Firebase OAuth. Zero plaintext credentials. Isolated per user UID.
            </p>
          </div>
        </div>

        {/* Right Column: Architecture & Feature Highlights */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className="p-6 rounded-2xl border shadow-lg space-y-5 transition"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent-text)' }}>
                Security & Architecture
              </span>
              <button
                onClick={onOpenSecurityModal}
                className="text-xs underline underline-offset-4 flex items-center gap-1 opacity-80 hover:opacity-100"
                style={{ color: 'var(--text-primary)' }}
              >
                <span>View Threat Matrix</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    backgroundColor: 'var(--accent-subtle)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--accent-text)',
                  }}
                >
                  <Shield className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Firebase Federated Auth</h3>
                  <p className="text-xs leading-relaxed opacity-75" style={{ color: 'var(--text-secondary)' }}>
                    Google OAuth token exchange without local password exposure or plaintext credential storage.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    backgroundColor: 'var(--accent-subtle)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--accent-text)',
                  }}
                >
                  <Database className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Firestore Owner-Bound Isolation</h3>
                  <p className="text-xs leading-relaxed opacity-75" style={{ color: 'var(--text-secondary)' }}>
                    Strict rules enforce <code className="text-[11px] font-mono px-1 py-0.5 rounded bg-black/5 dark:bg-white/10">request.auth.uid == userId</code> to block cross-tenant read/write leaks.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    backgroundColor: 'var(--accent-subtle)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--accent-text)',
                  }}
                >
                  <Brain className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Gemini 3.8 Flash & Fallback Resilience</h3>
                  <p className="text-xs leading-relaxed opacity-75" style={{ color: 'var(--text-secondary)' }}>
                    Multi-turn conversational reflections with automated fallback resilience (3.8 Flash → 3.1 Flash-Lite → Pro).
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t flex items-center justify-between text-xs opacity-75" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Zero-Hardcoded Secrets
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Secret Manager Bound
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t mt-12" style={{ borderColor: 'var(--border-subtle)' }}>
        <div
          className="p-5 rounded-xl border shadow-2xs space-y-2 transition"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent-text)' }}>
            01. Conversational Reflections
          </span>
          <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Multi-Turn Thought Partnership</h3>
          <p className="text-xs leading-relaxed opacity-80" style={{ color: 'var(--text-secondary)' }}>
            Choose between Socratic probing, creative brainstorming, or action-oriented coaching for every reflection session.
          </p>
        </div>

        <div
          className="p-5 rounded-xl border shadow-2xs space-y-2 transition"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent-text)' }}>
            02. Automated Synthesis
          </span>
          <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Key Insights & Action Steps</h3>
          <p className="text-xs leading-relaxed opacity-80" style={{ color: 'var(--text-secondary)' }}>
            Generate high-level session summaries, extract emotional mood indicators, and structure tangible micro-actions.
          </p>
        </div>

        <div
          className="p-5 rounded-xl border shadow-2xs space-y-2 transition"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent-text)' }}>
            03. Persistent History
          </span>
          <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Searchable Firestore Vault</h3>
          <p className="text-xs leading-relaxed opacity-80" style={{ color: 'var(--text-secondary)' }}>
            Access past journal entries anytime with instant real-time synchronization, tag filtering, and markdown export.
          </p>
        </div>
      </div>
      {/* Unauthorized Domain Modal */}
      <UnauthorizedDomainModal
        isOpen={showDomainModal}
        onClose={() => setShowDomainModal(false)}
        onContinueAsGuest={handleGuestSignIn}
      />
    </div>
  );
}
