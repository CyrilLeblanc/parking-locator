/*
  Warnings:

  - You are about to drop the `parking_availability` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "parking_availability" DROP CONSTRAINT "parking_availability_parking_id_fkey";

-- DropIndex
DROP INDEX "parking_footprint_gist_idx";

-- DropIndex
DROP INDEX "parking_osm_id_idx";

-- DropIndex
DROP INDEX "parking_source_idx";

-- DropTable
DROP TABLE "parking_availability";
