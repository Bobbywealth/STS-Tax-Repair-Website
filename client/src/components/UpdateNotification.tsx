import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";

export function UpdateNotification() {
  const { hasUpdate, updateApp } = usePWA();

  if (!hasUpdate) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 md:bottom-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:max-w-sm"
      >
        <div className="bg-primary text-primary-foreground rounded-xl p-4 shadow-lg flex items-center gap-3">
          <div className="flex-shrink-0">
            <RefreshCw className="h-5 w-5 animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Update Available</p>
            <p className="text-xs opacity-90">A new version is ready to install</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={updateApp}
            className="flex-shrink-0"
            data-testid="button-update-app"
          >
            Update
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
