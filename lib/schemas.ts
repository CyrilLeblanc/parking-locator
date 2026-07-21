import { z } from "zod";

// ---------------------------------------------------------------------------
// Availability (external API: data.mobilites-m.fr)
// ---------------------------------------------------------------------------

const RawAvailabilityEntrySchema = z.object({
  nb_places_libres: z.number().nullable(),
  nb_parking_libres: z.number().nullable().optional(),
  nb_pr_libres: z.number().nullable().optional(),
  nsv_id: z.number().optional(),
  time: z.number().optional(),
});

export const RawAvailabilityResponseSchema = z.record(z.string(), RawAvailabilityEntrySchema);

// ---------------------------------------------------------------------------
// History API (/api/parkings/[id]/history)
// ---------------------------------------------------------------------------

export const HistorySlotSchema = z.object({
  slot: z.number().int().min(0).max(47),
  time: z.string(),
  avg_occupancy: z.number().nullable(),
  sample_count: z.number().int().min(0),
});

export const DailySlotSchema = z.object({
  slot: z.number().int().min(0).max(47),
  time: z.string(),
  occupancy: z.number(),
});

export const HistoryDataSchema = z.object({
  parking_id: z.string(),
  parking_name: z.string(),
  total_capacity: z.number().int().min(0),
  day_of_week: z.number().int().min(0).max(6),
  slots: z.array(HistorySlotSchema),
  today_slots: z.array(DailySlotSchema),
});

// ---------------------------------------------------------------------------
// Route param: ?day=0-6
// ---------------------------------------------------------------------------

export const DayParamSchema = z
  .string()
  .transform((v) => parseInt(v, 10))
  .pipe(z.number().int().min(0).max(6));

// ---------------------------------------------------------------------------
// Natural-language parking search (/api/parkings/query -> R/plumber service)
// ---------------------------------------------------------------------------

// Inbound request accepted by the proxy route.
export const ParkingQueryRequestSchema = z.object({
  q: z.string().trim().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

// Response returned by the R/plumber service — a faithful mirror of the wire
// (transfer type). See nlp-processor/agent.R for the producer. Nullable fields
// are `.nullish()` because jsonlite omits them entirely when all-NA.
export const PlumberResponseSchema = z.object({
  message: z.string(),
  ranking_criterion: z
    .enum(["capacity", "ev", "pmr", "carpool", "distance"])
    .nullish(),
  intent: z.object({
    top_n: z.number().int().nullish(),
    filters: z.array(z.string()),
  }),
  results: z.array(
    z.object({
      id: z.string(),
      rank: z.number().int(),
      medal: z.enum(["gold", "silver", "bronze"]).nullish(),
      distance_km: z.number().nullish(),
    })
  ),
});

export type PlumberResponse = z.infer<typeof PlumberResponseSchema>;
export type ParkingQueryRequest = z.infer<typeof ParkingQueryRequestSchema>;
