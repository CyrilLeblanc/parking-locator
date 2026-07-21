"use client";

import type { Feature, FeatureCollection } from "geojson";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Medal, ParkingSearchResult } from "@/lib/nlp/types";

const MEDAL_STYLE: Record<Medal, string> = {
  gold: "bg-amber-400 text-amber-950",
  silver: "bg-slate-300 text-slate-900",
  bronze: "bg-orange-400 text-orange-950",
};

const RANKING_LABEL: Record<string, string> = {
  capacity: "Classé par capacité",
  ev: "Classé par bornes électriques",
  pmr: "Classé par places PMR",
  carpool: "Classé par covoiturage",
  distance: "Classé par distance",
};

type Props = {
  result: ParkingSearchResult | undefined;
  isPending: boolean;
  isError: boolean;
  parkings: FeatureCollection | null;
  onSelect: (feature: Feature) => void;
};

export default function SearchResults({
  result,
  isPending,
  isError,
  parkings,
  onSelect,
}: Props) {
  // Enrich ranked ids with the full feature from the client cache.
  const rows = (result?.results ?? [])
    .map((r) => {
      const feature = parkings?.features.find((f) => f.id === r.id);
      return feature ? { ranked: r, feature } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // The R agent returns every match when the query has no "top N" (e.g. just
  // "gratuit" → 2000+ parkings). Cap the rendered rows to keep the map UI
  // responsive; the full count still shows in the header.
  const MAX_RENDERED = 50;
  const visibleRows = rows.slice(0, MAX_RENDERED);
  const hiddenCount = rows.length - visibleRows.length;

  return (
    <Card className="overflow-hidden bg-background/95 p-0 shadow-lg">
      <ScrollArea className="max-h-[min(50vh,24rem)]">
        <div className="flex flex-col">
          {isError ? (
            <p className="p-4 text-sm text-muted-foreground">
              Service de recherche indisponible pour le moment.
            </p>
          ) : isPending && !result ? (
            <p className="p-4 text-sm text-muted-foreground">Recherche…</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Aucun parking trouvé.</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {result?.message}
                </span>
                {result?.rankingCriterion && (
                  <span className="text-xs text-muted-foreground">
                    {RANKING_LABEL[result.rankingCriterion] ?? ""}
                  </span>
                )}
              </div>
              <ul role="listbox" aria-label="Résultats de recherche">
                {visibleRows.map(({ ranked, feature }) => (
                  <ResultRow
                    key={ranked.id}
                    ranked={ranked}
                    feature={feature}
                    onSelect={onSelect}
                  />
                ))}
              </ul>
              {hiddenCount > 0 && (
                <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                  +{hiddenCount} autres — affinez avec « top 10 ».
                </p>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

function ResultRow({
  ranked,
  feature,
  onSelect,
}: {
  ranked: ParkingSearchResult["results"][number];
  feature: Feature;
  onSelect: (feature: Feature) => void;
}) {
  const name = (feature.properties as { name?: string }).name ?? "Parking";
  const distance =
    ranked.distanceKm != null ? `${ranked.distanceKm.toFixed(1)} km` : null;

  return (
    <li role="option" aria-selected={false}>
      <button
        type="button"
        onClick={() => onSelect(feature)}
        className="flex w-full items-center gap-3 border-b last:border-b-0 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
      >
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            ranked.medal ? MEDAL_STYLE[ranked.medal] : "bg-muted text-muted-foreground"
          )}
        >
          {ranked.rank}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{name}</span>
          {distance && (
            <span className="block text-xs text-muted-foreground">{distance}</span>
          )}
        </span>
      </button>
    </li>
  );
}
