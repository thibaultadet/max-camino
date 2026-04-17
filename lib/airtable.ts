export type Stage = {
  slug: string;
  title: string;
  date: string;
  km: number;
  lat: number;
  lng: number;
  komoot_embed_url: string;
  has_station?: boolean;
};

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

  const fields = "fields[]=slug&fields[]=title&fields[]=date&fields[]=km&fields[]=lat&fields[]=lng&fields[]=komoot_embed_url&fields[]=has_station";
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

  return records
    .filter((s) => s.slug)
    .sort((a, b) => a.date.localeCompare(b.date));
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
