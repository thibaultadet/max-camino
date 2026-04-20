"use client";

import { useState, useTransition } from "react";
import { submitPrayerIntention } from "@/app/actions";

export default function PrayerIntentionForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [intention, setIntention] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await submitPrayerIntention(name, intention);
        setDone(true);
        setName("");
        setIntention("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
      }
    });
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-6">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 border border-neutral-300 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-neutral-700 transition hover:border-neutral-900 hover:text-neutral-900"
        >
          <span>🙏</span>
          Confier une intention de prière
        </button>
      ) : (
        <div className="w-full max-w-lg border border-[var(--border)] bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <p className="font-[family-name:var(--font-display)] text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
              Intention de prière
            </p>
            <button
              type="button"
              onClick={() => { setOpen(false); setDone(false); setError(null); }}
              aria-label="Fermer"
              className="flex h-7 w-7 items-center justify-center text-neutral-400 transition hover:text-neutral-900"
            >
              ✕
            </button>
          </div>

          {done ? (
            <p className="py-2 text-center text-sm font-medium text-neutral-900">
              Merci, je prierai pour vous sur le chemin ! 🙏
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="prayer-name" className="text-xs font-medium uppercase tracking-wide text-neutral-600">
                  Prénom et nom
                </label>
                <input
                  id="prayer-name"
                  type="text"
                  placeholder="Votre nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  className="min-h-[44px] border border-[var(--border)] bg-[var(--background-subtle)] px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

<div className="flex flex-col gap-1.5">
                <label htmlFor="prayer-intention" className="text-xs font-medium uppercase tracking-wide text-neutral-600">
                  Votre intention
                </label>
                <textarea
                  id="prayer-intention"
                  placeholder="Confiez-moi votre intention de prière…"
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  required
                  minLength={5}
                  rows={4}
                  className="resize-none border border-[var(--border)] bg-[var(--background-subtle)] px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="min-h-[44px] border border-[var(--foreground)] bg-[var(--foreground)] px-8 py-2.5 font-[family-name:var(--font-display)] text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800 disabled:opacity-50"
              >
                {isPending ? "…" : "Envoyer"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
