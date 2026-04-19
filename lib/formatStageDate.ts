import { parseStageDateMs } from "./airtable";

/** Affichage lisible en français (ex. « 1er juin 2026 » selon le moteur). */
export function formatStageDateFr(dateStr: string): string {
  const t = dateStr.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  let d: Date;
  if (iso) {
    d = new Date(+iso[1], +iso[2] - 1, +iso[3]);
  } else {
    const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(t);
    if (dmy) {
      d = new Date(+dmy[3], +dmy[2] - 1, +dmy[1]);
    } else {
      const ms = parseStageDateMs(t);
      if (ms !== 0) d = new Date(ms);
      else {
        const parsed = Date.parse(t);
        d = Number.isNaN(parsed) ? new Date(NaN) : new Date(parsed);
      }
    }
  }
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
