export type ZoneFareBracket = {
  duration_min: number;
  fare: number;
  is_penalty: boolean;
};

export type ZoneRow = {
  id: string;
  name: string;
  zone_color: string;
  fare_brackets: ZoneFareBracket[];
  geojson: string;
};

export type ZoneFeatureProperties = {
  name: string;
  zone_color: string;
  fare_brackets: ZoneFareBracket[];
};
