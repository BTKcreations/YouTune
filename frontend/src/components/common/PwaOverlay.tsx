import React, { useState, useEffect } from 'react';
import { Download, X, WifiOff, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../../utils/formatters';

interface PwaOverlayProps {
  onGoToOffline: () => void;
}

export const PwaOverlay: React.FC<PwaOverlayProps> = ({ onGoToOffline }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setShowInstallBanner(false);
      return;
    }

    // 2. Listen for beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Don't show immediately; show after 3 seconds for smooth UX
      setTimeout(() => setShowInstallBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 3. Monitor network connectivity
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      triggerHaptic('medium');
      onGoToOffline();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    triggerHaptic('success');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <>
      {/* Offline Status Alert Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-600 to-amber-700 text-black px-4 py-2 flex items-center justify-between text-xs font-bold shadow-xl animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-black animate-pulse" />
            <span>You're offline — now playing from your Downloaded Vault</span>
          </div>
          <button
            onClick={() => onGoToOffline()}
            className="px-3 py-1 bg-black text-white text-[11px] rounded-full hover:scale-105 transition-transform"
          >
            View Downloads
          </button>
        </div>
      )}

      {/* Floating Install App Banner */}
      {showInstallBanner && !isOffline && (
        <div className="fixed bottom-24 md:bottom-28 left-4 right-4 md:left-auto md:right-8 md:w-96 z-40 bg-[#181818]/95 backdrop-blur-md p-4 rounded-2xl border border-spotify-green/40 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-spotify-green flex items-center justify-center flex-shrink-0 text-black shadow-md">
              <Download className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">Install YouTune App</h4>
              <p className="text-[11px] text-spotify-subtext truncate">
                Full-screen, lock-screen controls & offline play
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-4 py-1.5 bg-spotify-green hover:bg-spotify-green-light text-black font-extrabold text-xs rounded-full shadow-lg hover:scale-105 transition-all"
            >
              Install
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="text-neutral-500 hover:text-white p-1"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
