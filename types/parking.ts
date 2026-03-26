export type ParkingRow = {
  id: string;
  name: string;
  address: string;
  city: string;
  facility_type: string;
  free: boolean;
  total_capacity: number;
  disabled_spaces: number;
  ev_chargers: number;
  bike_spaces: number;
  max_height: number | null;
  geojson: string;
  fare_1h: number | null;
  fare_2h: number | null;
  fare_3h: number | null;
  fare_4h: number | null;
  fare_24h: number | null;
  subscription_resident: number | null;
  subscription_non_resident: number | null;
};

export type ParkingFeatureProperties = {
  name: string;
  address: string;
  city: string;
  facility_type: string;
  free: boolean;
  total_capacity: number;
  disabled_spaces: number;
  ev_chargers: number;
  bike_spaces: number;
  max_height?: number | null;
  fare_1h?: number | null;
  fare_2h?: number | null;
  fare_3h?: number | null;
  fare_4h?: number | null;
  fare_24h?: number | null;
  subscription_resident?: number | null;
  subscription_non_resident?: number | null;
};

export type SelectedParking = {
  id: string;
  name: string;
  address: string;
  city: string;
  facility_type: string;
  free: boolean;
  total_capacity: number;
  disabled_spaces: number;
  ev_chargers: number;
  bike_spaces: number;
  fare_1h?: number | null;
  fare_2h?: number | null;
  fare_3h?: number | null;
  fare_4h?: number | null;
  fare_24h?: number | null;
  subscription_resident?: number | null;
  subscription_non_resident?: number | null;
  free_spaces: number | null;
};

export type HistorySlot = {
  slot: number;
  time: string;
  avg_occupancy: number | null;
  sample_count: number;
};

export type HistoryData = {
  parking_id: string;
  parking_name: string;
  total_capacity: number;
  day_of_week: number;
  slots: HistorySlot[];
};

export type Availability = Record<string, { free_spaces: number | null }>;
