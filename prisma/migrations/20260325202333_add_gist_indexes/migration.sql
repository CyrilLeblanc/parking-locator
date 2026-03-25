CREATE INDEX parking_position_idx ON "parking" USING GIST (position);
CREATE INDEX street_zone_geometry_idx ON "street_parking_zone" USING GIST (geometry);