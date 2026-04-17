"use client";

import { useState, useTransition } from "react";
import { register } from "@/app/actions";

export default function RegisterForm({ stages }: { stages: string }) {
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

  if (done) {
    return (
      <p className="text-[#e07b00] font-semibold py-3">
        C&apos;est noté ! Max te contactera pour confirmer. 🎉
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="name" className="text-sm font-medium text-gray-600">
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
        className="flex-1 border border-amber-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e07b00] bg-white"
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-[#e07b00] hover:bg-[#c45e00] disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition"
      >
        {isPending ? "…" : "Je viens !"}
      </button>
      </div>
    </form>
  );
}
