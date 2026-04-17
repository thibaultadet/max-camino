/**
 * Importe toutes les étapes Komoot dans Airtable (table "Stages").
 * Vide la table avant d'importer pour éviter les doublons.
 * Usage : node scripts/fetch-stages.mjs
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = join(__dirname, "../.env.local");
try {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  }
} catch {}

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const API_KEY = process.env.AIRTABLE_API_KEY;

if (!BASE_ID || !API_KEY) {
  console.error("❌ AIRTABLE_BASE_ID ou AIRTABLE_API_KEY manquant dans .env.local");
  process.exit(1);
}

// Secteurs dans l'ordre géographique du chemin
const COLLECTION_URLS = [
  "https://www.komoot.com/fr-fr/collection/3947255/-compostelle-vdmb-secteur-1-aravis",
  "https://www.komoot.com/fr-fr/collection/3947175/-compostelle-vdmb-secteur-2-traversee-des-bauges",
  "https://www.komoot.com/fr-fr/collection/3947410/-compostelle-vdmb-secteur-3-chartreuse",
  "https://www.komoot.com/fr-fr/collection/3948216/-compostelle-vdmb-secteur-4-vercors",
  "https://www.komoot.com/fr-fr/collection/3948253/-compostelle-vdmb-secteur-5-monts-d-ardeche",
  "https://www.komoot.com/fr-fr/collection/3948380/-compostelle-vdmb-secteur-6-cevennes",
  "https://www.komoot.com/fr-fr/collection/3948447/-compostelle-vdmb-secteur-7-haut-languedoc",
  "https://www.komoot.com/fr-fr/collection/3948479/-compostelle-vdmb-secteur-8-voie-du-piemont",
  "https://www.komoot.com/fr-fr/collection/3948512/-compostelle-vdmb-secteur-9-pyrenees-ossau",
  "https://www.komoot.com/fr-fr/collection/3960958/-compostelle-vdmb-secteur-10-pays-basque-espagnol-voie-du-milieu",
  "https://www.komoot.com/fr-fr/collection/3961168/-compostelle-vdmb-secteur-11-picos-de-europa-fin",
];

const START_DATE = new Date("2026-06-01");

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};

function airtableUrl(table) {
  return `https://api.airtable.com/v0/${BASE_ID}/${table}`;
}

async function pause(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

async function clearTable() {
  console.log("Vidage de la table Stages...");
  let offset;
  const ids = [];
  do {
    const url = airtableUrl("Stages") + `?fields[]=slug${offset ? `&offset=${offset}` : ""}`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    ids.push(...(data.records ?? []).map((r) => r.id));
    offset = data.offset;
  } while (offset);

  for (let i = 0; i < ids.length; i += 10) {
    const batch = ids.slice(i, i + 10);
    const params = batch.map((id) => `records[]=${id}`).join("&");
    await fetch(`${airtableUrl("Stages")}?${params}`, { method: "DELETE", headers });
    await pause();
  }
  console.log(`  ${ids.length} enregistrements supprimés`);
}

async function fetchTourIds(collectionUrl) {
  const res = await fetch(collectionUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  const html = await res.text();
  const ids = [...new Set([...html.matchAll(/\/tour\/(\d+)/g)].map((m) => m[1]))];
  return ids;
}

async function fetchTour(id) {
  const res = await fetch(`https://www.komoot.com/api/v007/tours/${id}`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`Tour ${id} introuvable (${res.status})`);
  return res.json();
}

async function pushToAirtable(stages) {
  for (let i = 0; i < stages.length; i += 10) {
    const batch = stages.slice(i, i + 10);
    const res = await fetch(airtableUrl("Stages"), {
      method: "POST",
      headers,
      body: JSON.stringify({ records: batch.map((s) => ({ fields: s })) }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable error: ${body}`);
    }
    await pause();
  }
}

async function main() {
  await clearTable();

  const allTourIds = [];
  for (const url of COLLECTION_URLS) {
    const name = url.split("/").pop();
    process.stdout.write(`Collecte ${name}... `);
    const ids = await fetchTourIds(url);
    console.log(`${ids.length} tours`);
    allTourIds.push(...ids);
    await pause();
  }

  console.log(`\nRécupération de ${allTourIds.length} tours Komoot...`);
  const stages = [];

  for (let i = 0; i < allTourIds.length; i++) {
    const id = allTourIds[i];
    try {
      const tour = await fetchTour(id);
      const date = new Date(START_DATE);
      date.setDate(date.getDate() + i);
      stages.push({
        slug: `etape-${i + 1}`,
        title: tour.name,
        date: date.toISOString().split("T")[0],
        km: Math.round((tour.distance / 1000) * 10) / 10,
        lat: tour.start_point.lat,
        lng: tour.start_point.lng,
        komoot_embed_url: `https://www.komoot.com/tour/${id}/embed`,
      });
      process.stdout.write(`  [${i + 1}/${allTourIds.length}] ${tour.name}\n`);
    } catch (e) {
      console.error(`  ❌ Tour ${id}: ${e.message}`);
    }
    await pause();
  }

  console.log(`\nEnvoi vers Airtable (${stages.length} étapes)...`);
  await pushToAirtable(stages);
  console.log(`\n✓ ${stages.length} étapes importées dans Airtable`);
}

main().catch(console.error);
