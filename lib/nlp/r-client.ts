import { PlumberResponseSchema, type PlumberResponse } from "@/lib/schemas";
import type { PlumberRequest } from "./types";

const PLUMBER_URL = process.env.PLUMBER_BASE_URL;

// Calls the R/plumber /query endpoint and validates the response against the
// transfer schema. Throws on network failure, non-2xx, or schema mismatch —
// the route handler turns any thrown error into a 502.
export async function queryPlumber(req: PlumberRequest): Promise<PlumberResponse> {
  if (!PLUMBER_URL) {
    throw new Error("PLUMBER_BASE_URL is not configured");
  }

  const res = await fetch(`${PLUMBER_URL}/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    throw new Error(`Plumber /query error: ${res.status}`);
  }

  return PlumberResponseSchema.parse(await res.json());
}
