import { ArrowLeftRight, Check, ChevronDown, Cpu, Sparkles } from "lucide-react";
import { useState } from "react";

import { AVAILABLE_MODELS, MATCHUP_PRESETS } from "@/constants/models";

interface ModelSelectorProps {
  proModel: string;
  conModel: string;
  judgeModel: string;
  onProChange: (model: string) => void;
  onConChange: (model: string) => void;
  onJudgeChange: (model: string) => void;
  syncDebaters?: boolean;
  onSyncToggle?: (sync: boolean) => void;
  compact?: boolean;
}

function SingleModelPicker({
  label,
  accentColor,
  icon,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  accentColor: "emerald" | "amber" | "violet";
  icon: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedPreset = AVAILABLE_MODELS.find((m) => m.id.toLowerCase() === value.toLowerCase());

  const colorStyles = {
    emerald: {
      text: "text-emerald-400",
      border: "border-emerald-500/40",
      focus: "focus:border-emerald-400",
      badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    },
    amber: {
      text: "text-amber-400",
      border: "border-amber-500/40",
      focus: "focus:border-amber-400",
      badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    },
    violet: {
      text: "text-violet-400",
      border: "border-violet-500/40",
      focus: "focus:border-violet-400",
      badge: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    },
  }[accentColor];

  return (
    <div className={`space-y-2 rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <div className="flex items-center justify-between">
        <label className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${colorStyles.text}`}>
          <span>{icon}</span> {label}
        </label>
        {selectedPreset && (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${colorStyles.badge}`}>
            {selectedPreset.category}
          </span>
        )}
      </div>

      {/* Dropdown toggle */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex w-full items-center justify-between rounded-lg border border-slate-700/80 bg-slate-800/90 px-3 py-2 text-left text-xs font-medium text-slate-200 transition hover:border-slate-500 ${colorStyles.focus}`}
        >
          <span className="font-mono text-xs">{value || "Select model..."}</span>
          <ChevronDown className={`size-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-1.5 max-h-80 w-72 md:w-80 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl shadow-black/80">
            <div className="space-y-1">
              {AVAILABLE_MODELS.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onChange(model.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-start justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                    value === model.id
                      ? "bg-violet-500/20 text-violet-200 font-semibold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-100">{model.name}</span>
                      <span className="rounded bg-slate-800 border border-slate-700/60 px-1.5 py-0.5 text-[9px] text-slate-400 font-medium">
                        {model.category}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400 leading-snug">{model.description}</div>
                  </div>
                  {value === model.id && <Check className="mt-1 size-3.5 text-violet-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Freeform input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder="Or type custom model ID..."
        className={`w-full rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 font-mono text-[11px] text-slate-200 placeholder:text-slate-600 focus:outline-none ${colorStyles.focus}`}
      />
    </div>
  );
}

export function ModelSelector({
  proModel,
  conModel,
  judgeModel,
  onProChange,
  onConChange,
  onJudgeChange,
  syncDebaters = false,
  onSyncToggle,
  compact = false,
}: ModelSelectorProps) {
  function handleSwapDebaters() {
    const temp = proModel;
    onProChange(conModel);
    onConChange(temp);
  }

  function applyMatchup(preset: typeof MATCHUP_PRESETS[number]) {
    onProChange(preset.pro);
    onConChange(preset.con);
    onJudgeChange(preset.judge);
    if (onSyncToggle && preset.pro !== preset.con) {
      onSyncToggle(false);
    }
  }

  return (
    <div className={`rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur ${compact ? "p-3 space-y-3" : "p-4 space-y-4"}`}>
      {/* Header & Matchup Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="size-4 text-violet-400" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
            Model Assignment & Faceoffs
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSwapDebaters}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 transition hover:border-violet-400/50 hover:bg-slate-700 hover:text-white"
            title="Swap PRO and CON models"
          >
            <ArrowLeftRight className="size-3 text-violet-400" />
            <span>Swap PRO & CON</span>
          </button>

          {onSyncToggle && (
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
              <input
                type="checkbox"
                checked={syncDebaters}
                onChange={(e) => onSyncToggle(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-violet-500 focus:ring-0"
              />
              <span>Mirror PRO & CON</span>
            </label>
          )}
        </div>
      </div>

      {/* Matchup Presets Chips */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
          <Sparkles className="size-3 text-violet-400" /> Quick Faceoff Matchups:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {MATCHUP_PRESETS.map((m) => {
            const isActive = proModel === m.pro && conModel === m.con && judgeModel === m.judge;
            return (
              <button
                key={m.label}
                type="button"
                onClick={() => applyMatchup(m)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                  isActive
                    ? "border border-violet-400/50 bg-violet-500/20 text-violet-200 shadow"
                    : "border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-600 hover:text-slate-200"
                }`}
              >
                <span>{m.label}</span>
                <span className="ml-1.5 text-[10px] text-slate-500">({m.badge})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Independent Pickers */}
      <div className="grid gap-3.5 md:grid-cols-3 pt-1">
        <SingleModelPicker
          label="PRO Advocate"
          accentColor="emerald"
          icon="🛡️"
          value={proModel}
          onChange={(val) => {
            onProChange(val);
            if (syncDebaters) onConChange(val);
          }}
        />

        <SingleModelPicker
          label="CON Advocate"
          accentColor="amber"
          icon="⚔️"
          value={conModel}
          disabled={syncDebaters}
          onChange={onConChange}
        />

        <SingleModelPicker
          label="Impartial Judge"
          accentColor="violet"
          icon="⚖️"
          value={judgeModel}
          onChange={onJudgeChange}
        />
      </div>
    </div>
  );
}
