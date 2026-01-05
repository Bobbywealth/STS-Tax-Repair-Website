import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";

import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({ 
  onRefresh, 
  children, 
  disabled = false,
  threshold = 80,
  className
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container) return;

    if (container.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      setPullDistance(0);
      return;
    }

    currentY.current = e.touches[0].clientY;
    const diff = Math.max(0, currentY.current - startY.current);
    const resistance = 0.4;
    const distance = Math.min(diff * resistance, 120);
    
    setPullDistance(distance);

    if (distance >= threshold && pullDistance < threshold) {
      triggerHaptic('medium');
    }
  }, [isPulling, isRefreshing, pullDistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      triggerHaptic('success');
      
      try {
        await onRefresh();
      } catch (e) {
        console.error('Refresh failed:', e);
      }
      
      setIsRefreshing(false);
    }
    
    setPullDistance(0);
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const isReady = pullDistance >= threshold;

  return (
    <div ref={containerRef} className={cn("h-full overflow-y-auto overscroll-contain", className)}>
      <motion.div
        className="flex items-center justify-center overflow-hidden"
        animate={{
          height: isRefreshing ? 48 : pullDistance,
          opacity: pullDistance > 20 || isRefreshing ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        <motion.div
          animate={{
            rotate: isRefreshing ? 360 : isReady ? 180 : pullDistance * 1.5,
          }}
          transition={{
            rotate: isRefreshing 
              ? { duration: 1, repeat: Infinity, ease: "linear" }
              : { duration: 0.2 }
          }}
          className="text-primary"
        >
          <RefreshCw className="h-5 w-5" />
        </motion.div>
        {!isRefreshing && pullDistance > 30 && (
          <span className="ml-2 text-xs text-muted-foreground">
            {isReady ? "Release to refresh" : "Pull to refresh"}
          </span>
        )}
        {isRefreshing && (
          <span className="ml-2 text-xs text-muted-foreground">
            Refreshing...
          </span>
        )}
      </motion.div>
      {children}
    </div>
  );
}
