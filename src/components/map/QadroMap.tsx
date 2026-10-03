"use client";

import dynamic from "next/dynamic";

/** Harita yalnızca tarayıcıda yüklenir (ssr: false); yüklenene kadar sade bir yer tutucu gösterilir. */
export const QadroMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface-2" />,
});

export type { MapPin } from "./LeafletMap";
