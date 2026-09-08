import { ArrowRight, Check, Circle, Gavel, LoaderCircle, ShieldCheck, ShieldX, Target, Vote } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { DebateEvent, ModelConfig, RoundType, Winner } from "@/types/debate";

import { DebateHeader } from "./DebateHeader";

const ROUNDS: Array<{ number: number; type: RoundType; label: string }> = [
  { number: 1, type: "opening", label: "Opening arguments" },
  { number: 2, type: "rebuttal", label: "Rebuttals" },
  { number: 3, type: "closing", label: "Closing arguments" },
];

type AgentStatus = "queued" | "running" | "complete";

function getAgentState(
  events: DebateEvent[],
  roundNumber: number,
  side: "PRO" | "CON",
): { status: AgentStatus; content: string } {
  const relevant = events.filter(
    (event) => event.round_number === roundNumber && event.side === side,
  );
  const completed = relevant.find((event) => event.type === "agent_completed");
  if (completed) return { status: "complete", content: completed.content ?? "" };

  const chunks = relevant
    .filter((event) => event.type === "agent_chunk" && event.delta)
    .map((event) => event.delta)
    .join("");

  if (relevant.some((event) => event.type === "agent_started") || chunks.length > 0) {
    return { status: "running", content: chunks };
  }
  return { status: "queued", content: "" };
}

function LiveAgentCard({
  side,
  status,
  content,
  modelName,
}: {
  side: "PRO" | "CON";
  status: AgentStatus;
  content: string;
  modelName?: string | null;
}) {
  const isPro = side === "PRO";
  const Icon = isPro ? ShieldCheck : ShieldX;
  const accent = isPro ? "text-emerald-300" : "text-amber-300";
  const border = isPro ? "border-emerald-400/15" : "border-amber-400/15";

  return (
    <article
      className={`min-h-40 rounded-2xl border bg-slate-900/60 p-5 transition-all duration-500 ${border} ${status === "running" ? "shadow-lg shadow-violet-950/20" : ""}`}
      aria-live="polite"
    >
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-2 text-sm font-semibold ${accent}`}>
            <Icon className="size-4" /> {side}
          </span>
          {modelName && (
            <span className="rounded-md border border-slate-700/60 bg-slate-800/80 px-2 py-0.5 font-mono text-[11px] text-slate-300">
              {modelName}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          {status === "complete" ? (
            <><Check className="size-3.5 text-emerald-400" /> Complete</>
          ) : status === "running" ? (
            <><LoaderCircle className="size-3.5 animate-spin text-violet-300" /> Composing</>
          ) : (
            <><Circle className="size-3" /> Queued</>
          )}
        </span>
      </div>
      {content ? (
        <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-slate-300 animate-in fade-in duration-300">
          {content}
          {status === "running" && (
            <span className="ml-1 inline-block h-4 w-1.5 animate-pulse bg-violet-400 align-middle" />
          )}
        </p>
      ) : (
        <div className="mt-5 space-y-3" aria-hidden="true">
          {["w-full", "w-11/12", "w-4/5"].map((width) => (
            <span
              key={width}
              className={`block h-2 rounded-full ${width} ${status === "running" ? "animate-pulse bg-slate-700" : "bg-slate-800/70"}`}
            />
          ))}
        </div>
      )}
    </article>
  );
}

interface LiveDebateProps {
  topic: string;
  events: DebateEvent[];
  userVote?: Winner | null;
  onVote?: (vote: Winner) => void;
  models?: ModelConfig;
  isFinished?: boolean;
  onRevealVerdict?: () => void;
}

export function LiveDebate({
  topic,
  events,
  userVote,
  onVote,
  models,
  isFinished = false,
  onRevealVerdict,
}: LiveDebateProps) {
  const startedEvent = events.find((event) => event.type === "debate_started");
  const debateStarted = Boolean(startedEvent) || events.length > 0;
  const proModel = models?.pro_model || startedEvent?.pro_model;
  const conModel = models?.con_model || startedEvent?.con_model;
  const judgeModel = models?.judge_model || startedEvent?.judge_model;

  const completedAgents = events.filter((event) => event.type === "agent_completed").length;
  const judgeStarted = events.some((event) => event.type === "judge_started");
  const judgeCompleted = events.some((event) => event.type === "judge_completed");
  const completedUnits = completedAgents + (judgeCompleted ? 1 : 0);
  const progress = (completedUnits / 7) * 100;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      <DebateHeader compact />
      <main className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <section className="sticky top-0 z-20 -mx-5 border-y border-slate-800 bg-[#070b14]/95 px-5 py-5 backdrop-blur sm:-mx-8 sm:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                  <span className="size-2 animate-pulse rounded-full bg-rose-400" />
                  {debateStarted ? "Live debate" : "Reviewing proposition"}
                </p>
                <h1 className="mt-2 max-w-4xl font-heading text-xl font-semibold leading-snug text-white sm:text-2xl">
                  {topic}
                </h1>
                {(proModel || conModel || judgeModel) && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                    {proModel && (
                      <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[11px] text-emerald-300">
                        PRO: {proModel}
                      </span>
                    )}
                    {conModel && (
                      <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[11px] text-amber-300">
                        CON: {conModel}
                      </span>
                    )}
                    {judgeModel && (
                      <span className="rounded-md border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 font-mono text-[11px] text-violet-300">
                        Judge: {judgeModel}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <span className="shrink-0 text-sm tabular-nums text-slate-500">
                {debateStarted ? `${completedUnits} of 7 tasks complete` : "Safety and quality check"}
              </span>
            </div>
            <Progress
              value={progress}
              aria-label={`${Math.round(progress)} percent complete`}
              className="mt-4 [&_[data-slot=progress-indicator]]:bg-violet-400"
            />
          </div>
        </section>

        <div className="mt-9 space-y-10">
          {ROUNDS.map((round) => {
            const pro = getAgentState(events, round.number, "PRO");
            const con = getAgentState(events, round.number, "CON");
            const roundComplete = pro.status === "complete" && con.status === "complete";
            const roundActive = pro.status === "running" || con.status === "running";
            return (
              <section key={round.type} className={roundActive || roundComplete ? "opacity-100" : "opacity-45"}>
                <div className="mb-4 flex items-center gap-4">
                  <span className={`grid size-7 place-items-center rounded-full border text-xs font-semibold ${roundComplete ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : roundActive ? "border-violet-400/30 bg-violet-400/10 text-violet-300" : "border-slate-700 bg-slate-900 text-slate-500"}`}>
                    {roundComplete ? <Check className="size-3.5" /> : round.number}
                  </span>
                  <h2 className="font-heading text-lg font-semibold text-slate-100">{round.label}</h2>
                  <span className="h-px flex-1 bg-slate-800" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <LiveAgentCard side="PRO" status={pro.status} content={pro.content} modelName={proModel} />
                  <LiveAgentCard side="CON" status={con.status} content={con.content} modelName={conModel} />
                </div>
              </section>
            );
          })}

          {completedAgents >= 6 && onVote && (
            <section className="rounded-2xl border border-violet-400/30 bg-violet-500/10 p-5 sm:p-6 shadow-lg shadow-violet-950/20 animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-11 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/20 text-violet-300 shrink-0">
                    <Vote className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
                        Audience Prediction Challenge
                      </p>
                      {userVote && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                          <Check className="size-3" /> Locked In
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-white mt-0.5">
                      Who made the stronger case? Cast your prediction to test your judgment against the Judge.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {(["PRO", "CON", "TIE"] as Winner[]).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => onVote(choice)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                        userVote === choice
                          ? choice === "PRO"
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-300 scale-105"
                            : choice === "CON"
                              ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-900/40 ring-2 ring-amber-300 scale-105 font-bold"
                              : "bg-violet-500 text-white shadow-lg shadow-violet-900/40 ring-2 ring-violet-300 scale-105"
                          : "bg-slate-800/90 text-slate-300 border border-slate-700 hover:border-slate-500 hover:text-white"
                      }`}
                    >
                      {choice === "PRO" ? "🛡️ PRO" : choice === "CON" ? "⚔️ CON" : "⚖️ TIE"}
                    </button>
                  ))}
                </div>
              </div>

              {userVote && (
                <div className="mt-4 rounded-xl border border-violet-400/20 bg-slate-900/50 p-3 text-xs text-violet-200/90 flex items-center gap-2">
                  <Target className="size-4 text-violet-400 shrink-0" />
                  <span>
                    Your prediction is locked as <strong className="text-white underline decoration-violet-400">{userVote}</strong>.
                    When you reveal the verdict, we&apos;ll benchmark your pick against the AI Judge&apos;s 5 scoring rubrics and update your career prediction accuracy!
                  </span>
                </div>
              )}

              {(isFinished || judgeCompleted) && onRevealVerdict && (
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-violet-400/20 pt-4 animate-in fade-in duration-300">
                  <div className="text-xs text-slate-300">
                    {userVote ? (
                      <span>
                        Prediction recorded. Ready to inspect the scorecard, radar chart, and rubric breakdown?
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        You haven&apos;t cast a vote yet. You can pick PRO, CON, or TIE above, or reveal the judge&apos;s decision directly.
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={onRevealVerdict}
                    size="lg"
                    className="h-11 gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 font-semibold text-white shadow-xl shadow-violet-950/60 hover:from-violet-500 hover:to-indigo-500 shrink-0 animate-pulse"
                  >
                    <Gavel className="size-4" /> Reveal Judge&apos;s Verdict <ArrowRight className="size-4" />
                  </Button>
                </div>
              )}
            </section>
          )}

          <section className={`rounded-2xl border p-5 transition-all ${isFinished || judgeCompleted ? "border-emerald-400/30 bg-emerald-500/[0.06]" : judgeStarted ? "border-violet-300/20 bg-violet-400/[0.05]" : "border-slate-800 bg-slate-900/30 opacity-45"}`} aria-live="polite">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-2.5 font-heading text-lg font-semibold text-slate-100">
                  <Gavel className="size-5 text-violet-300" /> Judge evaluation
                </span>
                {judgeModel && (
                  <span className="rounded-md border border-violet-400/25 bg-violet-400/10 px-2 py-0.5 font-mono text-[11px] text-violet-200">
                    {judgeModel}
                  </span>
                )}
                {(isFinished || judgeCompleted) && (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                    Verdict Sealed & Ready
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-xs font-medium text-slate-400">
                  {isFinished || judgeCompleted ? (
                    <><Check className="size-3.5 text-emerald-400" /> Evaluation completed</>
                  ) : judgeStarted ? (
                    <><LoaderCircle className="size-3.5 animate-spin text-violet-300" /> Reviewing full transcript</>
                  ) : (
                    <><Circle className="size-3" /> Waiting for closing arguments</>
                  )}
                </span>
                {(isFinished || judgeCompleted) && onRevealVerdict && (
                  <Button
                    type="button"
                    onClick={onRevealVerdict}
                    size="sm"
                    className="h-9 gap-1.5 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white hover:bg-violet-500"
                  >
                    Reveal Verdict <ArrowRight className="size-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* Floating Action Bar when verdict is ready */}
          {(isFinished || judgeCompleted) && onRevealVerdict && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-lg rounded-2xl border border-violet-400/40 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-violet-500/20 text-violet-300 shrink-0">
                  <Gavel className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-white">Judge&apos;s verdict is ready</p>
                  <p className="text-[11px] text-slate-400">
                    {userVote ? `Your vote: ${userVote}` : "Read above & vote, or reveal now"}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={onRevealVerdict}
                size="sm"
                className="h-8 gap-1 rounded-lg bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-500 shrink-0"
              >
                Reveal <ArrowRight className="size-3" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
