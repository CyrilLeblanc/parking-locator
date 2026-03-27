ALTER TABLE "parking"
  ADD COLUMN "source"    TEXT    NOT NULL DEFAULT 'laMetro',
  ADD COLUMN "osm_id"    BIGINT,
  ADD COLUMN "footprint" geometry(Geometry, 4326);

CREATE INDEX "parking_source_idx"         ON "parking"("source");
CREATE INDEX "parking_osm_id_idx"         ON "parking"("osm_id");
CREATE INDEX "parking_footprint_gist_idx" ON "parking" USING GIST ("footprint");
