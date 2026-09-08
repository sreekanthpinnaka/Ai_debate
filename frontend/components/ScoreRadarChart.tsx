import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { ScoreBreakdown } from "@/types/debate";

interface ScoreRadarChartProps {
  proScores: ScoreBreakdown;
  conScores: ScoreBreakdown;
}

export function ScoreRadarChart({ proScores, conScores }: ScoreRadarChartProps) {
  const chartData = [
    {
      metric: "Argument Quality",
      PRO: proScores.argument_quality,
      CON: conScores.argument_quality,
      max: 10,
    },
    {
      metric: "Logical Consistency",
      PRO: proScores.logical_consistency,
      CON: conScores.logical_consistency,
      max: 10,
    },
    {
      metric: "Rebuttal Quality",
      PRO: proScores.rebuttal_quality,
      CON: conScores.rebuttal_quality,
      max: 10,
    },
    {
      metric: "Clarity",
      PRO: proScores.clarity,
      CON: conScores.clarity,
      max: 10,
    },
    {
      metric: "Persuasiveness",
      PRO: proScores.persuasiveness,
      CON: conScores.persuasiveness,
      max: 10,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
          5-Axis Comparative Radar
        </h4>
        <span className="text-xs text-slate-500">Scale: 1 – 10</span>
      </div>
      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="#334155" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="metric"
              stroke="#94a3b8"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tick={{ fill: "#64748b", fontSize: 10 }}
              stroke="#1e293b"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                return (
                  <div className="rounded-lg border border-slate-700 bg-slate-900/95 p-3 text-xs shadow-xl backdrop-blur">
                    <p className="mb-1.5 font-semibold text-slate-200">{label}</p>
                    {payload.map((entry) => (
                      <div
                        key={entry.name}
                        className="flex items-center justify-between gap-4 py-0.5"
                      >
                        <span
                          className={
                            entry.name === "PRO" ? "text-emerald-400" : "text-amber-400"
                          }
                        >
                          {entry.name}:
                        </span>
                        <span className="font-semibold tabular-nums text-white">
                          {entry.value} / 10
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: 8, fontSize: 12 }}
              formatter={(value) => (
                <span
                  className={
                    value === "PRO"
                      ? "font-medium text-emerald-400"
                      : "font-medium text-amber-400"
                  }
                >
                  {value}
                </span>
              )}
            />
            <Radar
              name="PRO"
              dataKey="PRO"
              stroke="#34d399"
              fill="#34d399"
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Radar
              name="CON"
              dataKey="CON"
              stroke="#fbbf24"
              fill="#fbbf24"
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
