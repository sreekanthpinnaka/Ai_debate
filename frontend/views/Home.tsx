import { AlertCircle, BrainCircuit, Gavel, Swords } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { DebateData, DebateEvent, ModelConfig, Winner } from "@/types/debate";
import { streamDebate } from "@/services/api";

import { DebateForm } from "../components/DebateForm";
import { DebateHeader } from "../components/DebateHeader";
import { DebateHistoryModal, saveDebateToHistory } from "../components/DebateHistoryModal";
import { LiveDebate } from "../components/LiveDebate";
import { Debate } from "./Debate";

export function Home() {
  const [debate, setDebate] = useState<DebateData | null>(null);
  const [liveTopic, setLiveTopic] = useState("");
  const [liveEvents, setLiveEvents] = useState<DebateEvent[]>([]);
  const [liveModels, setLiveModels] = useState<ModelConfig | undefined>(undefined);
  const [completedDebateResult, setCompletedDebateResult] = useState<DebateData | null>(null);
  const [error, setError] = useState("");
  const [userVote, setUserVote] = useState<Winner | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const userVoteRef = useRef<Winner | null>(null);

  const handleVote = useCallback((vote: Winner) => {
    setUserVote(vote);
    userVoteRef.current = vote;
  }, []);

  const handleStart = useCallback(async (topic: string, models?: ModelConfig) => {
    setError("");
    setLiveEvents([]);
    setLiveTopic(topic);
    setLiveModels(models);
    setCompletedDebateResult(null);
    setUserVote(null);
    userVoteRef.current = null;
    try {
      const result = await streamDebate(
        topic,
        (event) => {
          setLiveEvents((current) => [...current, event]);
        },
        models,
      );
      // Keep result in completedDebateResult so the user has unlimited time to read rounds & vote
      setCompletedDebateResult(result);
      return result;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The debate could not be completed.");
      setLiveTopic("");
      setCompletedDebateResult(null);
      return null;
    }
  }, []);

  const handleRevealVerdict = useCallback(() => {
    if (!completedDebateResult) return;
    const debateWithVote: DebateData = {
      ...completedDebateResult,
      user_vote: userVoteRef.current,
    };
    saveDebateToHistory(debateWithVote);
    setDebate(debateWithVote);
    setLiveTopic("");
    setCompletedDebateResult(null);
  }, [completedDebateResult]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "start_ai_debate",
      title: "Start AI debate",
      description: "Run the visible three-round AI debate and impartial judge evaluation for a proposition.",
      inputSchema: {
        type: "object",
        properties: { topic: { type: "string", minLength: 5, maxLength: 500 } },
        required: ["topic"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      async execute(input) {
        const topic = typeof input === "object" && input !== null && "topic" in input
          ? String((input as { topic: unknown }).topic).trim()
          : "";
        const words = topic.match(/\p{L}+/gu) ?? [];
        const letterCount = (topic.match(/\p{L}/gu) ?? []).length;
        if (topic.length > 500 || words.length < 3 || letterCount < 8) {
          throw new Error("Enter a complete, meaningful debate proposition.");
        }
        const result = await handleStart(topic);
        if (!result) throw new Error("The debate could not be completed.");
        return { debateId: result.id, status: result.status, winner: result.judge_result?.winner ?? null };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [handleStart]);

  if (liveTopic) {
    return (
      <LiveDebate
        topic={liveTopic}
        events={liveEvents}
        userVote={userVote}
        onVote={handleVote}
        models={liveModels}
        isFinished={Boolean(completedDebateResult)}
        onRevealVerdict={handleRevealVerdict}
      />
    );
  }

  if (debate) {
    return (
      <>
        <Debate
          debate={debate}
          onReset={() => setDebate(null)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onRematch={(models) => {
            const currentTopic = debate.topic;
            setDebate(null);
            void handleStart(currentTopic, models);
          }}
        />
        <DebateHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onSelectDebate={(d) => setDebate(d)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#070b14] text-slate-100 selection:bg-violet-400/30">
      <DebateHeader onOpenHistory={() => setIsHistoryOpen(true)} />
      <main className="relative mx-auto max-w-6xl px-5 pb-20 pt-[7vh] sm:px-8">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
        <section className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-violet-300/15 bg-violet-400/[0.07] px-3 py-1.5 text-xs font-medium text-violet-300">
            <BrainCircuit className="size-3.5" /> Two advocates. One impartial judge.
          </div>
          <h1 className="font-heading text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl">
            Put any idea<br /><span className="text-slate-400">on the debate floor.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Enter a topic and watch two AI agents argue opposing sides while an AI judge scores their reasoning, clarity, and persuasiveness.
          </p>
          <div className="text-left"><DebateForm onSubmit={handleStart} /></div>
          {error && (
            <div role="alert" className="mt-5 flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-4 text-left text-sm text-rose-200">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div><strong className="block font-semibold">Debate interrupted</strong><span className="mt-1 block text-rose-200/75">{error}</span></div>
            </div>
          )}
        </section>
        <section className="relative z-10 mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-3 border-t border-slate-800 pt-7">
          {[[Swords, "Structured rounds", "Opening, rebuttal, closing"], [Gavel, "Rubric scoring", "Five argument dimensions"], [BrainCircuit, "Logic review", "Strengths and weak points"]].map(([Icon, title, copy]) => {
            const FeatureIcon = Icon as typeof Swords;
            return <div key={title as string} className="text-center"><FeatureIcon className="mx-auto size-4 text-slate-600" /><p className="mt-2 text-xs font-semibold text-slate-300">{title as string}</p><p className="mt-1 hidden text-xs text-slate-600 sm:block">{copy as string}</p></div>;
          })}
        </section>
      </main>

      <DebateHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectDebate={(d) => setDebate(d)}
      />
    </div>
  );
}
