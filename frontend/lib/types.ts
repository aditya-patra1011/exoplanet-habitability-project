export interface Overview {
  total_koi_rows: number;
  labeled_rows: number;
  candidates_evaluated: number;
  predicted_real: number;
  planets_evaluated: number;
  in_hz_count: number;
  conservative_hz_pct: number;
  optimistic_hz_pct: number;
}

export interface TargetDistribution {
  Confirmed: number;
  "False Positive": number;
}

export interface ModelResult {
  Tier: string;
  Model: string;
  F1_mean: number;
  F1_std: number;
  AUC_mean: number;
  AUC_std: number;
}

export interface AblationPivotRow {
  Model: string;
  Full: number;
  "No-score": number;
  "Raw physical": number;
  Full_minus_RawPhysical: number;
}

export interface HabitabilityRow {
  planet_name: string;
  source: string;
  insolation_flux: number;
  eq_temp_k: number | null;
  radius_earth: number;
  hz_status: string;
  esi_score: number | null;
}

export type RockyHzPlanet = Omit<HabitabilityRow, "esi_score">;

export interface HabitabilityBySource {
  source: string;
  total: number;
  in_conservative_hz: number;
  in_optimistic_hz: number;
  rocky_count: number;
  pct_conservative_hz: number;
}
