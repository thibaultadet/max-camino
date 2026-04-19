"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { useMemo } from "react";
import IgnPlanTileLayer from "@/components/IgnPlanTileLayer";
import { formatStageDateFr } from "@/lib/formatStageDate";
import { shortTitle } from "@/lib/shortStageTitle";
import { orderStagesForItinerary, type Stage } from "@/lib/airtable";
import { CircleMarker, MapContainer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";

const DEPART_ICON_URL = "/coquille-depart.png";
/** Anneau blanc minimal autour de l’icône (icône inchangée). */
const DEPART_MARKER_OUTER = 36;
const DEPART_MARKER_IMG = 32;

/** Marqueur départ : PNG coquille sur pastille blanche (public/coquille-depart.png). */
const departMarkerIcon = L.divIcon({
  className: "map-emoji-marker",
  html: `<div style="width:${DEPART_MARKER_OUTER}px;height:${DEPART_MARKER_OUTER}px;background:#fff;border-radius:9999px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.22)">
    <img src="${DEPART_ICON_URL}" alt="" width="${DEPART_MARKER_IMG}" height="${DEPART_MARKER_IMG}" style="width:${DEPART_MARKER_IMG}px;height:${DEPART_MARKER_IMG}px;object-fit:contain;display:block" />
  </div>`,
  iconAnchor: [DEPART_MARKER_OUTER / 2, DEPART_MARKER_OUTER / 2],
  popupAnchor: [0, -Math.round(DEPART_MARKER_OUTER * 0.42)],
});

function arriveeIcon() {
  const s = 32;
  return L.divIcon({
    className: "map-emoji-marker",
    html: `<div style="width:${s}px;height:${s}px;display:flex;align-items:center;justify-content:center;font-size:26px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.55))">🏁</div>`,
    iconAnchor: [s / 2, s / 2],
    popupAnchor: [0, -16],
  });
}

/** Hex alignés sur `globals.css` (--map-station-*) pour Leaflet (SVG). */
const STATION_STROKE = "#1a5c3d";
const STATION_FILL = "#2f7d57";

/** Étapes sans gare : vert clair (distinct du disque gare). */
const STEP_STROKE = "#5dac78";
const STEP_FILL = "#c4e8d0";

function markerStyle(stage: Stage) {
  if (stage.has_station) {
    return {
      radius: 5,
      pathOptions: {
        color: STATION_STROKE,
        fillColor: STATION_FILL,
        fillOpacity: 1,
        weight: 1.5,
      },
    };
  }
  return {
    radius: 3,
    pathOptions: {
      color: STEP_STROKE,
      fillColor: STEP_FILL,
      fillOpacity: 1,
      weight: 1,
    },
  };
}

export default function StagesMap({ stages }: { stages: Stage[] }) {
  const routeStages = useMemo(() => orderStagesForItinerary(stages), [stages]);
  const center: [number, number] = [45.183331, 0.71667];
  const positions: [number, number][] = routeStages.map((s) => [s.lat, s.lng]);
  const last = routeStages.length - 1;

  return (
    <>
    <div className="relative bg-[var(--background-subtle)]">
      <MapContainer
        center={center}
        zoom={6}
        className="z-0 h-[min(560px,74vh)] w-full border-y border-[var(--border)] md:border-x md:border-y-0"
      >
      <IgnPlanTileLayer />
      <Polyline
        positions={positions}
        pathOptions={{ color: "#1a1a1a", weight: 2.5, opacity: 0.72, lineCap: "round", lineJoin: "round" }}
      />
      {routeStages.map((stage, i) => {
        const isFirst = i === 0;
        const isLast = i === last;
        const pos: [number, number] = [stage.lat, stage.lng];

        if (isFirst) {
          return (
            <Marker key={stage.slug} position={pos} icon={departMarkerIcon}>
              <Popup>
                <PopupContent stage={stage} variant="depart" />
              </Popup>
            </Marker>
          );
        }
        if (isLast) {
          return (
            <Marker key={stage.slug} position={pos} icon={arriveeIcon()}>
              <Popup>
                <PopupContent stage={stage} variant="arrivee" />
              </Popup>
            </Marker>
          );
        }

        const { radius, pathOptions } = markerStyle(stage);
        return (
          <CircleMarker key={stage.slug} center={pos} radius={radius} pathOptions={pathOptions}>
            <Popup>
              <PopupContent stage={stage} />
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
    </div>
    <div
      className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-10 gap-y-4 border-t border-[var(--border)] bg-[var(--background)] px-4 py-5 md:px-8"
      role="group"
      aria-label="Légende de la carte"
    >
      <LegendItem
        swatch={
          <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]">
            <Image
              src={DEPART_ICON_URL}
              alt=""
              width={26}
              height={26}
              className="h-[26px] w-[26px] object-contain"
            />
          </span>
        }
        label="Départ"
      />
      <LegendItem
        swatch={<span className="text-2xl leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" aria-hidden>🏁</span>}
        label="Arrivée"
      />
      <LegendItem
        swatch={
          <span
            className="inline-block h-2 w-2 shrink-0 rounded-full border border-[#5dac78] bg-[#c4e8d0]"
            aria-hidden
          />
        }
        label="Étape"
      />
      <LegendItem
        swatch={
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-[var(--map-station-stroke)] bg-[var(--map-station-fill)]"
            aria-hidden
          />
        }
        label="Avec gare"
      />
    </div>
    </>
  );
}

function PopupContent({
  stage,
  variant,
}: {
  stage: Stage;
  variant?: "depart" | "arrivee";
}) {
  return (
    <div className="text-sm leading-snug">
      {variant === "depart" && (
        <p className="mb-1 font-[family-name:var(--font-display)] text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Départ
        </p>
      )}
      {variant === "arrivee" && (
        <p className="mb-1 font-[family-name:var(--font-display)] text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
          Arrivée
        </p>
      )}
      <p className="font-semibold text-neutral-900">{shortTitle(stage.title)}</p>
      <p className="mt-0.5 text-xs text-neutral-500">
        {formatStageDateFr(stage.date)} · {stage.km} km
      </p>
      {stage.has_station && (
        <p className="mt-1.5 font-[family-name:var(--font-display)] text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
          Gare accessible
        </p>
      )}
      <Link href={`/stages/${stage.slug}`} className="mt-2 inline-block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--trail)] underline-offset-4 hover:underline">
        Voir l&apos;étape
      </Link>
    </div>
  );
}

function LegendItem({ swatch, label }: { swatch: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center">
        {swatch}
      </span>
      <span className="font-[family-name:var(--font-display)] text-[10px] font-medium uppercase tracking-[0.22em] text-neutral-500">
        {label}
      </span>
    </div>
  );
}
