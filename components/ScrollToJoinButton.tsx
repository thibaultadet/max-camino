"use client";

import type { MouseEvent } from "react";

const TARGET_ID = "rejoindre-chemin";

export default function ScrollToJoinButton() {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const el = document.getElementById(TARGET_ID);
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });

    window.history.replaceState(null, "", `#${TARGET_ID}`);
  }

  return (
    <p className="mt-10 flex justify-center">
      <a
        href={`#${TARGET_ID}`}
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-sm bg-neutral-900 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
      >
        Me rejoindre sur le chemin
        <svg
          className="h-5 w-5 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </a>
    </p>
  );
}
