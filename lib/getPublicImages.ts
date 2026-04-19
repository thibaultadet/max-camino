import fs from "fs";
import path from "path";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

/** Paths under `/public/photos`, URL-encoded for Next/Image `src` (espaces, accents, etc.). */
export function getPublicImagePaths(): string[] {
  const dir = path.join(process.cwd(), "public", "photos");
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((name) => !name.startsWith("."))
    .filter((name) => IMAGE_EXT.test(name))
    .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }))
    .map((name) => `/photos/${encodeURIComponent(name)}`);
}
