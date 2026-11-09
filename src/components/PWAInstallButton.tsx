import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Share, PlusSquare, X } from 'lucide-react';
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
    setShowIOSGuide(false);
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
      <div className="inline-flex items-center h-8 sm:h-9 rounded-xl bg-amber-100 border border-amber-300/90 text-amber-950 shrink-0">
        <button
          type="button"
          data-testid="pwa-install-btn"
          onClick={install}
          className="appearance-none inline-flex items-center justify-center gap-1 h-full px-2.5 sm:px-3 text-xs font-semibold leading-none whitespace-nowrap rounded-l-xl rounded-r-xl sm:rounded-r-none hover:bg-amber-200/70 transition cursor-pointer"
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
          className="appearance-none hidden sm:inline-flex items-center justify-center h-full px-2 text-amber-800 hover:bg-amber-200/80 border-l border-amber-300/80 rounded-r-xl transition cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  if (isIOS) {
    return (
      <>
        <div className="inline-flex items-center h-8 sm:h-9 rounded-xl bg-amber-100 border border-amber-300/90 text-amber-950 shrink-0">
          <button
            type="button"
            data-testid="pwa-ios-install-btn"
            onClick={() => setShowIOSGuide(true)}
            className="appearance-none inline-flex items-center justify-center gap-1 h-full px-2.5 sm:px-3 text-xs font-semibold leading-none whitespace-nowrap rounded-l-xl rounded-r-xl sm:rounded-r-none hover:bg-amber-200/70 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-800 shrink-0" />
            <span className="hidden sm:inline">Install on iOS</span>
            <span className="sm:hidden">Install</span>
          </button>
          <button
            type="button"
            data-testid="pwa-dismiss-btn"
            onClick={handleDismiss}
            aria-label="Dismiss iOS install button"
            title="Hide install button"
            className="appearance-none hidden sm:inline-flex items-center justify-center h-full px-2 text-amber-800 hover:bg-amber-200/80 border-l border-amber-300/80 rounded-r-xl transition cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {showIOSGuide &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ios-install-modal-title"
              onClick={() => setShowIOSGuide(false)}
              className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 id="ios-install-modal-title" className="text-base font-bold text-slate-900">
                      Install Loamy on iPhone / iPad
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Add Loamy to your Home Screen for full-screen access.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowIOSGuide(false)}
                    aria-label="Close install instructions"
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-stone-100 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <ol className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                    <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                      <Share className="w-4 h-4" />
                    </span>
                    <span>
                      1. Tap the <strong>Share</strong> button in the Safari toolbar.
                    </span>
                  </li>
                  <li className="flex items-center gap-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200/80">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
                      <PlusSquare className="w-4 h-4" />
                    </span>
                    <span>
                      2. Scroll down and tap <strong>Add to Home Screen</strong>.
                    </span>
                  </li>
                </ol>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowIOSGuide(false)}
                    className="w-full rounded-xl bg-emerald-800 hover:bg-emerald-700 py-2.5 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    Got it
                  </button>
                  <button
                    type="button"
                    data-testid="pwa-modal-dismiss-btn"
                    onClick={handleDismiss}
                    className="w-full rounded-xl bg-stone-100 hover:bg-stone-200 py-2 text-xs font-medium text-slate-600 transition cursor-pointer"
                  >
                    Hide install button
                  </button>
                </div>
              </div>
            </div>,
            document.body
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
