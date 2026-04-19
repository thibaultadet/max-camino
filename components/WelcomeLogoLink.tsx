"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

/** Durée de l’animation `public/animated-logo.gif` (lecture unique, ffprobe format=duration). */
const ANIMATED_LOGO_DURATION_MS = 5_920;
/** Même idée que pour le MP4 : éviter la fin trop sombre / décalage de lecture. */
const EARLY_END_MS = 120;

export default function WelcomeLogoLink() {
  const animationDoneRef = useRef(false);
  const [animationDone, setAnimationDone] = useState(false);
  const [logoReady, setLogoReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [gifLoaded, setGifLoaded] = useState(false);

  const markAnimationDone = useCallback(() => {
    if (animationDoneRef.current) return;
    animationDoneRef.current = true;
    setAnimationDone(true);
  }, []);

  useEffect(() => {
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduceMotion || !gifLoaded || animationDoneRef.current) return;
    const delay = Math.max(0, ANIMATED_LOGO_DURATION_MS - EARLY_END_MS);
    const id = window.setTimeout(markAnimationDone, delay);
    return () => window.clearTimeout(id);
  }, [reduceMotion, gifLoaded, markAnimationDone]);

  const showLogo = logoReady && (reduceMotion || animationDone);

  return (
    <Link
      href="/"
      className="relative mx-auto block min-h-48 w-full max-w-md flex-none bg-[var(--background)] sm:min-h-52 md:mx-0 md:min-h-0 md:max-w-none md:flex-1 md:basis-0 md:self-stretch md:min-w-0"
      aria-label="Accueil"
    >
      <Image
        src="/logo.png"
        alt=""
        fill
        className={`absolute inset-0 z-[1] bg-[var(--background)] object-contain object-center ${
          showLogo ? "opacity-100" : "opacity-0"
        }`}
        sizes="(max-width: 768px) min(100vw, 28rem), 45vw"
        priority
        onLoadingComplete={() => setLogoReady(true)}
      />
      {!reduceMotion && (
        <Image
          src="/animated-logo.gif"
          alt=""
          fill
          unoptimized
          className={`absolute inset-0 z-[2] bg-[var(--background)] object-contain object-center ${
            showLogo ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          sizes="(max-width: 768px) min(100vw, 28rem), 45vw"
          priority
          onLoadingComplete={() => setGifLoaded(true)}
          onError={markAnimationDone}
          aria-hidden={showLogo}
        />
      )}
    </Link>
  );
}
