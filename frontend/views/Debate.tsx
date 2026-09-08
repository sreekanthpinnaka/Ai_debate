import { ArrowLeft, Check, Copy, Download, RotateCcw, SlidersHorizontal, Swords } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { DebateData, ModelConfig } from "@/types/debate";

import { DebateAudioPlayer } from "../components/DebateAudioPlayer";
import { DebateHeader } from "../components/DebateHeader";
import { DebateRound } from "../components/DebateRound";
import { JudgeResult } from "../components/JudgeResult";
import { ModelSelector } from "../components/ModelSelector";

function generateMarkdown(debate: DebateData): string {
  let md = `# AI Debate: ${debate.topic}\n\n`;
  md += `**Date**: ${new Date(debate.created_at).toLocaleString()}\n`;
  if (debate.pro_model || debate.con_model || debate.judge_model) {
    md += `**Models**: PRO (${debate.pro_model || "default"}), CON (${debate.con_model || "default"}), Judge (${debate.judge_model || "default"})\n`;
  }
  if (debate.judge_result) {
    md += `**Verdict**: ${debate.judge_result.winner} (PRO: ${debate.judge_result.pro_scores.overall.toFixed(1)} / 10, CON: ${debate.judge_result.con_scores.overall.toFixed(1)} / 10)\n`;
  }
  if (debate.user_vote) {
    const isMatch = debate.judge_result && debate.user_vote === debate.judge_result.winner;
    md += `**Audience Prediction**: ${debate.user_vote} (${isMatch ? "Spot-on Prediction / Match" : "Split Decision"})\n`;
  }
  md += `\n## Debate Rounds\n\n`;
  for (const r of debate.rounds) {
    const type = r.round_type.toUpperCase();
    md += `### Round ${r.round_number}: ${type}\n\n`;
    md += `#### PRO\n${r.pro_response}\n\n`;
    md += `#### CON\n${r.con_response}\n\n`;
  }
  if (debate.judge_result) {
    const j = debate.judge_result;
    md += `## Judge Evaluation\n\n`;
    md += `**Decision Reason**:\n${j.decision_reason}\n\n`;
    md += `**Debate Summary**:\n${j.debate_summary}\n\n`;
    md += `**Strongest Argument**:\n${j.strongest_argument}\n\n`;
    md += `### Scores\n\n`;
    md += `| Category | PRO | CON |\n|---|---|---|\n`;
    md += `| Argument Quality | ${j.pro_scores.argument_quality} | ${j.con_scores.argument_quality} |\n`;
    md += `| Logical Consistency | ${j.pro_scores.logical_consistency} | ${j.con_scores.logical_consistency} |\n`;
    md += `| Rebuttal Quality | ${j.pro_scores.rebuttal_quality} | ${j.con_scores.rebuttal_quality} |\n`;
    md += `| Clarity | ${j.pro_scores.clarity} | ${j.con_scores.clarity} |\n`;
    md += `| Persuasiveness | ${j.pro_scores.persuasiveness} | ${j.con_scores.persuasiveness} |\n`;
    md += `| **Overall** | **${j.pro_scores.overall.toFixed(1)}** | **${j.con_scores.overall.toFixed(1)}** |\n\n`;
    md += `### PRO Analysis\n`;
    for (const s of j.pro_strengths) md += `- **Strength**: ${s}\n`;
    for (const w of j.pro_weaknesses) md += `- **Weakness**: ${w}\n`;
    for (const li of j.pro_logical_issues) md += `- **Logical Issue**: ${li}\n`;
    md += `\n### CON Analysis\n`;
    for (const s of j.con_strengths) md += `- **Strength**: ${s}\n`;
    for (const w of j.con_weaknesses) md += `- **Weakness**: ${w}\n`;
    for (const li of j.con_logical_issues) md += `- **Logical Issue**: ${li}\n`;
  }
  return md;
}

export function Debate({
  debate,
  onReset,
  onOpenHistory,
  onRematch,
}: {
  debate: DebateData;
  onReset: () => void;
  onOpenHistory?: () => void;
  onRematch?: (models: ModelConfig) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showRematchModal, setShowRematchModal] = useState(false);
  const [rematchPro, setRematchPro] = useState(debate.pro_model || "gpt-4o-mini");
  const [rematchCon, setRematchCon] = useState(debate.con_model || "gpt-4o-mini");
  const [rematchJudge, setRematchJudge] = useState(debate.judge_model || "gpt-4o-mini");

  function handleExportMarkdown() {
    const md = generateMarkdown(debate);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debate-${debate.id.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopySummary() {
    const voteText = debate.user_vote
      ? `\nAudience Prediction: ${debate.user_vote} (${debate.user_vote === debate.judge_result?.winner ? "Match" : "Split"})`
      : "";
    const summary = `AI Debate: "${debate.topic}"\nWinner: ${debate.judge_result?.winner ?? "Pending"}\nPRO: ${debate.judge_result?.pro_scores.overall.toFixed(1) ?? "-"} / 10 | CON: ${debate.judge_result?.con_scores.overall.toFixed(1) ?? "-"}${voteText}\nDecision: ${debate.judge_result?.decision_reason ?? ""}`;
    void navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100">
      <DebateHeader compact onOpenHistory={onOpenHistory} />
      <main className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-100"
          >
            <ArrowLeft className="size-4" /> New proposition
          </button>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopySummary}
              variant="outline"
              size="sm"
              className="gap-1.5 border-slate-800 bg-slate-900/60 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-400" /> Copied
                </>
              ) : (
                <>
                  <Copy className="size-3.5" /> Copy Summary
                </>
              )}
            </Button>
            <Button
              onClick={handleExportMarkdown}
              variant="outline"
              size="sm"
              className="gap-1.5 border-slate-800 bg-slate-900/60 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <Download className="size-3.5" /> Export Markdown
            </Button>
          </div>
        </div>

        <section className="mb-8 border-y border-slate-800 py-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
            The proposition
          </p>
          <h1 className="mx-auto mt-3 max-w-4xl font-heading text-3xl font-semibold leading-tight text-white sm:text-4xl">
            {debate.topic}
          </h1>
          {(debate.pro_model || debate.con_model || debate.judge_model) && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              {debate.pro_model && (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 font-mono text-emerald-300">
                  PRO: {debate.pro_model}
                </span>
              )}
              {debate.con_model && (
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 font-mono text-amber-300">
                  CON: {debate.con_model}
                </span>
              )}
              {debate.judge_model && (
                <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 font-mono text-violet-300">
                  Judge: {debate.judge_model}
                </span>
              )}
              {onRematch && (
                <button
                  type="button"
                  onClick={() => setShowRematchModal(!showRematchModal)}
                  className="flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/20 px-3 py-1 font-medium text-violet-200 transition hover:bg-violet-500/30 hover:text-white"
                >
                  <SlidersHorizontal className="size-3 text-violet-300" />
                  <span>Change Models / Rematch</span>
                </button>
              )}
            </div>
          )}

          {showRematchModal && onRematch && (
            <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-violet-400/30 bg-slate-900/95 p-5 shadow-2xl text-left backdrop-blur animate-in fade-in duration-200">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-heading text-base font-semibold text-white flex items-center gap-2">
                    <Swords className="size-4 text-violet-400" /> Run Rematch with Different Models
                  </h3>
                  <p className="text-xs text-slate-400">
                    Switch models for PRO, CON, or Judge on this proposition or swap sides.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    onRematch({
                      pro_model: rematchPro,
                      con_model: rematchCon,
                      judge_model: rematchJudge,
                    });
                  }}
                  className="h-9 gap-1.5 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white hover:bg-violet-500"
                >
                  <Swords className="size-3.5" /> Start Rematch
                </Button>
              </div>

              <ModelSelector
                proModel={rematchPro}
                conModel={rematchCon}
                judgeModel={rematchJudge}
                onProChange={setRematchPro}
                onConChange={setRematchCon}
                onJudgeChange={setRematchJudge}
              />
            </div>
          )}
        </section>

        <div className="mb-10">
          <DebateAudioPlayer debate={debate} />
        </div>

        <div className="space-y-12">
          {debate.rounds.map((round) => (
            <DebateRound
              key={round.round_number}
              round={round}
              proModel={debate.pro_model}
              conModel={debate.con_model}
            />
          ))}
          {debate.judge_result && (
            <JudgeResult
              result={debate.judge_result}
              userVote={debate.user_vote}
              judgeModel={debate.judge_model}
            />
          )}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {onRematch && (
            <Button
              onClick={() => {
                setShowRematchModal(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              variant="default"
              size="lg"
              className="h-11 rounded-xl bg-violet-600 px-6 font-semibold text-white hover:bg-violet-500 shadow-lg shadow-violet-950/40"
            >
              <SlidersHorizontal className="size-4" /> Change Models & Rematch
            </Button>
          )}
          <Button
            onClick={onReset}
            variant="outline"
            size="lg"
            className="h-11 border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
          >
            <RotateCcw className="size-4" /> New proposition
          </Button>
        </div>
      </main>
    </div>
  );
}
