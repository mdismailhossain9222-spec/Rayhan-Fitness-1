"use client";

import React from "react";

interface BrandLogoProps {
  /** Rendered height in px — width auto-scales to preserve aspect ratio */
  height?: number;
  className?: string;
  /** Eager load for above-the-fold (navbar / preloader) */
  priority?: boolean;
  /** Use the larger retina asset (preloader / footer seal) */
  large?: boolean;
}

/**
 * Official Rayhan Fitness brand mark — gold metallic crest
 * (crown + RAYHAN wordmark + twin winged lions + FITNESS ribbon).
 * Served as size-optimized WebP with PNG fallback. The artwork sits on a
 * pure black plate, so `mix-blend-screen` drops the black out and lets it
 * melt seamlessly into the dark cinematic theme with a soft gold glow.
 */
export default function BrandLogo({
  height = 48,
  className = "",
  priority = false,
  large = false,
}: BrandLogoProps) {
  const webp = large
    ? "/images/rayhan-fitness-logo-lg.webp"
    : "/images/rayhan-fitness-logo-nav.webp";
  const png = large
    ? "/images/rayhan-fitness-logo-lg.png"
    : "/images/rayhan-fitness-logo-nav.png";

  return (
    <picture className={`block shrink-0 ${className}`}>
      <source srcSet={webp} type="image/webp" />
      <img
        src={png}
        alt="Rayhan Fitness — Elite Private Gym Dhaka"
        width={Math.round(height * 1.47)}
        height={height}
        style={{ height, width: "auto" }}
        className="brand-logo-glow block object-contain"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        draggable={false}
      />
    </picture>
  );
}
