"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
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

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export default function StagesCalendar({ stages, registrationsByStage }: Props) {
  const firstDate = new Date(stages[0]?.date ?? "2026-06-01");
  const [year, setYear] = useState(firstDate.getFullYear());
  const [month, setMonth] = useState(firstDate.getMonth());
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

  const stageByDate = Object.fromEntries(stages.map((s) => [s.date, s]));

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

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
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

  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <>
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between gap-3 pb-4">
          <button
            type="button"
            onClick={prevMonth}
            className="flex items-center gap-2 border border-transparent px-2 py-2 font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 transition hover:border-[var(--border)] hover:bg-[var(--background-subtle)] hover:text-neutral-800"
          >
            <span className="text-lg leading-none" aria-hidden>‹</span>
            <span className="hidden sm:inline">Précédent</span>
          </button>
          <h2 className="text-center font-[family-name:var(--font-display)] text-2xl font-semibold uppercase tracking-[0.12em] text-neutral-900 md:text-3xl">
            {MONTHS[month]} <span className="font-normal text-neutral-500">{year}</span>
          </h2>
          <button
            type="button"
            onClick={nextMonth}
            className="flex items-center gap-2 border border-transparent px-2 py-2 font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 transition hover:border-[var(--border)] hover:bg-[var(--background-subtle)] hover:text-neutral-800"
          >
            <span className="hidden sm:inline">Suivant</span>
            <span className="text-lg leading-none" aria-hidden>›</span>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px border border-[var(--border)] bg-[var(--border)]">
          {DAYS.map((d) => (
            <div
              key={d}
              className="bg-[var(--foreground)] px-1 py-2.5 text-center font-[family-name:var(--font-display)] text-[10px] font-semibold uppercase tracking-[0.28em] text-white"
            >
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (!day) {
              return (
                <div key={i} className="min-h-[116px] bg-[var(--background-subtle)]/60 md:min-h-[132px]" />
              );
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const stage = stageByDate[dateStr];
            const names = stage ? (registrationsByStage[stage.slug] ?? []) : [];
            const isToday = new Date().toISOString().slice(0, 10) === dateStr;
            const checked = stage ? selected.has(stage.slug) : false;
            const closed = stage?.registrations_closed ?? false;

            if (!stage) {
              return (
                <div
                  key={i}
                  className={`relative flex min-h-[116px] flex-col bg-white p-1.5 md:min-h-[132px] md:p-2 ${
                    isToday ? "ring-2 ring-inset ring-[var(--trail)]" : ""
                  }`}
                >
                  <span className="font-[family-name:var(--font-display)] text-base font-medium tabular-nums text-neutral-300">
                    {day}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={i}
                role="button"
                tabIndex={0}
                aria-pressed={checked}
                aria-label={`${checked ? "Désélectionner" : "Sélectionner"} ${shortTitle(stage.title)}, le ${dateStr}`}
                onClick={() => { if (!closed) { toggle(stage.slug); setHoveredSlug(null); } }}
                onKeyDown={(e) => {
                  if (!closed && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    toggle(stage.slug);
                  }
                }}
                onMouseEnter={() => {
                  if (isDesktop) setHoveredSlug(stage.slug);
                }}
                onMouseLeave={() => {
                  if (isDesktop) setHoveredSlug(null);
                }}
                className={`relative flex min-h-[116px] flex-col bg-white p-1.5 text-left transition-colors md:min-h-[132px] md:p-2 ${
                  closed
                    ? "cursor-not-allowed opacity-60"
                    : checked
                      ? "cursor-pointer bg-[var(--trail-soft)] ring-2 ring-inset ring-[var(--trail)]"
                      : stage.has_station
                        ? "cursor-pointer hover:bg-[color-mix(in_srgb,var(--trail-soft)_75%,white)]"
                        : "cursor-pointer hover:bg-[var(--background-subtle)]"
                } ${isToday && !checked ? "ring-2 ring-inset ring-neutral-900/20" : ""}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="font-[family-name:var(--font-display)] text-base font-semibold tabular-nums text-neutral-900">
                    {day}
                  </span>
                  <Link
                    href={`/stages/${stage.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 font-[family-name:var(--font-display)] text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--trail)] underline-offset-2 hover:underline"
                  >
                    + d'infos
                  </Link>
                </div>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-neutral-900 md:text-base">
                  {shortTitle(stage.title)}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0">
                  <span className="text-xs text-neutral-500 md:text-sm">{stage.km} km</span>
                  {stage.denivele != null && (
                    <span className="text-xs text-neutral-500 md:text-sm">↑{stage.denivele} m</span>
                  )}
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                  {stage.has_station && (
                    <span className="text-2xl leading-none" title="Étape avec gare">🚉</span>
                  )}
                  {closed ? (
                    <span className="inline-flex items-center border border-neutral-400 px-1.5 py-0.5 font-[family-name:var(--font-display)] text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                      Complet
                    </span>
                  ) : names.length > 0 && (
                    <span
                      role="button"
                      tabIndex={0}
                      data-inscrits-interactive="true"
                      onClick={(e) => {
                        if (isDesktop) return;
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
                      className="inline-flex items-center border border-[var(--trail)] px-1.5 py-0.5 font-[family-name:var(--font-display)] text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--trail)]"
                    >
                      {names.length} inscrit{names.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {names.length > 0 && hoveredSlug === stage.slug && (
                  <div
                    data-inscrits-interactive="true"
                    className="absolute left-0 top-full z-10 mt-0.5 min-w-[160px] border border-[var(--border)] bg-white px-4 py-3 shadow-lg"
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
                      {names.map((n, j) => (
                        <li key={j} className="text-base font-medium text-[var(--trail)]">{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
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
                  <label htmlFor="name-cal" className="text-sm font-medium uppercase tracking-wide text-neutral-600">
                    Prénom et nom
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <input
                      id="name-cal"
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
