"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BrandLogo from "./BrandLogo";

/**
 * Cinematic loading / preloader screen.
 * Centers the official crest large with a fade-in + travelling gold
 * shimmer sweep, then crossfades out once the app has mounted.
 */
export default function Preloader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1700);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="rf-preloader"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0A0A0A]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
          aria-hidden="true"
        >
          {/* soft gold spotlight behind crest */}
          <div className="absolute inset-0 spotlight-beam-gold pointer-events-none" />
          <div className="absolute inset-0 cinematic-vignette pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Shimmer sweep mask over the logo */}
            <div className="relative">
              <BrandLogo height={132} priority large />
              <div className="brand-shimmer-sweep pointer-events-none absolute inset-0" />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.7 }}
            className="relative mt-6 font-mono-tech text-[11px] tracking-[0.3em] uppercase text-[#D4AF37]"
          >
            Elite Private Club — Dhaka
          </motion.p>

          {/* thin gold loading bar */}
          <div className="relative mt-5 h-[2px] w-48 overflow-hidden rounded-full bg-[#1C1C1C]">
            <motion.div
              className="h-full bg-gradient-to-r from-[#8A6D1F] via-[#D4AF37] to-[#E8C766]"
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
