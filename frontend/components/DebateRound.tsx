import type { DebateRound as DebateRoundData } from "@/types/debate";

import { ArgumentCard } from "./ArgumentCard";

const LABELS = {
  opening: "Opening arguments",
  rebuttal: "Rebuttals",
  closing: "Closing arguments",
};

export function DebateRound({
  round,
  proModel,
  conModel,
}: {
  round: DebateRoundData;
  proModel?: string;
  conModel?: string;
}) {
  return (
    <section className="scroll-mt-8">
      <div className="mb-4 flex items-center gap-4">
        <span className="grid size-7 place-items-center rounded-full border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-400">
          {round.round_number}
        </span>
        <h2 className="font-heading text-xl font-semibold text-slate-100">{LABELS[round.round_type]}</h2>
        <span className="h-px flex-1 bg-slate-800" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ArgumentCard side="PRO" content={round.pro_response} modelName={proModel} />
        <ArgumentCard side="CON" content={round.con_response} modelName={conModel} />
      </div>
    </section>
  );
}
