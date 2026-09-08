import { ArrowRight, Clock, History, Target, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { DebateData } from "@/types/debate";

const STORAGE_KEY = "ai_debate_history";

export function getSavedDebates(): DebateData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DebateData[]) : [];
  } catch {
    return [];
  }
}

export function saveDebateToHistory(debate: DebateData): void {
  if (typeof window === "undefined") return;
  try {
    const current = getSavedDebates();
    const filtered = current.filter((item) => item.id !== debate.id);
    const updated = [debate, ...filtered].slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearDebateHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

interface DebateHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDebate: (debate: DebateData) => void;
}

export function DebateHistoryModal({
  isOpen,
  onClose,
  onSelectDebate,
}: DebateHistoryModalProps) {
  const [debates, setDebates] = useState<DebateData[]>(() =>
    typeof window !== "undefined" ? getSavedDebates() : [],
  );

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setDebates(getSavedDebates());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleClear() {
    clearDebateHistory();
    setDebates([]);
  }

  function handleSelect(debate: DebateData) {
    onSelectDebate(debate);
    onClose();
  }

  const votedDebates = debates.filter((d) => d.user_vote && d.judge_result);
  const correctPredictions = votedDebates.filter(
    (d) => d.user_vote === d.judge_result?.winner,
  );
  const accuracyPct =
    votedDebates.length > 0
      ? Math.round((correctPredictions.length / votedDebates.length) * 100)
      : null;

  const analystTier =
    accuracyPct === null
      ? null
      : accuracyPct >= 80
        ? { title: "Grandmaster Adjudicator", badge: "🏆 Master", color: "text-emerald-300 border-emerald-400/30 bg-emerald-500/10" }
        : accuracyPct >= 60
          ? { title: "Sharp Analyst", badge: "🎯 Sharp", color: "text-violet-300 border-violet-400/30 bg-violet-500/10" }
          : accuracyPct >= 40
            ? { title: "Balanced Observer", badge: "⚖️ Keen", color: "text-amber-300 border-amber-400/30 bg-amber-500/10" }
            : { title: "Contrarian Thinker", badge: "🔍 Contrarian", color: "text-slate-300 border-slate-600 bg-slate-800/40" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      aria-modal="true"
      aria-labelledby="history-modal-title"
    >
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-800 bg-[#0d1322] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
              <History className="size-4" />
            </div>
            <div>
              <h3 id="history-modal-title" className="font-heading text-lg font-semibold text-white">
                Debate History
              </h3>
              <p className="text-xs text-slate-400">
                {debates.length} saved debate{debates.length === 1 ? "" : "s"} in your browser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close dialog"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Lifetime Prediction Accuracy Bar */}
        {votedDebates.length > 0 && (
          <div className="border-b border-slate-800 bg-violet-950/25 px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-lg bg-violet-500/20 text-violet-300">
                  <Target className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-violet-200">
                    Audience Prediction Record
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Your prediction accuracy benchmarked against the AI Judge
                  </p>
                </div>
              </div>
              {analystTier && (
                <span className={`inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border px-3 py-0.5 text-xs font-semibold ${analystTier.color}`}>
                  {analystTier.badge} • {analystTier.title}
                </span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-white/5 bg-slate-900/60 p-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Predictions Cast</p>
                <p className="mt-0.5 font-mono text-base font-bold text-white">{votedDebates.length}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-900/60 p-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Correct Calls</p>
                <p className="mt-0.5 font-mono text-base font-bold text-emerald-400">{correctPredictions.length}</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-900/60 p-2">
                <p className="text-[10px] uppercase tracking-wider text-slate-400">Accuracy Rate</p>
                <p className="mt-0.5 font-mono text-base font-bold text-violet-300">{accuracyPct}%</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {debates.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <History className="mx-auto size-8 text-slate-600 mb-3" />
              <p className="text-sm font-medium">No past debates found.</p>
              <p className="mt-1 text-xs text-slate-600">
                Debates you complete will automatically appear here.
              </p>
            </div>
          ) : (
            debates.map((item) => {
              const winnerTone =
                item.judge_result?.winner === "PRO"
                  ? "text-emerald-300 border-emerald-400/20 bg-emerald-500/10"
                  : item.judge_result?.winner === "CON"
                    ? "text-amber-300 border-amber-400/20 bg-amber-500/10"
                    : "text-violet-300 border-violet-400/20 bg-violet-500/10";

              const formattedDate = new Date(item.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="group flex w-full cursor-pointer items-center justify-between rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4 text-left transition-all hover:border-violet-400/30 hover:bg-slate-800/60"
                >
                  <div className="flex-1 pr-4">
                    <p className="line-clamp-2 text-sm font-medium text-slate-200 group-hover:text-white">
                      {item.topic}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-slate-500" />
                        {formattedDate}
                      </span>
                      {item.judge_result && (
                        <>
                          <span
                            className={`rounded-full border px-2 py-0.5 font-semibold ${winnerTone}`}
                          >
                            Winner: {item.judge_result.winner}
                          </span>
                          <span className="tabular-nums text-slate-500">
                            PRO {item.judge_result.pro_scores.overall.toFixed(1)} vs CON{" "}
                            {item.judge_result.con_scores.overall.toFixed(1)}
                          </span>
                        </>
                      )}
                      {item.user_vote && item.judge_result && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-semibold ${
                            item.user_vote === item.judge_result.winner
                              ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                              : "border-amber-400/30 bg-amber-500/15 text-amber-300"
                          }`}
                        >
                          {item.user_vote === item.judge_result.winner
                            ? `🎯 You called ${item.user_vote} (Match)`
                            : `⚖️ Pick: ${item.user_vote} (Split)`}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-violet-300" />
                </button>
              );
            })
          )}
        </div>

        {debates.length > 0 && (
          <div className="flex justify-between border-t border-slate-800 px-6 py-4">
            <Button
              onClick={handleClear}
              variant="ghost"
              size="sm"
              className="gap-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
            >
              <Trash2 className="size-3.5" /> Clear History
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
