"use client";

import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";

const AUTOPLAY_MS = 10_000;

type PhotoCarouselProps = {
  imagePaths: string[];
  /** `hero` : bandeau plein écran type lookbook (hauteur viewport). */
  variant?: "default" | "hero";
};

export default function PhotoCarousel({ imagePaths, variant = "default" }: PhotoCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: imagePaths.length > 1 });
  const emblaApiRef = useRef(emblaApi);
  const emblaReady = Boolean(emblaApi);

  useEffect(() => {
    emblaApiRef.current = emblaApi;
  }, [emblaApi]);

  const timeoutRef = useRef<number | null>(null);
  const scheduleAutoplayRef = useRef(() => {});

  useEffect(() => {
    scheduleAutoplayRef.current = () => {
      if (imagePaths.length <= 1) return;
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        emblaApiRef.current?.scrollNext();
        scheduleAutoplayRef.current();
      }, AUTOPLAY_MS);
    };
  }, [imagePaths.length]);

  useEffect(() => {
    if (!emblaReady || imagePaths.length <= 1) return;
    scheduleAutoplayRef.current();
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [emblaReady, imagePaths.length]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
    scheduleAutoplayRef.current();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
    scheduleAutoplayRef.current();
  }, [emblaApi]);

  if (imagePaths.length === 0) return null;

  const isHero = variant === "hero";

  return (
    <section
      className={
        isHero
          ? "flex h-[min(64dvh,780px)] max-h-[780px] w-full shrink-0 flex-col"
          : "mb-10 w-full"
      }
      aria-label="Photos du parcours"
    >
      <div
        className={
          isHero
            ? "group/carousel relative min-h-0 flex-1 overflow-hidden border-y border-neutral-200 bg-neutral-100 md:border-x md:border-y-0"
            : "group/carousel relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-sm"
        }
        ref={emblaRef}
      >
        <div className={isHero ? "flex h-full" : "flex"}>
          {imagePaths.map((src, index) => (
            <div
              className={
                isHero
                  ? "h-full min-w-0 shrink-0 grow-0 basis-full"
                  : "min-w-0 shrink-0 grow-0 basis-full"
              }
              key={src}
            >
              <div
                className={
                  isHero
                    ? "relative h-full min-h-[10rem] w-full"
                    : "relative aspect-[4/3] w-full"
                }
              >
                <Image
                  src={src}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, min(1400px, 100vw)"
                  priority={index === 0}
                  draggable={false}
                />
              </div>
            </div>
          ))}
        </div>

        {imagePaths.length > 1 ? (
          <>
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Photo précédente"
              className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white opacity-70 shadow-sm backdrop-blur-[2px] transition-opacity duration-200 hover:bg-black/40 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 md:left-3 md:h-10 md:w-10 md:opacity-45 md:group-hover/carousel:opacity-80"
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Photo suivante"
              className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white opacity-70 shadow-sm backdrop-blur-[2px] transition-opacity duration-200 hover:bg-black/40 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 md:right-3 md:h-10 md:w-10 md:opacity-45 md:group-hover/carousel:opacity-80"
            >
              <ChevronIcon direction="right" />
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden
      className="h-5 w-5 md:h-6 md:w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      {direction === "left" ? (
        <path d="M15 18l-6-6 6-6" />
      ) : (
        <path d="M9 18l6-6-6-6" />
      )}
    </svg>
  );
}
