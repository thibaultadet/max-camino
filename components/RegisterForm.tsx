"use client";

import { useState, useTransition } from "react";
import { register } from "@/app/actions";

export default function RegisterForm({ stages, closed }: { stages: string; closed?: boolean }) {
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await register(stages, name);
      setDone(true);
      setName("");
    });
  }

  if (closed) {
    return (
      <p className="py-3 text-sm font-semibold text-neutral-500">
        Les inscriptions pour cette étape sont fermées.
      </p>
    );
  }

  if (done) {
    return (
      <p className="py-3 font-semibold text-neutral-900">
        Parfait, on se voit sur les chemins ! 🎉
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="name" className="text-sm font-medium text-neutral-600">
        Prénom et nom
      </label>
      <div className="flex gap-2">
        <input
          id="name"
          type="text"
          placeholder="Jacques le Majeur, fils de Zébédée"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          className="flex-1 rounded-sm border border-neutral-300 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-sm bg-neutral-900 px-5 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {isPending ? "…" : "Je viens !"}
        </button>
      </div>
    </form>
  );
}
