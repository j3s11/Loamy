import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

const DISMISS_STORAGE_KEY = 'gws_pwa_install_dismissed_v1';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem(DISMISS_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, '1');
    } catch {
      // ignore storage errors
    }
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  if (isInstallable) {
    return (
      <div className="inline-flex items-center rounded-xl bg-amber-100 border border-amber-300 text-amber-950 overflow-hidden">
        <button
          type="button"
          data-testid="pwa-install-btn"
          onClick={install}
          className="inline-flex items-center justify-center gap-1 min-h-[34px] sm:min-h-[38px] pl-2.5 pr-1.5 py-1 text-xs font-semibold hover:bg-amber-200/70 transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-amber-800 shrink-0" />
          <span className="hidden sm:inline">Install Loamy</span>
          <span className="sm:hidden">Install</span>
        </button>
        <button
          type="button"
          data-testid="pwa-dismiss-btn"
          onClick={handleDismiss}
          aria-label="Dismiss install button"
          title="Hide install button"
          className="min-h-[34px] sm:min-h-[38px] px-1.5 inline-flex items-center justify-center text-amber-800 hover:bg-amber-200/80 border-l border-amber-300/80 transition cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  if (isIOS) {
    return (
      <>
        <div className="inline-flex items-center rounded-xl bg-amber-100 border border-amber-300 text-amber-950 overflow-hidden">
          <button
            type="button"
            data-testid="pwa-ios-install-btn"
            onClick={() => setShowIOSGuide(true)}
            className="inline-flex items-center justify-center gap-1 min-h-[34px] sm:min-h-[38px] pl-2.5 pr-1.5 py-1 text-xs font-semibold hover:bg-amber-200/70 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-800 shrink-0" />
            <span className="hidden sm:inline">Install on iOS</span>
            <span className="sm:hidden">iOS App</span>
          </button>
          <button
            type="button"
            data-testid="pwa-dismiss-btn"
            onClick={handleDismiss}
            aria-label="Dismiss iOS install button"
            title="Hide install button"
            className="min-h-[34px] sm:min-h-[38px] px-1.5 inline-flex items-center justify-center text-amber-800 hover:bg-amber-200/80 border-l border-amber-300/80 transition cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-stone-200 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Install Loamy on iPhone / iPad</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                1. Tap the <strong>Share</strong> button in the Safari toolbar.<br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-emerald-800 hover:bg-emerald-700 py-2.5 text-xs font-semibold text-white transition cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      data-testid="pwa-offline-banner"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg"
    >
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      <span>Offline Mode — Cached garden data is being used.</span>
    </div>
  );
};
