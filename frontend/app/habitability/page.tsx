"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import LoadError from "@/components/LoadError";
import PlanetTooltip from "@/components/PlanetTooltip";
import { HZ_COLORS } from "@/lib/hz";
import { HabitabilityRow, HabitabilityBySource } from "@/lib/types";
import { useJson } from "@/lib/useJson";

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

  const scatterByStatus = (
    ["outside_hz", "conservative_hz", "optimistic_hz", "unknown"] as string[]
  )
    .map((status) => ({
      status,
      data: habitability.flatMap((d) =>
        d.hz_status === status && d.insolation_flux <= 3 && d.eq_temp_k !== null
          ? [{ x: d.insolation_flux, y: d.eq_temp_k, name: d.planet_name }]
          : [],
      ),
    }))
    .filter((group) => group.data.length > 0);

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
        <ResponsiveContainer width="100%" height={450}>
          <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 3]}
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
              stroke="#999"
              label={{
                value: "Equilibrium Temperature (K)",
                angle: -90,
                position: "insideLeft",
                fill: "#999",
              }}
            />
            <Tooltip
              content={<PlanetTooltip xLabel="Flux (S⊕)" yLabel="Temp (K)" />}
            />
            <ReferenceLine
              x={1.0}
              stroke="#fff"
              strokeDasharray="4 4"
              opacity={0.5}
            />
            <ReferenceLine
              y={288}
              stroke="#fff"
              strokeDasharray="4 4"
              opacity={0.5}
            />
            <ReferenceDot x={1.0} y={288} r={5} fill="#fff" stroke="none" />
            {scatterByStatus.map((group) => (
              <Scatter
                key={group.status}
                name={group.status}
                data={group.data}
                fill={HZ_COLORS[group.status] || "#888888"}
                opacity={0.6}
              />
            ))}
            <Legend verticalAlign="top" />
          </ScatterChart>
        </ResponsiveContainer>
        <p className="text-sm text-gray-400 mt-2">
          The white dot marks Earth&apos;s own values (1.0 S⊕, 288 K) for
          reference.
        </p>
      </div>
    </div>
  );
}
