"use client";

import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import type { Stage } from "@/lib/airtable";
import { shortTitle } from "@/lib/shortStageTitle";
import { register } from "@/app/actions";

type Props = {
  stages: Stage[];
  registrationsByStage: Record<string, string[]>;
};

const MD_MIN_WIDTH_PX = 768;

function subscribeMq(onChange: () => void) {
  const mq = window.matchMedia(`(min-width: ${MD_MIN_WIDTH_PX}px)`);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getSector(title: string): string {
  const match = title.match(/Secteur\s+(\d+)\s+-\s+([^-]+)/);
  if (!match) return "Autres";
  return `Secteur ${match[1]} — ${match[2].trim()}`;
}

function groupBySector(stages: Stage[]): { sector: string; stages: Stage[] }[] {
  const map = new Map<string, Stage[]>();
  for (const stage of stages) {
    const sector = getSector(stage.title);
    if (!map.has(sector)) map.set(sector, []);
    map.get(sector)!.push(stage);
  }
  return Array.from(map.entries()).map(([sector, stages]) => ({ sector, stages }));
}

export default function StagesList({ stages, registrationsByStage }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isDesktop = useSyncExternalStore(
    subscribeMq,
    () => window.matchMedia(`(min-width: ${MD_MIN_WIDTH_PX}px)`).matches,
    () => false
  );
  const rootRef = useRef<HTMLDivElement>(null);

  function toggle(slug: string) {
    if (done) setDone(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await register([...selected].join(","), name);
      setDone(true);
      setSelected(new Set());
      setName("");
    });
  }

  useEffect(() => {
    if (isDesktop || hoveredSlug == null) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-inscrits-interactive="true"]')) return;
      setHoveredSlug(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [hoveredSlug, isDesktop]);

  const groups = groupBySector(stages);

  return (
    <>
      <div ref={rootRef} className="divide-y divide-[var(--border)]">
        {groups.map(({ sector, stages: groupStages }) => (
          <div key={sector} className="py-10 first:pt-8 last:pb-8">
            <h2 className="mb-6 px-6 font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.28em] text-neutral-500 md:px-8">
              {sector}
            </h2>
            <ul className="divide-y divide-[var(--border)]">
              {groupStages.map((stage) => {
                const checked = selected.has(stage.slug);
                const closed = stage.registrations_closed ?? false;
                const names = registrationsByStage[stage.slug] ?? [];
                const dateObj = new Date(stage.date);
                const day = dateObj.getDate();
                const month = dateObj.toLocaleDateString("fr-FR", { month: "short" });
                const globalIndex = stages.indexOf(stage);
                const showStation = stage.has_station || stages[globalIndex + 1]?.has_station;

                return (
                  <li
                    key={stage.slug}
                    onClick={(e) => {
                      const target = e.target as HTMLElement | null;
                      if (closed) return;
                      if (target?.closest('[data-stage-interactive="true"], [data-inscrits-interactive="true"]')) {
                        return;
                      }
                      toggle(stage.slug);
                    }}
                    onMouseEnter={() => {
                      if (isDesktop) setHoveredSlug(stage.slug);
                    }}
                    onMouseLeave={() => {
                      if (isDesktop) setHoveredSlug(null);
                    }}
                    className={`relative group transition-colors duration-150 ${
                      closed
                        ? "cursor-not-allowed opacity-60"
                        : checked
                          ? "cursor-pointer bg-[var(--trail-soft)]"
                          : "cursor-pointer hover:bg-[var(--background-subtle)]"
                    }`}
                  >
                    <div className="flex items-center gap-4 px-5 py-5 md:gap-6 md:px-8">

                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={closed}
                        data-stage-interactive="true"
                        onChange={() => !closed && toggle(stage.slug)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-[var(--trail)] disabled:cursor-not-allowed"
                        aria-label={`Sélectionner ${shortTitle(stage.title)}`}
                      />

                      {/* Date */}
                      <div className="w-14 shrink-0 text-center md:w-16">
                        <div className="font-[family-name:var(--font-display)] text-[10px] font-semibold uppercase leading-none tracking-[0.2em] text-neutral-400">
                          {month}
                        </div>
                        <div className="mt-1 font-[family-name:var(--font-display)] text-3xl font-semibold leading-none tracking-[0.02em] text-[var(--foreground)]">
                          {day}
                        </div>
                      </div>

                      {/* Separator */}
                      <div className="h-12 w-px shrink-0 bg-[var(--border)]" />

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="font-[family-name:var(--font-display)] text-xs font-medium tabular-nums text-neutral-400">
                            {String(globalIndex + 1).padStart(2, "0")}
                          </span>
                          <p className="min-w-0 flex-1 truncate text-base font-semibold leading-snug text-neutral-900 transition-colors group-hover:text-[var(--trail)] md:text-lg">
                            {shortTitle(stage.title)}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-sm text-neutral-500">{stage.km} km</span>
                          {stage.denivele != null && (
                            <span className="text-sm text-neutral-500">↑ {stage.denivele} m</span>
                          )}
                          <Link
                            href={`/stages/${stage.slug}`}
                            data-stage-interactive="true"
                            onClick={(e) => e.stopPropagation()}
                            className="font-[family-name:var(--font-display)] text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--trail)] underline-offset-2 hover:underline"
                          >
                            + d'infos
                          </Link>
                          {closed ? (
                            <span className="inline-flex items-center border border-neutral-400 px-2 py-0.5 font-[family-name:var(--font-display)] text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                              Complet
                            </span>
                          ) : names.length > 0 && (
                            <span
                              role="button"
                              tabIndex={0}
                              data-inscrits-interactive="true"
                              onClick={(e) => {
                                if (isDesktop) return;
                                e.preventDefault();
                                e.stopPropagation();
                                setHoveredSlug((prev) => (prev === stage.slug ? null : stage.slug));
                              }}
                              onKeyDown={(e) => {
                                if (isDesktop) return;
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setHoveredSlug((prev) => (prev === stage.slug ? null : stage.slug));
                                }
                              }}
                              className="inline-flex items-center border border-[var(--trail)] px-2 py-0.5 font-[family-name:var(--font-display)] text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--trail)]"
                            >
                              {names.length} inscrit{names.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Gare */}
                      {showStation && (
                        <span className="hidden shrink-0 text-xl leading-none sm:inline-block" title="Étape avec gare">
                          🚉
                        </span>
                      )}
                    </div>

                    {/* Tooltip inscrits */}
                    {names.length > 0 && hoveredSlug === stage.slug && (
                      <div
                        data-inscrits-interactive="true"
                        className="absolute right-6 top-1/2 z-10 min-w-[160px] -translate-y-1/2 border border-[var(--border)] bg-white px-4 py-3 shadow-lg md:right-10"
                      >
                        <button
                          type="button"
                          aria-label="Fermer la liste des inscrits"
                          data-inscrits-interactive="true"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHoveredSlug(null);
                          }}
                          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center text-sm text-neutral-400 transition hover:text-neutral-800 md:hidden"
                        >
                          ✕
                        </button>
                        <p className="mb-2 font-[family-name:var(--font-display)] text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                          Inscrits
                        </p>
                        <ul className="space-y-1.5">
                          {names.map((n, i) => (
                            <li key={`${stage.slug}-${i}`} className="text-base font-medium text-[var(--trail)]">{n}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {(selected.size > 0 || done) && (
        <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4">
          <div className="relative border border-[var(--border)] bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
            <button
              type="button"
              onClick={() => { setSelected(new Set()); setDone(false); }}
              aria-label="Fermer"
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center text-neutral-400 transition hover:text-neutral-900"
            >
              ✕
            </button>
            {done ? (
              <p className="py-1 text-center text-base font-medium text-neutral-900">
                Parfait, on se voit sur les chemins ! 🎉
              </p>
            ) : (
              <>
                <p className="mb-4 font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
                  Inscription
                </p>
                <p className="mb-4 text-lg font-semibold text-neutral-900">
                  {selected.size} étape{selected.size > 1 ? "s" : ""} sélectionnée{selected.size > 1 ? "s" : ""}
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <label htmlFor="name-list" className="text-sm font-medium uppercase tracking-wide text-neutral-600">
                    Prénom et nom
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <input
                      id="name-list"
                      type="text"
                      placeholder="Jacques le Majeur, fils de Zébédée"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      minLength={2}
                      className="min-h-[48px] flex-1 border border-[var(--border)] bg-[var(--background-subtle)] px-4 py-3 text-lg text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="min-h-[48px] shrink-0 border border-[var(--foreground)] bg-[var(--foreground)] px-8 py-3 font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800 disabled:opacity-50"
                    >
                      {isPending ? "…" : "Je viens !"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
