export interface PlanetPoint {
  name: string;
  x: number;
  y: number;
}

/** Recharts tooltip content for scatter charts, showing which planet a point is. */
export default function PlanetTooltip({
  active,
  payload,
  xLabel,
  yLabel,
}: {
  active?: boolean;
  payload?: readonly { payload?: PlanetPoint }[];
  xLabel: string;
  yLabel: string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="bg-[#1c1f26] border border-gray-700 rounded px-3 py-2 text-sm">
      <p className="font-semibold mb-1">{point.name}</p>
      <p className="text-gray-300">
        {xLabel}: {point.x.toFixed(2)}
      </p>
      <p className="text-gray-300">
        {yLabel}: {point.y.toFixed(2)}
      </p>
    </div>
  );
}
