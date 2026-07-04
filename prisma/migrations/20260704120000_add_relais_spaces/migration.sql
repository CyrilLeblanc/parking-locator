-- AlterTable
-- Number of P+R (parc relais) spaces from LaMetro `nb_pr`. A parking is
-- shown as a "parc relais" when relais_spaces > 0.
ALTER TABLE "parking" ADD COLUMN "relais_spaces" INTEGER NOT NULL DEFAULT 0;
