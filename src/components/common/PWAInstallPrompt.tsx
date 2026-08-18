import React, { useState, useEffect } from 'react';
import { Download, Monitor, Smartphone, Apple, Check, X, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (installed)
    const isRunningStandalone = window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    setIsStandalone(isRunningStandalone);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice && !isRunningStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 4000);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowModal(true);
    }
  };

  // If already installed in standalone window, do not display promo banner
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Header Install Button */}
      <button
        type="button"
        id="pwa-install-app-btn"
        onClick={handleInstallClick}
        title="Install FarmFlow Pro to your device (Android, iOS, Windows, Mac, Linux)"
        className="px-3 py-1.5 rounded-xl bg-forest-900/90 hover:bg-forest-800 text-mint-400 hover:text-mint-300 border border-forest-700/80 text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0"
      >
        <Download className="w-3.5 h-3.5 text-mint-400" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {/* Cross-Platform Installation Guide Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-graphite-200 w-full max-w-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-forest-950 p-6 text-white flex items-start justify-between border-b border-forest-900">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-mint-400 text-forest-950 flex items-center justify-center font-black text-xl shadow-lg shadow-mint-500/20">
                  FF
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Install FarmFlow Pro</h3>
                  <p className="text-xs text-mint-300">Universal Multi-Platform Application</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-graphite-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4 text-slate-800 text-xs">
              <p className="text-slate-600 leading-relaxed">
                FarmFlow Pro can be installed as a native standalone application across all your devices with full offline support, fast startup, and full-screen experience.
              </p>

              {/* Platform specific cards */}
              <div className="space-y-2.5">
                {/* Android / Chrome */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-forest-950 text-mint-400 shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Android (Chrome / Edge / Samsung Internet)</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Tap the browser menu (⋮) and select <strong className="text-slate-900">"Install App"</strong> or <strong className="text-slate-900">"Add to Home screen"</strong>.
                    </p>
                  </div>
                </div>

                {/* iOS / iPhone / iPad */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-forest-950 text-mint-400 shrink-0">
                    <Apple className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">iPhone / iPad (Safari)</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Tap the Share button (<span className="inline-block px-1 bg-slate-200 rounded text-[10px]">⎋ Share</span>) at the bottom of Safari, scroll down and select <strong className="text-slate-900">"Add to Home Screen"</strong>.
                    </p>
                  </div>
                </div>

                {/* PC / Mac / Windows / Linux */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-forest-950 text-mint-400 shrink-0">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Windows PC / Mac / Linux (Chrome / Edge / Brave)</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Click the <strong className="text-slate-900">Install icon</strong> in your browser's address bar (URL bar), or click <strong className="text-slate-900">Menu (⋮) → "Install FarmFlow Pro"</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="p-3 bg-mint-50 border border-mint-200 rounded-xl space-y-1">
                <p className="font-bold text-forest-900 flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-forest-800" />
                  <span>Benefits of Installing FarmFlow Pro:</span>
                </p>
                <ul className="list-disc list-inside text-[10px] text-forest-800 font-medium space-y-0.5 pl-1">
                  <li>Full offline egg collection and feed logging in farm houses with zero signal.</li>
                  <li>No browser bars or distraction — launches directly from home screen / desktop.</li>
                  <li>Instant sync with cloud MongoDB when Wi-Fi or mobile data reconnects.</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-mint-400 rounded-xl text-xs font-bold transition"
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
