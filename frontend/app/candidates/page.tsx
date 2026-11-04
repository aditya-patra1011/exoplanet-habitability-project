"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import EsiColorbar from "@/components/EsiColorbar";
import LoadError from "@/components/LoadError";
import PlanetTooltip from "@/components/PlanetTooltip";
import PointLabel from "@/components/PointLabel";
import { HabitabilityRow, RockyHzPlanet } from "@/lib/types";
import { useJson } from "@/lib/useJson";
import { viridis } from "@/lib/viridis";

const fmt = (value: number | null, digits: number) =>
  value === null ? "—" : value.toFixed(digits);

export default function CandidatesPage() {
  const [count, setCount] = useState(50);
  const { data: topEsiData, failed: topEsiFailed } = useJson<HabitabilityRow[]>(
    "/data/top_esi_candidates.json",
  );
  const { data: rockyData, failed: rockyFailed } = useJson<RockyHzPlanet[]>(
    "/data/rocky_hz_planets.json",
  );
  const rocky = rockyData ?? [];

  const top = (topEsiData ?? []).slice(0, count);

  const points = top.flatMap((d) =>
    d.eq_temp_k !== null && d.esi_score !== null
      ? [
          {
            x: d.radius_earth,
            y: d.eq_temp_k,
            name: d.planet_name,
            esi: d.esi_score,
          },
        ]
      : [],
  );
  const esiValues = points.map((p) => p.esi);
  const esiMin = esiValues.length > 0 ? Math.min(...esiValues) : 0;
  const esiMax = esiValues.length > 0 ? Math.max(...esiValues) : 1;
  const temps = points.map((p) => p.y);
  const tempMin = temps.length > 0 ? Math.floor(Math.min(...temps) / 5) * 5 - 5 : 0;
  const tempMax = temps.length > 0 ? Math.ceil(Math.max(...temps) / 5) * 5 + 5 : 1;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Top Habitable Candidates by ESI</h1>

      {(topEsiFailed || rockyFailed) && <LoadError />}

      <div>
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

      <div className="bg-[#1c1f26] border border-gray-800 rounded-lg max-h-96 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#1c1f26]">
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th className="py-2 px-3">Planet</th>
              <th className="py-2 px-3">Source</th>
              <th className="py-2 px-3">Radius (R⊕)</th>
              <th className="py-2 px-3">Temp (K)</th>
              <th className="py-2 px-3">Flux (S⊕)</th>
              <th className="py-2 px-3">HZ Status</th>
              <th className="py-2 px-3">ESI</th>
            </tr>
          </thead>
          <tbody>
            {top.map((row, i) => (
              <tr key={i} className="border-b border-gray-800">
                <td className="py-2 px-3">{row.planet_name}</td>
                <td className="py-2 px-3">{row.source}</td>
                <td className="py-2 px-3">{fmt(row.radius_earth, 3)}</td>
                <td className="py-2 px-3">{fmt(row.eq_temp_k, 1)}</td>
                <td className="py-2 px-3">{fmt(row.insolation_flux, 3)}</td>
                <td className="py-2 px-3">{row.hz_status}</td>
                <td className="py-2 px-3">{fmt(row.esi_score, 4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <ResponsiveContainer width="100%" height={560}>
              <ScatterChart
                margin={{ top: 24, right: 30, left: 10, bottom: 30 }}
              >
                <CartesianGrid vertical={false} stroke="#2a2e37" />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={["auto", "auto"]}
                  stroke="#999"
                  label={{
                    value: "radius_earth",
                    position: "bottom",
                    fill: "#ccc",
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[tempMin, tempMax]}
                  stroke="#999"
                  label={{
                    value: "eq_temp_k",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#ccc",
                  }}
                />
                <ZAxis range={[110, 110]} />
                <Tooltip
                  content={
                    <PlanetTooltip xLabel="Radius (R⊕)" yLabel="Temp (K)" />
                  }
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
                  strokeWidth={1}
                  isAnimationActive={false}
                >
                  {points.map((p) => (
                    <Cell key={p.name} fill={viridis(p.esi, esiMin, esiMax)} />
                  ))}
                  <LabelList dataKey="name" content={PointLabel} />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <EsiColorbar min={esiMin} max={esiMax} />
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Dashed lines mark Earth&apos;s values (1.0 R⊕, 288 K). ESI here uses
          only radius and equilibrium temperature, so a high-ranking planet can
          still sit outside the habitable zone. Check its HZ status.
        </p>
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
