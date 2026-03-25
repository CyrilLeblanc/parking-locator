-- Change street_parking_zone.geometry to generic geometry (accepts Polygon + MultiPolygon)
ALTER TABLE "street_parking_zone" ALTER COLUMN "geometry" TYPE geometry USING "geometry"::geometry;

-- Recreate GIST indexes (dropped by previous migration)
CREATE INDEX "parking_position_idx" ON "parking" USING GIST (position);
CREATE INDEX "street_zone_geometry_idx" ON "street_parking_zone" USING GIST (geometry);
