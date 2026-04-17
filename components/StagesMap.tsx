"use client";

import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import type { Stage } from "@/lib/airtable";

function emojiIcon(emoji: string) {
  return L.divIcon({
    html: `<span style="font-size:22px;line-height:1;">${emoji}</span>`,
    className: "",
    iconAnchor: [11, 11],
    popupAnchor: [0, -14],
  });
}

function markerProps(stage: Stage, isFirst: boolean, isLast: boolean) {
  if (isFirst) return { radius: 10, pathOptions: { color: "#166534", fillColor: "#22c55e", fillOpacity: 1, weight: 2.5 } };
  if (isLast)  return { radius: 10, pathOptions: { color: "#7f1d1d", fillColor: "#ef4444", fillOpacity: 1, weight: 2.5 } };
  if (stage.has_station) return { radius: 7, pathOptions: { color: "#078a7d", fillColor: "#0ac5b2", fillOpacity: 1, weight: 2 } };
  return { radius: 4, pathOptions: { color: "#c45e00", fillColor: "#e07b00", fillOpacity: 1, weight: 1.5 } };
}

export default function StagesMap({ stages }: { stages: Stage[] }) {
  const center: [number, number] = [45.183331, 0.71667];
  const positions: [number, number][] = stages.map((s) => [s.lat, s.lng]);
  const last = stages.length - 1;

  return (
    <>
    <MapContainer center={center} zoom={6} className="h-[500px] w-full rounded-lg z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={positions} pathOptions={{ color: "#e07b00", weight: 2, opacity: 0.7 }} />
      {stages.map((stage, i) => {
        const isFirst = i === 0;
        const isLast = i === last;
        const center: [number, number] = [stage.lat, stage.lng];

        if (isFirst || isLast) {
          return (
            <Marker key={stage.slug} position={center} icon={emojiIcon(isFirst ? "⏱️" : "🏁")}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold mb-1">{isFirst ? "Départ" : "Arrivée"}</p>
                  <p className="font-semibold">{stage.title}</p>
                  <p className="text-gray-500">{stage.date} · {stage.km} km</p>
                  <Link href={`/stages/${stage.slug}`} className="text-[#e07b00] underline">
                    Voir l&apos;étape
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        }

        const { radius, pathOptions } = markerProps(stage, false, false);
        return (
          <CircleMarker key={stage.slug} center={center} radius={radius} pathOptions={pathOptions}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{stage.title}</p>
                <p className="text-gray-500">{stage.date} · {stage.km} km</p>
                {stage.has_station && <p className="text-xs mt-1">🚆 Gare accessible</p>}
                <Link href={`/stages/${stage.slug}`} className="text-[#e07b00] underline">
                  Voir l&apos;étape
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
    <div className="flex items-center gap-5 mt-3 px-1">
      <div className="flex items-center gap-2">
        <span className="text-base leading-none">⏱️</span>
        <span className="text-xs text-gray-500">Départ</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-base leading-none">🏁</span>
        <span className="text-xs text-gray-500">Arrivée</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-[#e07b00] inline-block" />
        <span className="text-xs text-gray-500">Étape</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 rounded-full bg-[#0ac5b2] inline-block border-2 border-[#078a7d]" />
        <span className="text-xs text-gray-500">Étape avec gare</span>
      </div>
    </div>
    </>
  );
}
