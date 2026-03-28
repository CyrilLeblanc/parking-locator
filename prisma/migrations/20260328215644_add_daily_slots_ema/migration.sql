-- CreateTable
CREATE TABLE "parking_daily_slot" (
    "parking_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "occupancy" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_daily_slot_pkey" PRIMARY KEY ("parking_id","date","slot")
);

-- AddForeignKey
ALTER TABLE "parking_daily_slot" ADD CONSTRAINT "parking_daily_slot_parking_id_fkey" FOREIGN KEY ("parking_id") REFERENCES "parking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
