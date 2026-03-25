-- CreateTable
CREATE TABLE "parking" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "insee_code" CHAR(5) NOT NULL,
    "facility_type" TEXT NOT NULL,
    "free" BOOLEAN NOT NULL,
    "total_capacity" INTEGER NOT NULL,
    "disabled_spaces" INTEGER NOT NULL,
    "ev_chargers" INTEGER NOT NULL,
    "bike_spaces" INTEGER NOT NULL,
    "max_height" DOUBLE PRECISION,
    "operator" TEXT,
    "siret" TEXT,
    "info_url" TEXT,
    "fare_url" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "position" geometry(Point, 4326),

    CONSTRAINT "parking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_fare" (
    "parking_id" TEXT NOT NULL,
    "fare_1h" DOUBLE PRECISION,
    "fare_2h" DOUBLE PRECISION,
    "fare_3h" DOUBLE PRECISION,
    "fare_4h" DOUBLE PRECISION,
    "fare_24h" DOUBLE PRECISION,
    "fare_disabled" DOUBLE PRECISION,
    "subscription_resident" DOUBLE PRECISION,
    "subscription_non_resident" DOUBLE PRECISION,
    "source" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_fare_pkey" PRIMARY KEY ("parking_id")
);

-- CreateTable
CREATE TABLE "parking_availability" (
    "parking_id" TEXT NOT NULL,
    "free_spaces" INTEGER,
    "free_facility_spaces" INTEGER,
    "free_pr_spaces" INTEGER,
    "status" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parking_availability_pkey" PRIMARY KEY ("parking_id")
);

-- CreateTable
CREATE TABLE "street_parking_zone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zone_color" TEXT NOT NULL,
    "hourly_fare" DOUBLE PRECISION NOT NULL,
    "geometry" geometry(Polygon, 4326),

    CONSTRAINT "street_parking_zone_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "parking_fare" ADD CONSTRAINT "parking_fare_parking_id_fkey" FOREIGN KEY ("parking_id") REFERENCES "parking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_availability" ADD CONSTRAINT "parking_availability_parking_id_fkey" FOREIGN KEY ("parking_id") REFERENCES "parking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
