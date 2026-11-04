"use client";

import {
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import LoadError from "@/components/LoadError";
import MetricCard from "@/components/MetricCard";
import { useJson } from "@/lib/useJson";
import { Overview as OverviewType, TargetDistribution } from "@/lib/types";

export default function OverviewPage() {
  const { data: overview, failed: overviewFailed } =
    useJson<OverviewType>("/data/overview.json");
  const { data: targetDist, failed: targetDistFailed } =
    useJson<TargetDistribution>("/data/target_distribution.json");

  const pieData = targetDist
    ? [
        { name: "Confirmed", value: targetDist.Confirmed, color: "#2ca02c" },
        {
          name: "False Positive",
          value: targetDist["False Positive"],
          color: "#d62728",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">
          Exoplanet Candidate Classification & Habitability Analysis
        </h1>
        <ul className="list-disc list-inside text-gray-300 space-y-1">
          <li>
            <strong>Part A</strong>: Classifying KOI CANDIDATE rows as likely
            real planets or false positives, across six models and three feature
            tiers.
          </li>
          <li>
            <strong>Part B</strong>: Habitable-zone (HZ) status and Earth
            Similarity Index (ESI) for confirmed + predicted-real planets.
          </li>
        </ul>
      </div>
      {(overviewFailed || targetDistFailed) && <LoadError />}
      {targetDist && (
        <div className="bg-[#1c1f26] border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            Disposition Breakdown (Labeled Set)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={100}
                isAnimationActive={false}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#1c1f26",
                  border: "1px solid #333 ",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {overview && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Key Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <MetricCard
              label="Total KOI Rows"
              value={overview.total_koi_rows.toLocaleString()}
            />
            <MetricCard
              label="Labeled (Confirmed + FP)"
              value={overview.labeled_rows.toLocaleString()}
            />
            <MetricCard
              label="Candidates Evaluated"
              value={overview.candidates_evaluated.toLocaleString()}
            />
            <MetricCard
              label="Predicted Real"
              value={overview.predicted_real.toLocaleString()}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="Planets Evaluated"
              value={overview.planets_evaluated.toLocaleString()}
            />
            <MetricCard
              label="In HZ (Conservative or Optimistic)"
              value={overview.in_hz_count.toLocaleString()}
            />
            <MetricCard
              label="Conservative HZ Rate"
              value={`${overview.conservative_hz_pct}%`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
