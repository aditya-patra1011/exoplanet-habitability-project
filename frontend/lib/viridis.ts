// Viridis colour scale stops, matching the Streamlit dashboard's charts.
export const VIRIDIS_STOPS = [
  "#440154",
  "#482878",
  "#3e4989",
  "#31688e",
  "#26828e",
  "#1f9e89",
  "#35b779",
  "#6ece58",
  "#b5de2b",
  "#fde725",
];

const toRgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** Returns the Viridis colour for a value between min and max. */
export function viridis(value: number, min: number, max: number): string {
  const span = max - min;
  const t = span > 0 ? Math.min(Math.max((value - min) / span, 0), 1) : 1;
  const position = t * (VIRIDIS_STOPS.length - 1);
  const index = Math.min(Math.floor(position), VIRIDIS_STOPS.length - 2);
  const from = toRgb(VIRIDIS_STOPS[index]);
  const to = toRgb(VIRIDIS_STOPS[index + 1]);
  const mix = position - index;
  const [r, g, b] = from.map((c, i) => Math.round(c + (to[i] - c) * mix));
  return `rgb(${r}, ${g}, ${b})`;
}
