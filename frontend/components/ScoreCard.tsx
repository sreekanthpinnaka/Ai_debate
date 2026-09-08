import { Progress } from "@/components/ui/progress";
import type { ScoreBreakdown } from "@/types/debate";

const CATEGORIES: Array<[keyof Omit<ScoreBreakdown, "overall">, string]> = [
  ["argument_quality", "Argument quality"],
  ["logical_consistency", "Logical consistency"],
  ["rebuttal_quality", "Rebuttal quality"],
  ["clarity", "Clarity"],
  ["persuasiveness", "Persuasiveness"],
];

export function ScoreCard({ side, scores }: { side: "PRO" | "CON"; scores: ScoreBreakdown }) {
  const isPro = side === "PRO";
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5">
      <div className="mb-5 flex items-end justify-between">
        <span className={isPro ? "font-semibold text-emerald-300" : "font-semibold text-amber-300"}>{side}</span>
        <div className="text-right">
          <span className="text-3xl font-semibold tabular-nums text-white">{scores.overall.toFixed(1)}</span>
          <span className="text-sm text-slate-500"> / 10</span>
        </div>
      </div>
      <div className="space-y-4">
        {CATEGORIES.map(([key, label]) => (
          <div key={key}>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-slate-400">{label}</span>
              <span className="tabular-nums text-slate-300">{scores[key]}/10</span>
            </div>
            <Progress
              value={scores[key] * 10}
              aria-label={`${side} ${label}: ${scores[key]} out of 10`}
              className={isPro ? "[&_[data-slot=progress-indicator]]:bg-emerald-400" : "[&_[data-slot=progress-indicator]]:bg-amber-400"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
