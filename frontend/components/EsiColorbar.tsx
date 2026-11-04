import { VIRIDIS_STOPS } from "@/lib/viridis";

/** Vertical colour key for charts coloured by ESI score. */
export default function EsiColorbar({
  min,
  max,
}: {
  min: number;
  max: number;
}) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-1 pb-12 pt-5 text-xs text-gray-300">
      <span className="font-medium">ESI</span>
      <span>{max.toFixed(2)}</span>
      <div
        role="img"
        aria-label={`ESI colour scale from ${min.toFixed(2)} to ${max.toFixed(2)}`}
        className="w-4 flex-1 rounded-sm"
        style={{
          background: `linear-gradient(to top, ${VIRIDIS_STOPS.join(", ")})`,
        }}
      />
      <span>{min.toFixed(2)}</span>
    </div>
  );
}
