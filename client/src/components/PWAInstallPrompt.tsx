import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone, Zap } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import stsLogo from "@/assets/sts-logo.png";

export function PWAInstallPrompt() {
  const { isInstallable, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const pathname = useMemo(() => window.location.pathname, []);

  // Never show the install prompt on form-heavy / auth routes (it overlaps important UI on mobile).
  const isBlacklistedRoute = useMemo(() => {
    const p = pathname || "/";
    return (
      p.startsWith("/client-login") ||
      p.startsWith("/register") ||
      p.startsWith("/forgot-password") ||
      p.startsWith("/reset-password") ||
      p.startsWith("/verify-email") ||
      p.startsWith("/book-appointment") ||
      p.startsWith("/staff-signup") ||
      p.startsWith("/admin-login") ||
      p.startsWith("/login") ||
      p.startsWith("/redeem-invite") ||
      p.startsWith("/client-portal") ||
      p.startsWith("/dashboard") ||
      p.startsWith("/clients") ||
      p.startsWith("/documents") ||
      p.startsWith("/appointments") ||
      p.startsWith("/tasks") ||
      p.startsWith("/settings")
    );
  }, [pathname]);

  // Check if user has permanently dismissed (or dismissed recently)
  const isPermanentlyDismissed = useMemo(() => {
    const dismissedAt = localStorage.getItem("pwa-install-dismissed-at");
    if (!dismissedAt) return false;
    const dismissedTime = parseInt(dismissedAt, 10);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - dismissedTime < sevenDays;
  }, []);

  // Delay showing so it doesn't immediately cover content on initial render.
  useEffect(() => {
    const t = window.setTimeout(() => setIsReady(true), 3500);
    return () => window.clearTimeout(t);
  }, []);

  // Track focus so we don't cover an active input on mobile.
  useEffect(() => {
    const onFocusIn = (e: Event) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (el as any)?.isContentEditable) {
        setIsInputFocused(true);
      }
    };
    const onFocusOut = () => setIsInputFocused(false);
    window.addEventListener("focusin", onFocusIn);
    window.addEventListener("focusout", onFocusOut);
    return () => {
      window.removeEventListener("focusin", onFocusIn);
      window.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    await installApp();
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed-at", Date.now().toString());
    setIsDismissed(true);
  };

  if (!isInstallable || isDismissed || !isReady || isBlacklistedRoute || isInputFocused || isPermanentlyDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:max-w-sm"
      >
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-2xl border border-[#4CAF50]/30 p-4 shadow-2xl shadow-[#4CAF50]/10">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
            data-testid="button-dismiss-install"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-[#4CAF50]/20 to-[#1a4d2e]/20 flex items-center justify-center border border-[#4CAF50]/30">
                <img src={stsLogo} alt="STS" className="h-10 w-10 object-contain" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-[#4CAF50] flex items-center justify-center">
                <Smartphone className="h-3 w-3 text-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm">Install STS TaxRepair</h3>
              <p className="text-xs text-gray-400 mt-1">
                Get quick access from your home screen with offline support
              </p>

              <div className="flex items-center gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="bg-gradient-to-r from-[#4CAF50] to-[#1a4d2e] hover:opacity-90 text-white text-xs h-8 px-3 rounded-lg"
                  data-testid="button-install-pwa"
                >
                  {isInstalling ? (
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3 animate-pulse" />
                      Installing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      Install App
                    </span>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-white text-xs h-8 px-2"
                  data-testid="button-later-install"
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
