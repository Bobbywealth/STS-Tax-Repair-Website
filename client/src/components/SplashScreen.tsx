import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import stsLogo from "@/assets/sts-logo.png";

interface SplashScreenProps {
  onComplete: () => void;
  minimumDisplayTime?: number;
}

export function SplashScreen({ onComplete, minimumDisplayTime = 2500 }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("Initializing");

  useEffect(() => {
    const loadingTexts = [
      "Initializing",
      "Loading resources",
      "Preparing your experience",
      "Almost ready"
    ];

    let currentTextIndex = 0;
    const textInterval = setInterval(() => {
      currentTextIndex = (currentTextIndex + 1) % loadingTexts.length;
      setLoadingText(loadingTexts[currentTextIndex]);
    }, 600);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        const increment = Math.random() * 15 + 5;
        return Math.min(prev + increment, 100);
      });
    }, 200);

    const timer = setTimeout(() => {
      setProgress(100);
      setTimeout(onComplete, 500);
    }, minimumDisplayTime);

    return () => {
      clearInterval(textInterval);
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, [onComplete, minimumDisplayTime]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)"
        }}
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: i % 3 === 0 ? "#4CAF50" : i % 3 === 1 ? "#FDB913" : "#1a4d2e",
                opacity: 0.3,
              }}
              animate={{
                y: [-20, 20],
                x: [-10, 10],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                repeatType: "reverse",
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Glowing ring behind logo */}
        <motion.div
          className="absolute"
          style={{
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(76,175,80,0.3) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Logo container */}
        <motion.div
          className="relative z-10"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
            delay: 0.2,
          }}
        >
          {/* Logo with glow effect */}
          <motion.div
            className="relative"
            animate={{
              filter: [
                "drop-shadow(0 0 20px rgba(76,175,80,0.5))",
                "drop-shadow(0 0 40px rgba(76,175,80,0.8))",
                "drop-shadow(0 0 20px rgba(76,175,80,0.5))",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <img
              src={stsLogo}
              alt="STS TaxRepair"
              className="w-32 h-32 object-contain"
            />
          </motion.div>
        </motion.div>

        {/* Company name with animated reveal */}
        <motion.div
          className="mt-6 text-center z-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold tracking-wider">
            <span className="text-white">STS</span>
            <span className="text-[#4CAF50]"> Tax</span>
            <span className="text-[#FDB913]">Repair</span>
          </h1>
          <motion.p
            className="text-gray-400 text-sm mt-2 tracking-widest uppercase"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Expert Tax Solutions
          </motion.p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          className="mt-12 w-64 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="relative h-1 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: "linear-gradient(90deg, #1a4d2e, #4CAF50, #FDB913)",
              }}
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {/* Loading text */}
          <motion.p
            className="text-center text-gray-500 text-xs mt-3 h-4"
            key={loadingText}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {loadingText}...
          </motion.p>
        </motion.div>

        {/* Bottom branding */}
        <motion.div
          className="absolute bottom-8 text-center z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-gray-600 text-xs">
            Maximum Refund Guaranteed
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
