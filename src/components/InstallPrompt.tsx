import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if it's already installed (standalone mode) or running as a Chrome Extension
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    const isPwa = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    if (isExtension || isPwa) {
      setIsStandalone(true);
      return;
    }

    // Detect iOS (including iPadOS 13+)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (userAgent.includes("macintosh") && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // iOS doesn't fire beforeinstallprompt, so we just show the prompt immediately
      // if they are not in standalone mode.
      setIsVisible(true);
    }

    // Listen for the beforeinstallprompt event (Android/Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // For iOS, just acknowledge the click (maybe pulse the instruction)
      return;
    }

    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsVisible(false);
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
  };

  if (isStandalone || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm"
      >
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 p-4 rounded-2xl shadow-2xl flex items-center gap-4 cursor-pointer hover:bg-slate-50/90 dark:hover:bg-slate-700/90 transition-colors relative group"
             onClick={handleInstallClick}
        >
          {/* Close Button */}
          <button 
            onClick={handleCloseClick}
            className="absolute -top-2 -right-2 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 p-1.5 rounded-full shadow-sm hover:bg-red-100 hover:text-red-500 transition-colors z-10 opacity-0 group-hover:opacity-100 sm:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-slate-900 dark:text-slate-100 font-bold text-sm">
              Install ChallengeBoard
            </h3>
            {isIOS ? (
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 leading-snug">
                Tap <Share className="inline w-3 h-3 mx-0.5" /> then "Add to Home Screen" to install.
              </p>
            ) : (
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Install for offline access & better experience.
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
