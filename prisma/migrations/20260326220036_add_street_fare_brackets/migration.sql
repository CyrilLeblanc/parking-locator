/*
  Warnings:

  - You are about to drop the column `hourly_fare` on the `street_parking_zone` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "parking_position_idx";

-- DropIndex
DROP INDEX "parking_history_parking_id_day_idx";

-- DropIndex
DROP INDEX "street_zone_geometry_idx";

-- AlterTable
ALTER TABLE "street_parking_zone" DROP COLUMN "hourly_fare";

-- CreateTable
CREATE TABLE "street_parking_fare_bracket" (
    "zone_color" TEXT NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "fare" DOUBLE PRECISION NOT NULL,
    "is_penalty" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "street_parking_fare_bracket_pkey" PRIMARY KEY ("zone_color","duration_min")
);
