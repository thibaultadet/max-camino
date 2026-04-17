"use server";

import { revalidatePath } from "next/cache";
import { createRegistration } from "@/lib/airtable";

export async function register(stages: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length < 2) throw new Error("Nom invalide");

  const slugs = stages.split(",").map((s) => s.trim()).filter(Boolean);
  await Promise.all(slugs.map((slug) => createRegistration(trimmed, slug)));
  slugs.forEach((slug) => revalidatePath(`/stages/${slug}`));
  revalidatePath("/");
}
