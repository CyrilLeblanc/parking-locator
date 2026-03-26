export type ZoneRow = {
  id: string;
  name: string;
  zone_color: string;
  hourly_fare: number;
  geojson: string;
};

export type ZoneFeatureProperties = {
  name: string;
  zone_color: string;
  hourly_fare: number;
};
