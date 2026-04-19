"use client";

import { useLayoutEffect, useState } from "react";
import type { Stage } from "@/lib/airtable";
import StagesList from "./StagesList";
import StagesCalendar from "./StagesCalendar";

/** Aligné sur le breakpoint Tailwind `md` (desktop). */
const MD_MIN_WIDTH_PX = 768;

type Props = {
  stages: Stage[];
  registrationsByStage: Record<string, string[]>;
};

export default function ViewToggle({ stages, registrationsByStage }: Props) {
  const [view, setView] = useState<"list" | "calendar">("list");

  useLayoutEffect(() => {
    const mq = window.matchMedia(`(min-width: ${MD_MIN_WIDTH_PX}px)`);
    setView(mq.matches ? "calendar" : "list");
  }, []);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-6 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <p className="max-w-lg text-sm leading-relaxed text-neutral-600">
          {view === "list"
            ? "Coche les étapes qui t'intéressent puis clique sur le bouton pour t'inscrire."
            : "Clique sur un jour pour voir le détail de l'étape."}
        </p>
        <div
          className="inline-flex w-full shrink-0 gap-0 border border-[var(--border)] bg-[var(--background-subtle)] p-0 sm:w-auto"
          role="tablist"
          aria-label="Affichage des étapes"
        >
          <button
            type="button"
            role="tab"
            aria-selected={view === "list"}
            onClick={() => setView("list")}
            className={`flex-1 px-5 py-3 font-[family-name:var(--font-display)] text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors sm:flex-none sm:min-w-[8rem] ${
              view === "list"
                ? "bg-[var(--foreground)] text-white"
                : "text-neutral-500 hover:bg-white/60 hover:text-neutral-800"
            }`}
          >
            Liste
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "calendar"}
            onClick={() => setView("calendar")}
            className={`flex-1 border-l border-[var(--border)] px-5 py-3 font-[family-name:var(--font-display)] text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors sm:flex-none sm:min-w-[8rem] ${
              view === "calendar"
                ? "bg-[var(--foreground)] text-white"
                : "text-neutral-500 hover:bg-white/60 hover:text-neutral-800"
            }`}
          >
            Calendrier
          </button>
        </div>
      </div>

      <div className="border border-[var(--border)] bg-white">
        {view === "list" ? (
          <StagesList stages={stages} registrationsByStage={registrationsByStage} />
        ) : (
          <StagesCalendar stages={stages} registrationsByStage={registrationsByStage} />
        )}
      </div>
    </div>
  );
}
