"use client";

import { useState } from "react";
import type { Stage } from "@/lib/airtable";
import StagesList from "./StagesList";
import StagesCalendar from "./StagesCalendar";

type Props = {
  stages: Stage[];
  registrationsByStage: Record<string, string[]>;
};

export default function ViewToggle({ stages, registrationsByStage }: Props) {
  const [view, setView] = useState<"list" | "calendar">("calendar");

  return (
    <div>
      <div className="flex items-center justify-between mt-10 mb-4">
        <p className="text-sm text-gray-400">
          {view === "list"
            ? "Coche les étapes qui t'intéressent puis clique sur le bouton pour t'inscrire."
            : "Clique sur un jour pour voir le détail de l'étape."}
        </p>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView("list")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              view === "list" ? "bg-white text-[#1a1a1a] shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Liste
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              view === "calendar" ? "bg-white text-[#1a1a1a] shadow-sm" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Calendrier
          </button>
        </div>
      </div>

      {view === "list"
        ? <StagesList stages={stages} registrationsByStage={registrationsByStage} />
        : <StagesCalendar stages={stages} registrationsByStage={registrationsByStage} />
      }
    </div>
  );
}
