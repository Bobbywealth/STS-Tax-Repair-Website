import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function NavigationProgress() {
  const [location] = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const isFirstRender = useRef(true);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];

    setIsNavigating(true);
    setProgress(30);
    
    const timer1 = setTimeout(() => setProgress(60), 100);
    const timer2 = setTimeout(() => setProgress(90), 200);
    const timer3 = setTimeout(() => setProgress(100), 400);
    const timer4 = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 600);

    timersRef.current = [timer1, timer2, timer3, timer4];

    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
    };
  }, [location]);

  if (!isNavigating && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none">
      <div
        className={cn(
          "h-full bg-primary transition-all duration-300 ease-out",
          progress === 100 ? "opacity-0" : "opacity-100"
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
