import React, { useState } from 'react';
import { Download, Smartphone, Check, X, Monitor, ShieldCheck, Laptop } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'primary' | 'secondary' | 'compact' | 'hero';
  className?: string;
  showWhenInstalled?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'secondary',
  className = '',
  showWhenInstalled = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed and showWhenInstalled is false, hide
  if (isInstalled && !showWhenInstalled) {
    return null;
  }

  if (isInstalled && showWhenInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-mono font-medium">
        <Check className="h-3.5 w-3.5 text-emerald-400" />
        <span>App Installed</span>
      </span>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 3000);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  const buttonClasses = {
    hero: 'px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all flex items-center gap-2.5',
    primary: 'px-4 py-2 rounded-lg font-semibold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-2 shadow-sm',
    secondary: 'px-3 py-1.5 rounded-lg font-medium text-xs bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-2',
    compact: 'p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 transition-colors',
  }[variant];

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`${buttonClasses} ${className}`}
        title="Install PRISM as Standalone App (Desktop & Mobile)"
        aria-label="Install PRISM App"
      >
        {installSuccess ? (
          <>
            <Check className="h-4 w-4 text-emerald-400" />
            <span>Installed!</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="font-sans">Install App</span>
          </>
        )}
      </button>

      {/* Cross-Platform Installation Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 relative">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Install PRISM Console App</h3>
                <p className="text-xs text-slate-400">Desktop & Mobile Standalone Installation</p>
              </div>
            </div>

            <div className="space-y-4 my-4 text-xs text-slate-300">
              {isIOS ? (
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                    <Smartphone className="h-4 w-4" />
                    <span>Install on Apple iOS Safari:</span>
                  </div>
                  <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
                    <li>Tap the <strong>Share</strong> button (box with upward arrow) at bottom of Safari.</li>
                    <li>Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.</li>
                    <li>Tap <strong>&quot;Add&quot;</strong> in top-right. PRISM will appear with its industrial icon.</li>
                  </ol>
                </div>
              ) : (
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                    <Monitor className="h-4 w-4" />
                    <span>Chrome, Edge & Android:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Look for the <strong>&quot;Install&quot; icon (computer with down arrow)</strong> directly in your browser address bar (right side), or open browser menu (⋮) and click <strong>&quot;Install PRISM...&quot;</strong>.
                  </p>
                  <div className="p-3 bg-cyan-950/30 rounded-lg border border-cyan-900/40 text-[11px] text-cyan-200">
                    💡 <strong>Offline & Standalone:</strong> Running as an installed app provides a distraction-free window, full-screen hardware camera scanner for equipment QR tags, and local hourly log exports.
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
