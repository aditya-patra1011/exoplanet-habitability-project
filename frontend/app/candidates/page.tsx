"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import LoadError from "@/components/LoadError";
import PlanetTooltip from "@/components/PlanetTooltip";
import { HZ_COLORS } from "@/lib/hz";
import { HabitabilityRow, RockyHzPlanet } from "@/lib/types";
import { useJson } from "@/lib/useJson";

const fmt = (value: number | null, digits: number) =>
  value === null ? "—" : value.toFixed(digits);

export default function CandidatesPage() {
  const [count, setCount] = useState(20);
  const { data: topEsiData, failed: topEsiFailed } = useJson<HabitabilityRow[]>(
    "/data/top_esi_candidates.json",
  );
  const { data: rockyData, failed: rockyFailed } = useJson<RockyHzPlanet[]>(
    "/data/rocky_hz_planets.json",
  );
  const rocky = rockyData ?? [];

  const top = (topEsiData ?? []).slice(0, count);

  const scatterByStatus = Object.keys(HZ_COLORS)
    .map((status) => ({
      status,
      data: top.flatMap((d) =>
        d.hz_status === status && d.eq_temp_k !== null
          ? [{ x: d.radius_earth, y: d.eq_temp_k, name: d.planet_name }]
          : [],
      ),
    }))
    .filter((group) => group.data.length > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-3">
          Top Habitable Candidates by ESI
        </h1>
        <p className="text-gray-300">
          ESI here uses only radius and equilibrium temperature, so a
          high-ranking planet can still sit outside the habitable zone. Check
          its HZ status.
        </p>
      </div>

      {(topEsiFailed || rockyFailed) && <LoadError />}

      <div className="bg-[#1c1f26] border border-gray-800 rounded-lg p-6">
        <label htmlFor="top-count" className="block text-sm text-gray-300 mb-2">
          Number of top candidates to show: <strong>{count}</strong>
        </label>
        <input
          id="top-count"
          type="range"
          min={5}
          max={50}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full accent-green-500"
        />
      </div>

      <div className="bg-[#1c1f26] border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          Radius vs. Equilibrium Temperature
        </h3>
        <ResponsiveContainer width="100%" height={450}>
          <ScatterChart margin={{ top: 20, right: 30, left: 10, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              type="number"
              dataKey="x"
              domain={["auto", "auto"]}
              stroke="#999"
              label={{
                value: "Radius (R⊕)",
                position: "bottom",
                fill: "#999",
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={["auto", "auto"]}
              stroke="#999"
              label={{
                value: "Equilibrium Temperature (K)",
                angle: -90,
                position: "insideLeft",
                fill: "#999",
              }}
            />
            <Tooltip
              content={<PlanetTooltip xLabel="Radius (R⊕)" yLabel="Temp (K)" />}
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
            {scatterByStatus.map((group) => (
              <Scatter
                key={group.status}
                name={group.status}
                data={group.data}
                fill={HZ_COLORS[group.status]}
              />
            ))}
            <Legend verticalAlign="top" />
          </ScatterChart>
        </ResponsiveContainer>
        <p className="text-sm text-gray-400 mt-2">
          Dashed lines mark Earth&apos;s values (1.0 R⊕, 288 K).
        </p>
      </div>

      <div className="bg-[#1c1f26] border border-gray-800 rounded-lg p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Top {count} by ESI</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th className="py-2 pr-4">Planet</th>
              <th className="py-2 pr-4">Source</th>
              <th className="py-2 pr-4">Radius (R⊕)</th>
              <th className="py-2 pr-4">Temp (K)</th>
              <th className="py-2 pr-4">Flux (S⊕)</th>
              <th className="py-2 pr-4">HZ Status</th>
              <th className="py-2 pr-4">ESI</th>
            </tr>
          </thead>
          <tbody>
            {top.map((row, i) => (
              <tr key={i} className="border-b border-gray-800">
                <td className="py-2 pr-4">{row.planet_name}</td>
                <td className="py-2 pr-4">{row.source}</td>
                <td className="py-2 pr-4">{fmt(row.radius_earth, 3)}</td>
                <td className="py-2 pr-4">{fmt(row.eq_temp_k, 1)}</td>
                <td className="py-2 pr-4">{fmt(row.insolation_flux, 3)}</td>
                <td className="py-2 pr-4">{row.hz_status}</td>
                <td className="py-2 pr-4">{fmt(row.esi_score, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#1c1f26] border border-gray-800 rounded-lg p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">
          Rocky + Habitable Zone Planets (Full List: {rocky.length})
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th className="py-2 pr-4">Planet</th>
              <th className="py-2 pr-4">Source</th>
              <th className="py-2 pr-4">Flux (S⊕)</th>
              <th className="py-2 pr-4">Temp (K)</th>
              <th className="py-2 pr-4">Radius (R⊕)</th>
              <th className="py-2 pr-4">HZ Status</th>
            </tr>
          </thead>
          <tbody>
            {rocky.map((row, i) => (
              <tr key={i} className="border-b border-gray-800">
                <td className="py-2 pr-4">{row.planet_name}</td>
                <td className="py-2 pr-4">{row.source}</td>
                <td className="py-2 pr-4">{fmt(row.insolation_flux, 3)}</td>
                <td className="py-2 pr-4">{fmt(row.eq_temp_k, 1)}</td>
                <td className="py-2 pr-4">{fmt(row.radius_earth, 3)}</td>
                <td className="py-2 pr-4">{row.hz_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
