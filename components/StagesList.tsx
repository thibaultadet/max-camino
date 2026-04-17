"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Stage } from "@/lib/airtable";
import { register } from "@/app/actions";

type Props = {
  stages: Stage[];
  registrationsByStage: Record<string, string[]>;
};

export function shortTitle(title: string): string {
  const match = title.match(/from (.+)$/i);
  return match ? match[1].replace(" to ", " → ") : title;
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

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
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

  const groups = groupBySector(stages);

  return (
    <>
      <div className="space-y-10">
        {groups.map(({ sector, stages: groupStages }) => (
          <div key={sector}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">
              {sector}
            </h2>
            <ul className="space-y-1">
              {groupStages.map((stage, index) => {
                const checked = selected.has(stage.slug);
                const names = registrationsByStage[stage.slug] ?? [];
                const dateObj = new Date(stage.date);
                const day = dateObj.getDate();
                const month = dateObj.toLocaleDateString("fr-FR", { month: "short" });
                const globalIndex = stages.indexOf(stage);
                const showStation = stage.has_station || stages[globalIndex + 1]?.has_station;

                return (
                  <li
                    key={stage.slug}
                    onMouseEnter={() => setHoveredSlug(stage.slug)}
                    onMouseLeave={() => setHoveredSlug(null)}
                    className={`relative group rounded-xl transition-all duration-150 ${
                      checked ? "bg-amber-50 ring-1 ring-amber-200" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-4 px-4 py-4">

                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(stage.slug)}
                        className="w-5 h-5 accent-[#e07b00] cursor-pointer flex-shrink-0"
                      />

                      {/* Date */}
                      <div className="flex-shrink-0 w-12 text-center">
                        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest leading-none">
                          {month}
                        </div>
                        <div className="text-2xl font-bold text-[#c45e00] leading-tight">{day}</div>
                      </div>

                      {/* Separator */}
                      <div className="w-px h-10 bg-amber-100 flex-shrink-0" />

                      {/* Content */}
                      <Link href={`/stages/${stage.slug}`} className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-300">#{globalIndex + 1}</span>
                          <p className="text-base font-semibold text-[#1a1a1a] truncate group-hover:text-[#e07b00] transition-colors">
                            {shortTitle(stage.title)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-sm text-gray-400">{stage.km} km</span>
                          {names.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#c45e00] bg-amber-50 px-2 py-0.5 rounded-full">
                              {names.length} inscrit{names.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Gare */}
                      {showStation && (
                        <span className="flex-shrink-0 text-sm font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full whitespace-nowrap">
                          🚆 Gare
                        </span>
                      )}
                    </div>

                    {/* Tooltip inscrits */}
                    {names.length > 0 && hoveredSlug === stage.slug && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2 z-10 bg-white border border-amber-100 rounded-xl shadow-xl px-4 py-3 min-w-[140px]">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Inscrits</p>
                        <ul className="space-y-1">
                          {names.map((n, i) => (
                            <li key={`${stage.slug}-${i}`} className="text-sm font-medium text-[#1a1a1a]">{n}</li>
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

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl p-4">
            {done ? (
              <p className="text-center text-[#e07b00] font-semibold py-2">
                C&apos;est noté ! Max te contactera. 🎉
              </p>
            ) : (
              <>
                <p className="text-base font-semibold text-[#1a1a1a] mb-3">
                  {selected.size} étape{selected.size > 1 ? "s" : ""} sélectionnée{selected.size > 1 ? "s" : ""}
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                  <label htmlFor="name-list" className="text-sm font-medium text-gray-600">
                    Prénom et nom
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="name-list"
                      type="text"
                      placeholder="Jacques le Majeur, fils de Zébédée"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      minLength={2}
                      className="flex-1 border border-amber-200 rounded-lg px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-[#e07b00]"
                    />
                    <button
                      type="submit"
                      disabled={isPending}
                      className="bg-[#e07b00] hover:bg-[#c45e00] disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-base transition"
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
