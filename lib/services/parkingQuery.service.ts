import { getAllParkings } from "@/lib/repositories/parking.repository";
import { parkingRowToPlumberRow, toSearchResult } from "@/lib/nlp/mapper";
import { queryPlumber } from "@/lib/nlp/r-client";
import type { ParkingSearchResult } from "@/lib/nlp/types";

export type SearchParkingsInput = {
  q: string;
  lat?: number;
  lng?: number;
};

// Orchestrates a natural-language search:
//   1. load parkings from the database (existing repository)
//   2. map them to the R service DTO
//   3. query the R/plumber agent
//   4. map the response back to the domain
export async function searchParkings({
  q,
  lat,
  lng,
}: SearchParkingsInput): Promise<ParkingSearchResult> {
  const rows = await getAllParkings();

  const parkings = rows
    .map(parkingRowToPlumberRow)
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const response = await queryPlumber({
    question: q,
    parkings,
    // The R contract uses lat/lon; the client uses lat/lng.
    lat,
    lon: lng,
  });

  return toSearchResult(response);
}
