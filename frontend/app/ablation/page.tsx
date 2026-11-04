"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import LoadError from "@/components/LoadError";
import { ModelResult, AblationPivotRow } from "@/lib/types";
import { useJson } from "@/lib/useJson";

export default function AblationPage() {
  const { data: modelResultsData, failed: modelResultsFailed } = useJson<
    ModelResult[]
  >("/data/model_results.json");
  const { data: pivot, failed: pivotFailed } = useJson<AblationPivotRow[]>(
    "/data/ablation_pivot.json",
  );
  const modelResults = modelResultsData ?? [];

  const tierOrder = ["Full", "No-score", "Raw physical"];

  const chartData = Array.from(new Set(modelResults.map((r) => r.Model))).map(
    (model) => {
      const row: Record<string, number | string> = { Model: model };
      tierOrder.forEach((tier) => {
        const match = modelResults.find(
          (r) => r.Model === model && r.Tier === tier,
        );
        row[tier] = match ? match.F1_mean : 0;
      });
      return row;
    },
  );

  const pivotSorted = [...(pivot ?? [])].sort(
    (a, b) => b.Full_minus_RawPhysical - a.Full_minus_RawPhysical,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-3">Feature Tier Ablation Study</h1>
        <p className="text-gray-300">
          Comparing <strong>Full</strong>, <strong>No-score</strong>, and{" "}
          <strong>Raw physical</strong> feature tiers to isolate how much
          accuracy comes from NASA&apos;s vetting-pipeline outputs (
          <code className="bg-gray-800 px-1 rounded">koi_score</code>,{" "}
          <code className="bg-gray-800 px-1 rounded">koi_fpflag_*</code>) versus
          raw physical measurements.
        </p>
      </div>

      {(modelResultsFailed || pivotFailed) && <LoadError />}

      <div className="bg-[#1c1f26] border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">F1 Score Across Tiers</h3>
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis
                dataKey="Model"
                stroke="#999"
                angle={-20}
                textAnchor="end"
                height={80}
              />
              <YAxis domain={[0.9, 1.0]} stroke="#999" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1c1f26",
                  border: "1px solid #333",
                }}
                formatter={(value) => Number(value).toFixed(4)}
              />
              <Legend />
              <Bar dataKey="Full" fill="#6366f1" />
              <Bar dataKey="No-score" fill="#f59e0b" />
              <Bar dataKey="Raw physical" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-[#1c1f26] border border-gray-800 rounded-lg p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">F1 by Tier (Table)</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-700">
              <th className="py-2 pr-4">Model</th>
              <th className="py-2 pr-4">Full</th>
              <th className="py-2 pr-4">No-score</th>
              <th className="py-2 pr-4">Raw physical</th>
              <th className="py-2 pr-4">Full − Raw Physical</th>
            </tr>
          </thead>
          <tbody>
            {pivotSorted.map((row) => (
              <tr key={row.Model} className="border-b border-gray-800">
                <td className="py-2 pr-4">{row.Model}</td>
                <td className="py-2 pr-4">{row.Full.toFixed(4)}</td>
                <td className="py-2 pr-4">{row["No-score"].toFixed(4)}</td>
                <td className="py-2 pr-4">{row["Raw physical"].toFixed(4)}</td>
                <td className="py-2 pr-4">
                  {row.Full_minus_RawPhysical.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#1c1f26] border border-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">Finding</h3>
        <p className="text-gray-300">
          Moving from Full to Raw physical features, tree-based models (XGBoost,
          Gradient Boosting, Random Forest) lose 2.1–2.5 F1 points, the MLP
          loses 3.4, and linear/kernel models (Logistic Regression, SVM) lose
          4.4–4.9. Raw physical features alone still yield F1 0.93–0.97,
          confirming real physical signal exists independent of the vetting
          pipeline.
        </p>
      </div>
    </div>
  );
}
