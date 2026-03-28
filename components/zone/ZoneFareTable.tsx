"use client";

import { estimateZoneFare, formatDuration, formatFareValue } from "@/lib/fareEstimation";
import type { ZoneFareBracket } from "@/types/zone";

export function ZoneFareTable({
  brackets,
  estimationDuration,
}: {
  brackets: ZoneFareBracket[];
  estimationDuration: number | null;
}) {
  const nonPenalty = brackets.filter((b) => !b.is_penalty);
  const penalty = brackets.find((b) => b.is_penalty);

  const estimated =
    estimationDuration !== null ? estimateZoneFare(brackets, estimationDuration) : null;
  const isOverMax = estimationDuration !== null && estimated === null && nonPenalty.length > 0;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold uppercase text-muted-foreground">Tarifs</p>
        {estimated !== null && (
          <span className="text-sm font-semibold text-primary">
            {formatDuration(estimationDuration!)} → {formatFareValue(estimated)}
          </span>
        )}
        {isOverMax && (
          <span className="text-xs text-destructive font-medium">Durée max dépassée</span>
        )}
      </div>
      <table className="w-full text-sm">
        <tbody>
          {nonPenalty.map((b) => {
            const isLower =
              estimationDuration !== null &&
              estimated !== null &&
              b.duration_min <= estimationDuration;
            const isUpper =
              estimationDuration !== null &&
              estimated !== null &&
              b.duration_min > estimationDuration &&
              nonPenalty.find((x) => x.duration_min > estimationDuration)?.duration_min ===
                b.duration_min;
            const highlight = isLower || isUpper;
            return (
              <tr
                key={b.duration_min}
                className={`border-b border-border last:border-0 ${highlight ? "bg-primary/5" : ""}`}
              >
                <td className="py-1.5 text-muted-foreground">{formatDuration(b.duration_min)}</td>
                <td className="py-1.5 text-right font-medium">{formatFareValue(b.fare)}</td>
              </tr>
            );
          })}
          {penalty && (
            <tr className="border-b border-border last:border-0">
              <td className="py-1.5 text-muted-foreground">{formatDuration(penalty.duration_min)} (max)</td>
              <td className="py-1.5 text-right font-medium text-destructive">{formatFareValue(penalty.fare)}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
