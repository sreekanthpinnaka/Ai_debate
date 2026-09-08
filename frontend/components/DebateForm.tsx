import { ArrowRight, ChevronDown, ChevronUp, Dices, SlidersHorizontal, Sparkles } from "lucide-react";
import { SyntheticEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ModelConfig } from "@/types/debate";
import { ModelSelector } from "./ModelSelector";

const TOPIC_CATEGORIES: Record<string, string[]> = {
  "Tech & AI": [
    "Should AI-generated art receive copyright protection?",
    "Should companies adopt a four-day workweek powered by AI?",
    "Should autonomous vehicles be held to higher safety standards than human drivers?",
  ],
  "Ethics & Law": [
    "Should social media companies be legally liable for misinformation?",
    "Should higher education be completely tuition-free?",
    "Should deepfake creation without consent be classified as a felony?",
  ],
  "Science & Future": [
    "Should governments prioritize space exploration over terrestrial conservation?",
    "Should nuclear power be the cornerstone of clean energy transition?",
    "Should human genetic editing be permitted for non-medical enhancements?",
  ],
  "Work & Society": [
    "Is fully remote work better for organizational innovation than in-office work?",
    "Should standardized testing be eliminated from college admissions?",
    "Would a universal basic income reduce human work ethic?",
  ],
};

const ALL_TOPICS = Object.values(TOPIC_CATEGORIES).flat();

interface DebateFormProps {
  onSubmit: (topic: string, models?: ModelConfig) => void;
  disabled?: boolean;
}

export function DebateForm({ onSubmit, disabled = false }: DebateFormProps) {
  const [topic, setTopic] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tech & AI");
  const [validationError, setValidationError] = useState("");

  const [showModelConfig, setShowModelConfig] = useState(false);
  const [syncDebaters, setSyncDebaters] = useState(false);
  const [proModel, setProModel] = useState("gpt-4o-mini");
  const [conModel, setConModel] = useState("gpt-4o-mini");
  const [judgeModel, setJudgeModel] = useState("gpt-4o-mini");

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = topic.trim();
    const words = cleaned.match(/\p{L}+/gu) ?? [];
    const letterCount = (cleaned.match(/\p{L}/gu) ?? []).length;
    if (words.length < 3 || letterCount < 8) {
      setValidationError("Enter a complete, meaningful debate proposition.");
      return;
    }
    setValidationError("");
    try {
      onSubmit(cleaned, {
        pro_model: proModel,
        con_model: conModel,
        judge_model: judgeModel,
      });
    } catch {
      // Errors are handled and displayed in the alert banner
    }
  }

  function handleSurpriseMe() {
    const randomTopic = ALL_TOPICS[Math.floor(Math.random() * ALL_TOPICS.length)];
    setTopic(randomTopic);
    setValidationError("");
  }

  return (
    <form onSubmit={submit} className="mt-9" aria-label="Start a debate">
      <div className="rounded-2xl border border-slate-700/70 bg-slate-900/75 p-2 shadow-2xl shadow-black/20 focus-within:border-violet-400/60">
        <Textarea
          value={topic}
          onChange={(event) => setTopic(event.target.value.slice(0, 500))}
          placeholder="Should social media companies be responsible for misinformation?"
          aria-label="Debate topic"
          aria-invalid={Boolean(validationError)}
          disabled={disabled}
          className="min-h-28 resize-none border-0 bg-transparent px-4 py-3 text-base leading-7 text-white shadow-none focus-visible:ring-0 md:text-base"
        />
        <div className="flex items-center justify-between border-t border-slate-800 px-3 pt-2">
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums text-slate-600">{topic.length}/500</span>
            <button
              type="button"
              onClick={handleSurpriseMe}
              className="flex items-center gap-1.5 rounded-lg border border-violet-400/20 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-300 transition hover:bg-violet-500/20 hover:text-violet-200"
            >
              <Dices className="size-3.5" />
              <span>Surprise Me</span>
            </button>
          </div>
          <Button
            type="submit"
            disabled={disabled}
            size="lg"
            className="h-11 rounded-xl bg-violet-500 px-5 text-white hover:bg-violet-400"
          >
            <Sparkles className="size-4" /> Start Debate <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
      {validationError && <p className="mt-2 text-sm text-rose-300">{validationError}</p>}

      {/* Model Selection Toggle */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowModelConfig(!showModelConfig)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-violet-400/30 hover:bg-slate-800 hover:text-white"
        >
          <SlidersHorizontal className="size-3.5 text-violet-400" />
          <span>
            Models:{" "}
            <strong className="text-emerald-400">PRO ({proModel})</strong> vs{" "}
            <strong className="text-amber-400">CON ({conModel})</strong> ·{" "}
            <strong className="text-violet-400">Judge ({judgeModel})</strong>
          </span>
          {showModelConfig ? (
            <ChevronUp className="size-3.5 text-slate-500" />
          ) : (
            <ChevronDown className="size-3.5 text-slate-500" />
          )}
        </button>

        {showModelConfig && (
          <div className="mt-3 animate-in fade-in duration-200">
            <ModelSelector
              proModel={proModel}
              conModel={conModel}
              judgeModel={judgeModel}
              onProChange={setProModel}
              onConChange={setConModel}
              onJudgeChange={setJudgeModel}
              syncDebaters={syncDebaters}
              onSyncToggle={(val) => {
                setSyncDebaters(val);
                if (val) setConModel(proModel);
              }}
            />
          </div>
        )}
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        Family-friendly topics only. Explicit language and instructions aimed at changing the AI agents are rejected.
      </p>

      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            Categories
          </span>
          {Object.keys(TOPIC_CATEGORIES).map((cat) => (
            <button
              type="button"
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedCategory === cat
                  ? "bg-violet-500/20 text-violet-300 border border-violet-400/30"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TOPIC_CATEGORIES[selectedCategory]?.map((example) => (
            <button
              type="button"
              key={example}
              onClick={() => {
                setTopic(example);
                setValidationError("");
              }}
              className="rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-400 transition hover:border-slate-600 hover:text-slate-200"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
