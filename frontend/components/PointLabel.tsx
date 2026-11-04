/** Single-line scatter label with a dark outline, so it stays readable over points. */
export default function PointLabel({
  x,
  y,
  width,
  value,
}: {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  value?: number | string | boolean | null;
}) {
  if (!value) return null;

  return (
    <text
      x={Number(x) + Number(width) / 2}
      y={Number(y) - 5}
      textAnchor="middle"
      fontSize={11}
      fill="#fff"
      stroke="#0e1117"
      strokeWidth={3}
      paintOrder="stroke"
    >
      {String(value)}
    </text>
  );
}
