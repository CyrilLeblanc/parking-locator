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

export const HistoryDataSchema = z.object({
  parking_id: z.string(),
  parking_name: z.string(),
  total_capacity: z.number().int().min(0),
  day_of_week: z.number().int().min(0).max(6),
  slots: z.array(HistorySlotSchema),
});

// ---------------------------------------------------------------------------
// Route param: ?day=0-6
// ---------------------------------------------------------------------------

export const DayParamSchema = z
  .string()
  .transform((v) => parseInt(v, 10))
  .pipe(z.number().int().min(0).max(6));
