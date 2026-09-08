import { History, Scale } from "lucide-react";
import { useEffect, useState } from "react";

import { getSavedDebates } from "./DebateHistoryModal";

interface DebateHeaderProps {
  compact?: boolean;
  onOpenHistory?: () => void;
}

export function DebateHeader({ compact = false, onOpenHistory }: DebateHeaderProps) {
  const [historyCount, setHistoryCount] = useState(() =>
    typeof window !== "undefined" ? getSavedDebates().length : 0,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setHistoryCount(getSavedDebates().length);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <header className={compact ? "py-6" : "pt-8 pb-5"}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-violet-300/15 bg-violet-400/10 text-violet-300">
            <Scale className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-heading text-base font-semibold tracking-tight text-white">AI Debate Simulator</p>
            <p className="text-xs text-slate-500">Reasoning under pressure</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-violet-400/30 hover:bg-slate-800 hover:text-white"
            >
              <History className="size-3.5 text-violet-400" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="rounded-full bg-violet-500/20 px-1.5 py-0.2 text-[10px] font-semibold text-violet-300">
                  {historyCount}
                </span>
              )}
            </button>
          )}
          <span className="hidden rounded-full border border-slate-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:block">
            Three rounds · one verdict
          </span>
        </div>
      </div>
    </header>
  );
}
