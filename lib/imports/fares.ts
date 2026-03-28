import { parse } from "csv-parse/sync";
import { prisma } from "../prisma";

const CSV_URL = "https://data.mobilites-m.fr/api/normes/lieuxstationnements";

type FareRow = {
  id: string;
  tarif_pmr: string;
  tarif_1h: string;
  tarif_2h: string;
  tarif_3h: string;
  tarif_4h: string;
  tarif_24h: string;
  abo_resident: string;
  abo_non_resident: string;
  [key: string]: string;
};

function parseFloat_(value: string | undefined): number | null {
  if (!value || value.trim() === "" || value.toLowerCase() === "n/a") return null;
  if (value.toLowerCase() === "gratuit") return 0;
  const n = Number(value.replace(",", "."));
  return isNaN(n) ? null : n;
}

export async function importFares(): Promise<void> {
  console.log("Fetching fares CSV…");
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const csvText = await res.text();

  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter: ";",
  }) as FareRow[];

  console.log(`Found ${rows.length} rows. Fetching known parking IDs…`);

  const knownIds = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM parking`;
  const idSet = new Set(knownIds.map((r) => r.id));

  console.log(`Known parkings: ${idSet.size}. Importing fares…`);

  await prisma.$executeRaw`TRUNCATE TABLE parking_fare`;

  let imported = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!idSet.has(row.id)) { skipped++; continue; }

    await prisma.$executeRaw`
      INSERT INTO parking_fare (
        parking_id, fare_1h, fare_2h, fare_3h, fare_4h, fare_24h,
        fare_disabled, subscription_resident, subscription_non_resident,
        source, updated_at
      ) VALUES (
        ${row.id},
        ${parseFloat_(row.tarif_1h)},
        ${parseFloat_(row.tarif_2h)},
        ${parseFloat_(row.tarif_3h)},
        ${parseFloat_(row.tarif_4h)},
        ${parseFloat_(row.tarif_24h)},
        ${parseFloat_(row.tarif_pmr)},
        ${parseFloat_(row.abo_resident)},
        ${parseFloat_(row.abo_non_resident)},
        ${"data.mobilites-m.fr/api/normes/lieuxstationnements"},
        NOW()
      )
    `;
    imported++;
  }

  console.log(`Done. ${imported} imported, ${skipped} skipped.`);
}
