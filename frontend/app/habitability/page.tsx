"use client";

import {
  PieChart,
  Pie,
  Cell,
  LabelList,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import EsiColorbar from "@/components/EsiColorbar";
import LoadError from "@/components/LoadError";
import PlanetTooltip from "@/components/PlanetTooltip";
import PointLabel from "@/components/PointLabel";
import { HZ_COLORS } from "@/lib/hz";
import { HabitabilityRow, HabitabilityBySource } from "@/lib/types";
import { useJson } from "@/lib/useJson";
import { viridis } from "@/lib/viridis";

const MAX_FLUX = 3;
const MAX_TEMP = 500;
const MAX_LABELS = 12;
const LABEL_GAP_FLUX = 0.3;
const LABEL_GAP_TEMP = 30;

export default function HabitabilityPage() {
  const { data: habitabilityData, failed: habitabilityFailed } = useJson<
    HabitabilityRow[]
  >("/data/habitatbility_scores.json");
  const { data: bySourceData, failed: bySourceFailed } = useJson<
    HabitabilityBySource[]
  >("/data/habitability_by_source.json");
  const habitability = habitabilityData ?? [];
  const bySource = bySourceData ?? [];

  const hzCounts = habitability.reduce((acc: Record<string, number>, row) => {
    acc[row.hz_status] = (acc[row.hz_status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(hzCounts).map(([status, count]) => ({
    name: status,
    value: count,
    color: HZ_COLORS[status] || "#888888",
  }));

  const inFluxRange = habitability.flatMap((d) =>
    d.insolation_flux <= MAX_FLUX && d.eq_temp_k !== null && d.esi_score !== null
      ? [
          {
            x: d.insolation_flux,
            y: d.eq_temp_k,
            name: d.planet_name,
            esi: d.esi_score,
          },
        ]
      : [],
  );
  const onChart = inFluxRange.filter((p) => p.y <= MAX_TEMP);
  // Label the highest-ESI planets, skipping any that would overlap another label.
  const labeled: typeof onChart = [];
  for (const p of [...onChart].sort((a, b) => b.esi - a.esi)) {
    if (labeled.length === MAX_LABELS) break;
    const clear = labeled.every(
      (other) =>
        Math.abs(p.x - other.x) >= LABEL_GAP_FLUX ||
        Math.abs(p.y - other.y) >= LABEL_GAP_TEMP,
    );
    if (clear) labeled.push(p);
  }
  const labeledNames = new Set(labeled.map((p) => p.name));
  const points = onChart.map((p) => ({
    ...p,
    label: labeledNames.has(p.name) ? p.name : "",
  }));
  const hiddenHot = inFluxRange.length - points.length;
  const esiValues = points.map((p) => p.esi);
  const esiMin = esiValues.length > 0 ? Math.min(...esiValues) : 0;
  const esiMax = esiValues.length > 0 ? Math.max(...esiValues) : 1;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Part B: Habitability Scoring</h1>
      {(habitabilityFailed || bySourceFailed) && <LoadError />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1c1f26] border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">HZ Status Distribution</h3>
          {pieData.length > 0 && (
            <ResponsiveContainer width="100%" height={500}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  isAnimationActive={false}
                  label
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1c1f26",
                    border: "1px solid #333",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-[#1c1f26] border border-gray-800 rounded-lg p-6 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">
            Habitability Rate by Source
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="py-2 pr-4">Source</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Conservative HZ</th>
                <th className="py-2 pr-4">Optimistic HZ</th>
                <th className="py-2 pr-4">Rocky</th>
                <th className="py-2 pr-4">% Conservative</th>
              </tr>
            </thead>
            <tbody>
              {bySource.map((row) => (
                <tr key={row.source} className="border-b border-gray-800">
                  <td className="py-2 pr-4">{row.source}</td>
                  <td className="py-2 pr-4">{row.total.toLocaleString()}</td>
                  <td className="py-2 pr-4">{row.in_conservative_hz}</td>
                  <td className="py-2 pr-4">{row.in_optimistic_hz}</td>
                  <td className="py-2 pr-4">{row.rocky_count}</td>
                  <td className="py-2 pr-4">{row.pct_conservative_hz}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#1c1f26] border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          Insolation Flux vs. Equilibrium Temperature
        </h3>
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <ResponsiveContainer width="100%" height={600}>
              <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
                <CartesianGrid vertical={false} stroke="#2a2e37" />
                <ReferenceArea x1={0.36} x2={1.11} fill="#2ca02c" fillOpacity={0.12} stroke="none" />
                <ReferenceArea x1={0.25} x2={0.36} fill="#ff7f0e" fillOpacity={0.12} stroke="none" />
                <ReferenceArea x1={1.11} x2={1.5} fill="#ff7f0e" fillOpacity={0.12} stroke="none" />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[0, MAX_FLUX]}
                  stroke="#999"
                  label={{
                    value: "Insolation Flux (S⊕)",
                    position: "bottom",
                    fill: "#999",
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[0, MAX_TEMP]}
                  stroke="#999"
                  label={{
                    value: "Equilibrium Temperature (K)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#999",
                  }}
                />
                <ZAxis range={[45, 45]} />
                <Tooltip
                  content={<PlanetTooltip xLabel="Flux (S⊕)" yLabel="Temp (K)" />}
                />
                <ReferenceLine
                  x={1.0}
                  stroke="#888"
                  strokeDasharray="6 6"
                  opacity={0.6}
                />
                <ReferenceLine
                  y={288}
                  stroke="#888"
                  strokeDasharray="6 6"
                  opacity={0.6}
                />
                <Scatter
                  data={points}
                  stroke="#fff"
                  strokeWidth={0.5}
                  isAnimationActive={false}
                >
                  {points.map((p, i) => (
                    <Cell key={i} fill={viridis(p.esi, esiMin, esiMax)} />
                  ))}
                  <LabelList dataKey="label" content={PointLabel} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <EsiColorbar min={esiMin} max={esiMax} />
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Green and orange bands mark the conservative and optimistic habitable
          zones, and dashed lines mark Earth (1.0 S⊕, 288 K). Labels show
          high-ESI planets, skipping any that would overlap; hover over any
          point for its name. The axis stops at {MAX_TEMP} K, so {hiddenHot} hotter planets
          are off the chart.
        </p>
      </div>
    </div>
  );
}
