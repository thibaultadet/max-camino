"use client";

import dynamic from "next/dynamic";
import type { Stage } from "@/lib/airtable";

const StagesMap = dynamic(() => import("./StagesMap"), { ssr: false });

export default function StagesMapWrapper({ stages }: { stages: Stage[] }) {
  return <StagesMap stages={stages} />;
}
