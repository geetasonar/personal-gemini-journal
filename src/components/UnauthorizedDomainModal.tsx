import { useState } from 'react';
import { ShieldAlert, Copy, Check, ExternalLink, ArrowRight, UserCheck, X } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface UnauthorizedDomainModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
}

export function UnauthorizedDomainModal({
  isOpen,
  onClose,
  onContinueAsGuest,
}: UnauthorizedDomainModalProps) {
  const [copied, setCopied] = useState(false);
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const projectId = firebaseConfig.projectId || 'your-project-id';
  const consoleAuthUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  if (!isOpen) return null;

  const handleCopyHostname = async () => {
    try {
      await navigator.clipboard.writeText(currentHostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy domain to clipboard:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 text-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="bg-amber-50 border-b border-amber-200/80 p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-800 border border-amber-300/60 shadow-2xs">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Authorize Domain in Firebase</h2>
              <p className="text-xs text-amber-800 font-medium">Error: <code className="bg-amber-100/80 px-1 py-0.5 rounded text-[11px] font-mono">auth/unauthorized-domain</code></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-amber-100/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-600 leading-relaxed">
            Firebase Authentication requires domains to be whitelisted under <strong>Authorized Domains</strong> before accepting Google OAuth sign-in requests from this preview or deployed host.
          </p>

          {/* Current Domain Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              Your Current App Domain
            </label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800">
              <span className="flex-1 truncate select-all">{currentHostname}</span>
              <button
                id="copy-unauthorized-domain-btn"
                onClick={handleCopyHostname}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-sans font-medium rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition shadow-2xs shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Domain</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step-by-step resolution */}
          <div className="space-y-2.5 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3 Quick Steps to Fix:
            </h3>
            <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                Open the{' '}
                <a
                  href={consoleAuthUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-medium text-emerald-700 hover:text-emerald-800 underline inline-flex items-center gap-0.5"
                >
                  <span>Firebase Authentication Settings</span>
                  <ExternalLink className="w-3 h-3 inline" />
                </a>{' '}
                for project <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono text-slate-800">{projectId}</code>.
              </li>
              <li>
                Scroll down to the <strong>Authorized domains</strong> section and click <strong>Add domain</strong>.
              </li>
              <li>
                Paste <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono text-slate-800">{currentHostname}</code> and click <strong>Save</strong>.
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-slate-100">
            <button
              id="unauthorized-domain-guest-btn"
              onClick={() => {
                onClose();
                onContinueAsGuest();
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Use Guest Mode in the Meantime</span>
            </button>

            <a
              href={consoleAuthUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition shadow-2xs"
            >
              <span>Go to Firebase Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
