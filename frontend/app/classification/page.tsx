"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import LoadError from "@/components/LoadError";
import { ModelResult } from "@/lib/types";
import { useJson } from "@/lib/useJson";

export default function ClassificationPage() {
  const { data: modelResults, failed } = useJson<ModelResult[]>(
    "/data/model_results.json",
  );

  const fullTier = (modelResults ?? [])
    .filter((r) => r.Tier === "Full")
    .sort((a, b) => a.F1_mean - b.F1_mean);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Part A: Candidate Classification</h1>
      {failed && <LoadError />}

      <div className="bg-[#1c1f26] border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          Full-Tier Model F1 Comparison
        </h3>
        {fullTier.length > 0 && (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={fullTier} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" domain={[0.9, 1.0]} stroke="#999" />
              <YAxis
                type="category"
                dataKey="Model"
                stroke="#999"
                width={140}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1c1f26",
                  border: "1px solid #333",
                }}
                formatter={(value) => Number(value).toFixed(4)}
              />
              <Bar dataKey="F1_mean" fill="#1f77b4" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-[#1c1f26] border border-gray-800 rounded-lg p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">
          Full-Tier Results (Table)
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th className="py-2 pr-4">Model</th>
              <th className="py-2 pr-4">F1 Mean</th>
              <th className="py-2 pr-4">F1 Std</th>
              <th className="py-2 pr-4">AUC Mean</th>
              <th className="py-2 pr-4">AUC Std</th>
            </tr>
          </thead>
          <tbody>
            {fullTier
              .slice()
              .reverse()
              .map((row) => (
                <tr key={row.Model} className="border-b border-gray-800">
                  <td className="py-2 pr-4">{row.Model}</td>
                  <td className="py-2 pr-4">{row.F1_mean.toFixed(4)}</td>
                  <td className="py-2 pr-4">{row.F1_std.toFixed(4)}</td>
                  <td className="py-2 pr-4">{row.AUC_mean.toFixed(4)}</td>
                  <td className="py-2 pr-4">{row.AUC_std.toFixed(4)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
