"use server";

import { revalidatePath } from "next/cache";
import { createRegistration, getStages } from "@/lib/airtable";

export async function register(stages: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) throw new Error("Nom invalide");

  const slugs = stages.split(",").map((s) => s.trim()).filter(Boolean);
  const allStages = await getStages();
  const slugToId = Object.fromEntries(allStages.map((s) => [s.slug, s._id]));

  await Promise.all(
    slugs.map((slug) => {
      const recordId = slugToId[slug];
      if (!recordId) throw new Error(`Étape introuvable : ${slug}`);
      return createRegistration(trimmed, recordId);
    })
  );
  slugs.forEach((slug) => revalidatePath(`/stages/${slug}`));
  revalidatePath("/");
}
