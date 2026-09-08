import {
  AlertTriangle,
  Award,
  Gavel,
  Lightbulb,
  Scale,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  Vote,
} from "lucide-react";

import type { JudgeResultData, ScoreBreakdown, Winner } from "@/types/debate";

import { ScoreCard } from "./ScoreCard";
import { ScoreRadarChart } from "./ScoreRadarChart";

function InsightList({ title, items, icon: Icon }: { title: string; items: string[]; icon: typeof ThumbsUp }) {
  return (
    <div>
      <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Icon className="size-4 text-slate-500" aria-hidden="true" /> {title}
      </h4>
      {items.length ? (
        <ul className="space-y-2 text-sm leading-6 text-slate-400">
          {items.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 size-1 shrink-0 rounded-full bg-slate-600" />{item}</li>)}
        </ul>
      ) : <p className="text-sm text-slate-600">No material issues identified.</p>}
    </div>
  );
}

export function JudgeResult({
  result,
  userVote,
  judgeModel,
}: {
  result: JudgeResultData;
  userVote?: Winner | null;
  judgeModel?: string;
}) {
  const winnerTone = result.winner === "PRO" ? "text-emerald-300" : result.winner === "CON" ? "text-amber-300" : "text-violet-300";
  const proOverall = result.pro_scores.overall;
  const conOverall = result.con_scores.overall;
  const margin = Math.abs(proOverall - conOverall);
  const isCorrect = userVote ? userVote === result.winner : false;

  const categories: Array<{ key: keyof Omit<ScoreBreakdown, "overall">; label: string }> = [
    { key: "argument_quality", label: "Argument Quality" },
    { key: "logical_consistency", label: "Logical Consistency" },
    { key: "rebuttal_quality", label: "Rebuttal Quality" },
    { key: "clarity", label: "Clarity" },
    { key: "persuasiveness", label: "Persuasiveness" },
  ];

  let decisiveFactor = "";
  let maxLead = 0;

  if (result.winner === "PRO" || result.winner === "CON") {
    const winnerScores = result.winner === "PRO" ? result.pro_scores : result.con_scores;
    const loserScores = result.winner === "PRO" ? result.con_scores : result.pro_scores;
    for (const cat of categories) {
      const diff = winnerScores[cat.key] - loserScores[cat.key];
      if (diff > maxLead) {
        maxLead = diff;
        decisiveFactor = cat.label;
      }
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-violet-300/15 bg-violet-400/[0.035]">
      <div className="border-b border-violet-300/10 bg-violet-400/[0.045] px-6 py-7 sm:px-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2.5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                <Gavel className="size-4" /> Judge’s decision
              </p>
              {judgeModel && (
                <span className="rounded-md border border-violet-400/25 bg-violet-400/10 px-2 py-0.5 font-mono text-[11px] text-violet-200">
                  {judgeModel}
                </span>
              )}
            </div>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-white">
              Winner: <span className={winnerTone}>{result.winner}</span>
            </h2>
          </div>
          <div className="flex gap-5 text-sm tabular-nums text-slate-400">
            <span>PRO <strong className="ml-1 text-emerald-300">{result.pro_scores.overall.toFixed(1)}</strong></span>
            <span>CON <strong className="ml-1 text-amber-300">{result.con_scores.overall.toFixed(1)}</strong></span>
          </div>
        </div>
        <p className="mt-5 max-w-4xl text-base leading-7 text-slate-300">{result.decision_reason}</p>

        {/* Audience Prediction Outcome Card */}
        {userVote ? (
          <div
            className={`mt-6 rounded-2xl border p-5 sm:p-6 transition-all ${
              isCorrect
                ? "border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-emerald-900/20 to-slate-950/60 shadow-lg shadow-emerald-950/30"
                : "border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-slate-900/50 to-violet-950/30 shadow-lg shadow-amber-950/20"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`grid size-12 place-items-center rounded-xl border text-xl ${
                    isCorrect
                      ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                      : "border-amber-400/40 bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {isCorrect ? <Target className="size-6" /> : <Scale className="size-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Audience Prediction
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                        isCorrect
                          ? "border border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                          : "border border-amber-400/40 bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <Sparkles className="size-3" /> Prediction Confirmed
                        </>
                      ) : (
                        <>
                          <Scale className="size-3" /> Split Decision
                        </>
                      )}
                    </span>
                  </div>
                  <h3 className="mt-1 font-heading text-lg font-semibold text-white">
                    {isCorrect
                      ? "Spot-on Prediction! You called it right."
                      : `Dissenting Verdict: You backed ${userVote}, Judge ruled for ${result.winner}`}
                  </h3>
                </div>
              </div>

              {/* Comparison badges */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <div className="rounded-xl border border-slate-700/80 bg-slate-800/80 px-3.5 py-1.5 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Your Vote</p>
                  <p
                    className={`font-mono text-sm font-bold ${
                      userVote === "PRO"
                        ? "text-emerald-300"
                        : userVote === "CON"
                          ? "text-amber-300"
                          : "text-violet-300"
                    }`}
                  >
                    {userVote}
                  </p>
                </div>
                <span className="font-bold text-slate-500 text-xs">vs</span>
                <div className="rounded-xl border border-slate-700/80 bg-slate-800/80 px-3.5 py-1.5 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Judge Winner</p>
                  <p className={`font-mono text-sm font-bold ${winnerTone}`}>
                    {result.winner}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm">
              <div className="text-slate-300 leading-relaxed">
                {isCorrect ? (
                  <p>
                    Your debate analysis aligned with the AI Judge. You correctly anticipated that{" "}
                    <strong className="text-white">{userVote}</strong> would build the more compelling case,
                    securing victory with a score margin of{" "}
                    <strong className="text-emerald-300">+{margin.toFixed(1)} points</strong> over the opposition.
                  </p>
                ) : (
                  <p>
                    While you favored <strong className="text-white">{userVote}</strong>, the Judge scored{" "}
                    <strong className="text-white">{result.winner}</strong> higher by{" "}
                    <strong className="text-amber-300">+{margin.toFixed(1)} points</strong> overall.
                    Review the category breakdowns below to inspect where the Judge found weaknesses or decisive rebuttals.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-3.5 text-xs text-slate-300 flex flex-col justify-center space-y-2">
                <div>
                  <span className="font-semibold text-violet-300">Decisive Margin Factor:</span>{" "}
                  {decisiveFactor && maxLead > 0 ? (
                    <span>
                      <strong className="text-white">{decisiveFactor}</strong> gave {result.winner} an edge of{" "}
                      <strong className="text-emerald-300">+{maxLead.toFixed(1)} pts</strong>.
                    </span>
                  ) : (
                    <span>Tightly contested scores across all five debate dimensions.</span>
                  )}
                </div>
                <div className="text-slate-400">
                  <span className="font-semibold text-slate-300">Debate Record:</span>{" "}
                  {isCorrect ? (
                    <span className="text-emerald-300">
                      Logged as a correct prediction in your Debate History record.
                    </span>
                  ) : (
                    <span>
                      Logged in your Debate History record. Track your prediction calibration over multiple debates!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/30 p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg border border-slate-700 bg-slate-800/60 text-slate-400 shrink-0">
                <Vote className="size-4" />
              </div>
              <div className="text-xs text-slate-400">
                <p className="font-medium text-slate-300">No Audience Prediction cast for this debate</p>
                <p className="mt-0.5 text-slate-500">
                  In future debates, cast your prediction after Round 3 before revealing the verdict to test your judgment against the AI Judge.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-8 p-6 sm:p-8">
        <ScoreRadarChart proScores={result.pro_scores} conScores={result.con_scores} />

        <div className="grid gap-4 md:grid-cols-2">
          <ScoreCard side="PRO" scores={result.pro_scores} />
          <ScoreCard side="CON" scores={result.con_scores} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300"><Award className="size-4" /> Strongest argument</p>
            <p className="text-sm leading-6 text-slate-300">{result.strongest_argument}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300"><Lightbulb className="size-4" /> Debate summary</p>
            <p className="text-sm leading-6 text-slate-300">{result.debate_summary}</p>
          </div>
        </div>

        <div className="grid gap-8 border-t border-slate-800 pt-7 md:grid-cols-2">
          <div className="space-y-6">
            <p className="font-semibold text-emerald-300">PRO analysis</p>
            <InsightList title="Strengths" items={result.pro_strengths} icon={ThumbsUp} />
            <InsightList title="Weaknesses" items={result.pro_weaknesses} icon={ThumbsDown} />
            <InsightList title="Logical issues" items={result.pro_logical_issues} icon={AlertTriangle} />
          </div>
          <div className="space-y-6 md:border-l md:border-slate-800 md:pl-8">
            <p className="font-semibold text-amber-300">CON analysis</p>
            <InsightList title="Strengths" items={result.con_strengths} icon={ThumbsUp} />
            <InsightList title="Weaknesses" items={result.con_weaknesses} icon={ThumbsDown} />
            <InsightList title="Logical issues" items={result.con_logical_issues} icon={AlertTriangle} />
          </div>
        </div>
      </div>
    </section>
  );
}
