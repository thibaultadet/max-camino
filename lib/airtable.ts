export type Stage = {
  slug: string;
  title: string;
  date: string;
  km: number;
  denivele?: number;
  lat: number;
  lng: number;
  komoot_embed_url: string;
  has_station?: boolean;
};

/** Parse une date d’étape (ISO ou JJ/MM/AAAA) pour un tri fiable — pas un simple localeCompare. */
export function parseStageDateMs(dateStr: string): number {
  const t = dateStr.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (iso) return Date.UTC(+iso[1], +iso[2] - 1, +iso[3]);
  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(t);
  if (dmy) return Date.UTC(+dmy[3], +dmy[2] - 1, +dmy[1]);
  const ms = Date.parse(t);
  return Number.isNaN(ms) ? 0 : ms;
}

function parseDayNumberFromTitle(title: string): number | null {
  const m = /\bDay\s+(\d+)\b/i.exec(title);
  return m ? parseInt(m[1], 10) : null;
}

function parseEtapeIndexFromSlug(slug: string): number | null {
  const m = /etape-(\d+)/i.exec(slug.trim());
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Ordre d’itinéraire pour carte / liste : évite les tracés en « toile d’araignée »
 * quand les dates Airtable ne trient pas bien (formats ambigus) alors que les slugs
 * `etape-N` suivent le parcours réel.
 */
export function orderStagesForItinerary(stages: Stage[]): Stage[] {
  const copy = [...stages];
  if (copy.length <= 1) return copy;

  const etapeIndices = copy.map((s) => parseEtapeIndexFromSlug(s.slug));
  const allHaveEtape = etapeIndices.every((x) => x != null);
  const uniqueEtapes = new Set(etapeIndices.filter((x) => x != null)).size;
  if (allHaveEtape && uniqueEtapes === copy.length) {
    return copy.sort((a, b) => parseEtapeIndexFromSlug(a.slug)! - parseEtapeIndexFromSlug(b.slug)!);
  }

  return copy.sort((a, b) => {
    const c = parseStageDateMs(a.date) - parseStageDateMs(b.date);
    if (c !== 0) return c;
    const da = parseDayNumberFromTitle(a.title);
    const db = parseDayNumberFromTitle(b.title);
    if (da != null && db != null && da !== db) return da - db;
    return a.slug.localeCompare(b.slug);
  });
}

export type Registration = {
  id: string;
  name: string;
};

function airtableHeaders() {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    "Content-Type": "application/json",
  };
}

function baseUrl(table: string) {
  return `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${table}`;
}

export async function getStages(): Promise<Stage[]> {
  if (!process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_API_KEY) return [];

  const fields = "fields[]=slug&fields[]=title&fields[]=date&fields[]=km&fields[]=denivele&fields[]=lat&fields[]=lng&fields[]=komoot_embed_url&fields[]=has_station";
  const records: Stage[] = [];
  let offset: string | undefined;

  do {
    const url = `${baseUrl("Stages")}?${fields}${offset ? `&offset=${offset}` : ""}`;
    const res = await fetch(url, { headers: airtableHeaders(), cache: "no-store" });
    if (!res.ok) break;
    const data = await res.json();
    records.push(...(data.records ?? []).map((r: { fields: Stage }) => r.fields));
    offset = data.offset;
  } while (offset);

  return orderStagesForItinerary(records.filter((s) => s.slug));
}

export async function getRegistrationsForStage(slug: string): Promise<Registration[]> {
  if (!process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_API_KEY) return [];

  const formula = encodeURIComponent(`{stages}="${slug}"`);
  const url = `${baseUrl("Registrations")}?filterByFormula=${formula}&fields[]=name`;
  const res = await fetch(url, {
    headers: airtableHeaders(),
    next: { revalidate: 60 },
  });

  if (!res.ok) return [];
  const data = await res.json();
  return (data.records ?? []).map((r: { id: string; fields: { name?: string } }) => ({
    id: r.id,
    name: r.fields.name ?? "Anonyme",
  }));
}

export async function getAllRegistrationsByStage(): Promise<Record<string, string[]>> {
  if (!process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_API_KEY) return {};

  const result: Record<string, string[]> = {};
  let offset: string | undefined;

  do {
    const url = `${baseUrl("Registrations")}?fields[]=name&fields[]=stages${offset ? `&offset=${offset}` : ""}`;
    const res = await fetch(url, { headers: airtableHeaders(), next: { revalidate: 60 } });
    if (!res.ok) break;
    const data = await res.json();
    for (const r of data.records ?? []) {
      const name: string = r.fields.name ?? "Anonyme";
      const slug: string = r.fields.stages ?? "";
      if (!slug) continue;
      if (!result[slug]) result[slug] = [];
      result[slug].push(name);
    }
    offset = data.offset;
  } while (offset);

  return result;
}

export async function createRegistration(name: string, stages: string): Promise<void> {
  if (!process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_API_KEY)
    throw new Error("Airtable non configuré");

  const res = await fetch(baseUrl("Registrations"), {
    method: "POST",
    headers: airtableHeaders(),
    body: JSON.stringify({ fields: { name, stages } }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Erreur Airtable ${res.status}: ${body}`);
  }
}

export async function upsertStages(stages: Stage[]): Promise<void> {
  if (!process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_API_KEY)
    throw new Error("Airtable non configuré");

  // Airtable accepte max 10 records par requête
  for (let i = 0; i < stages.length; i += 10) {
    const batch = stages.slice(i, i + 10);
    const res = await fetch(baseUrl("Stages"), {
      method: "POST",
      headers: airtableHeaders(),
      body: JSON.stringify({ records: batch.map((s) => ({ fields: s })) }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Erreur Airtable ${res.status}: ${body}`);
    }
  }
}
