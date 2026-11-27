import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileArchive,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';

const ANDROID_SHARE_URL = 'https://ais-pre-noyxaeeepimqzdkajl5ohh-968396106300.asia-east1.run.app';

interface AndroidInstallModalProps {
  isInstallable: boolean;
  isInstalled: boolean;
  onPromptInstall: () => Promise<boolean>;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({
  isInstallable,
  isInstalled,
  onPromptInstall,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [installing, setInstalling] = useState(false);

  const liveUrl =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? ANDROID_SHARE_URL
      : typeof window !== 'undefined'
        ? window.location.origin
        : ANDROID_SHARE_URL;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard blocked in restricted context; ignore silently
    }
  };

  const handleDirectInstall = async () => {
    setInstalling(true);
    try {
      await onPromptInstall();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-[#070a10]/85">
      <div className="w-full max-w-lg max-h-[92dvh] overflow-y-auto touch-pan-y rounded-xl bg-[#0d121c] border border-slate-700/85 p-5 sm:p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-1">
              <Smartphone className="w-4 h-4" />
              Android App &amp; APK Bundle
            </div>
            <h2 className="font-display text-xl font-bold text-white">
              Install Vanguard Arena on Android
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Install directly onto your Android home screen with offline asset caching &amp; fullscreen landscape touch controls, or download the Android Studio project to compile a standalone APK.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer shrink-0"
            aria-label="Close Android download dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Option 1: Direct Android Install (PWA) */}
          <div className="rounded-xl bg-[#121824] border border-emerald-500/35 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <img
                  src="/pwa-192x192.png"
                  alt="Vanguard Arena icon"
                  className="w-10 h-10 rounded-lg border border-slate-700 shrink-0"
                />
                <div>
                  <div className="font-display text-sm font-bold text-white">
                    Option 1: Direct Android Install
                  </div>
                  <div className="text-[11px] text-emerald-300">
                    {isInstalled
                      ? 'Already installed on this device'
                      : 'Instant full-screen app icon · No Android Studio needed'}
                  </div>
                </div>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 whitespace-nowrap">
                RECOMMENDED
              </span>
            </div>

            {isInstallable ? (
              <button
                type="button"
                disabled={installing}
                onClick={() => void handleDirectInstall()}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {installing ? 'Opening Android Installer...' : 'Install Android App Now'}
              </button>
            ) : (
              <div className="space-y-2.5">
                <ol className="text-xs text-slate-300 space-y-1.5 pl-4 list-decimal leading-relaxed">
                  <li>
                    Open the shared game link below in <strong className="text-white">Google Chrome</strong> on your Android phone (outside preview frame).
                  </li>
                  <li>
                    Tap Chrome&apos;s <strong className="text-white">Install App</strong> prompt or menu{' '}
                    <span className="font-mono text-amber-300">⋮ &gt; Add to Home screen &gt; Install</span>.
                  </li>
                </ol>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={liveUrl}
                    aria-label="Android app URL"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-[#0a0d12] border border-slate-700 font-mono text-[11px] text-slate-300 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCopyUrl()}
                    className="min-h-[44px] flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Option 2: Download Android Studio Wrapper Project (.zip) */}
          <div className="rounded-xl bg-[#121824] border border-slate-800 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-display text-sm font-bold text-white flex items-center gap-1.5">
                  <FileArchive className="w-4 h-4 text-amber-400" />
                  Option 2: Download Android Studio Project (.zip)
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Includes <span className="font-mono text-slate-200">MainActivity.java</span>, landscape immersive{' '}
                  <span className="font-mono text-slate-200">AndroidManifest.xml</span>, Gradle config, and launcher icons. Open in Android Studio and click{' '}
                  <strong className="text-slate-200">Build &gt; Build APK(s)</strong> to export a standalone{' '}
                  <span className="font-mono text-amber-300">.apk</span> file.
                </p>
              </div>
            </div>

            <a
              href="/VanguardArena-Android-Studio.zip"
              download="VanguardArena-Android-Studio.zip"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Android Project (.zip)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export const OfflineIndicator: React.FC<{ isOnline: boolean }> = ({ isOnline }) => {
  if (isOnline) return null;
  return (
    <div
      role="status"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#121824] border border-amber-500/60 text-xs font-medium text-amber-200 shadow-xl pointer-events-none"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>Offline Mode — Solo Bot Combat &amp; Zombie Survival Ready</span>
    </div>
  );
};
