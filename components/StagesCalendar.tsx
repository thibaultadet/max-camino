"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Stage } from "@/lib/airtable";
import { shortTitle } from "./StagesList";
import { register } from "@/app/actions";

type Props = {
  stages: Stage[];
  registrationsByStage: Record<string, string[]>;
};

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

export default function StagesCalendar({ stages, registrationsByStage }: Props) {
  const firstDate = new Date(stages[0]?.date ?? "2026-06-01");
  const [year, setYear] = useState(firstDate.getFullYear());
  const [month, setMonth] = useState(firstDate.getMonth());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const stageByDate = Object.fromEntries(stages.map((s) => [s.date, s]));

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

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

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
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-sm transition">
          <span>‹</span><span className="hidden sm:inline">Mois précédent</span>
        </button>
        <h2 className="text-base font-bold text-[#1a1a1a] tracking-wide">
          {MONTHS[month]} {year}
        </h2>
        <button onClick={nextMonth} className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-gray-500 text-sm transition">
          <span className="hidden sm:inline">Mois suivant</span><span>›</span>
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-bold uppercase tracking-widest text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const stage = stageByDate[dateStr];
          const names = stage ? (registrationsByStage[stage.slug] ?? []) : [];
          const isToday = new Date().toISOString().slice(0, 10) === dateStr;
          const checked = stage ? selected.has(stage.slug) : false;

          if (!stage) {
            return (
              <div key={i} className={`min-h-[100px] rounded-xl flex items-start p-2 ${isToday ? "ring-2 ring-[#e07b00]" : ""}`}>
                <span className="text-sm text-gray-300 font-medium">{day}</span>
              </div>
            );
          }

          return (
            <div
              key={i}
              className={`relative min-h-[100px] rounded-xl p-2 flex flex-col gap-1 transition cursor-pointer ${
                checked
                  ? "ring-2 ring-[#e07b00] bg-amber-50"
                  : stage.has_station
                    ? "bg-[#0ac5b2]/10 border border-[#0ac5b2]/40 hover:bg-[#0ac5b2]/20"
                    : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
              } ${isToday ? "ring-2 ring-[#e07b00]" : ""}`}
              onClick={() => toggle(stage.slug)}
              onMouseEnter={() => setHoveredSlug(stage.slug)}
              onMouseLeave={() => setHoveredSlug(null)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#c45e00]">{day}</span>
                <Link
                  href={`/stages/${stage.slug}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] font-semibold text-[#e07b00] hover:underline bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded transition"
                >
                  Voir →
                </Link>
              </div>
              <p className="text-[11px] font-semibold text-[#1a1a1a] leading-tight line-clamp-2">
                {shortTitle(stage.title)}
              </p>
              <div className="mt-auto flex flex-wrap gap-1">
                <span className="text-[10px] text-gray-400">{stage.km} km</span>
                {stage.has_station && (
                  <span className="text-[10px] font-semibold text-[#078a7d] bg-[#0ac5b2]/20 px-1 rounded">🚆</span>
                )}
                {names.length > 0 && (
                  <span className="text-[10px] font-semibold text-[#c45e00] bg-amber-50 px-1 rounded">
                    {names.length} inscrit{names.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {names.length > 0 && hoveredSlug === stage.slug && (
                <div className="absolute top-full left-0 z-10 mt-1 bg-white border border-amber-100 rounded-xl shadow-xl px-4 py-3 min-w-[140px]">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Inscrits</p>
                  <ul className="space-y-1">
                    {names.map((n, j) => (
                      <li key={j} className="text-sm font-medium text-[#1a1a1a]">{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>

    {/* Floating registration panel */}
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
                <label htmlFor="name-cal" className="text-sm font-medium text-gray-600">Prénom et nom</label>
                <div className="flex gap-2">
                  <input
                    id="name-cal"
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
