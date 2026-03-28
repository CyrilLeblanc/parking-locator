-- AlterTable
ALTER TABLE "parking" ADD COLUMN     "carpool_spaces" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "carsharing_spaces" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "info" TEXT,
ADD COLUMN     "moto_ev_spaces" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "moto_spaces" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "users_type" TEXT;
