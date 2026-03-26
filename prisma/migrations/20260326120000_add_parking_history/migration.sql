-- CreateTable
CREATE TABLE "parking_history" (
    "parking_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "slot" INTEGER NOT NULL,
    "avg_occupancy" DOUBLE PRECISION NOT NULL,
    "sample_count" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_history_pkey" PRIMARY KEY ("parking_id","day_of_week","slot")
);

-- AddForeignKey
ALTER TABLE "parking_history" ADD CONSTRAINT "parking_history_parking_id_fkey"
    FOREIGN KEY ("parking_id") REFERENCES "parking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "parking_history_parking_id_day_idx" ON "parking_history"("parking_id", "day_of_week");
