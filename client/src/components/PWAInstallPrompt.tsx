import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Download, Smartphone, Zap } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import stsLogo from "@/assets/sts-logo.png";

export function PWAInstallPrompt() {
  const { isInstallable, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    await installApp();
    setIsInstalling(false);
  };

  if (!isInstallable || isDismissed) return null;

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
            onClick={() => setIsDismissed(true)}
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
                  onClick={() => setIsDismissed(true)}
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
