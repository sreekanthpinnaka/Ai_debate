import { ShieldCheck, ShieldX } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ArgumentCardProps {
  side: "PRO" | "CON";
  content: string;
  modelName?: string;
}

export function ArgumentCard({ side, content, modelName }: ArgumentCardProps) {
  const isPro = side === "PRO";
  const Icon = isPro ? ShieldCheck : ShieldX;
  return (
    <Card className={isPro ? "border border-emerald-400/15 bg-emerald-400/[0.045] ring-0" : "border border-amber-400/15 bg-amber-400/[0.045] ring-0"}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.06] pb-3 space-y-0">
        <CardTitle className={isPro ? "flex items-center gap-2 text-emerald-300" : "flex items-center gap-2 text-amber-300"}>
          <Icon className="size-4" aria-hidden="true" />
          {side}
        </CardTitle>
        {modelName && (
          <span className="rounded-md border border-slate-700/60 bg-slate-800/80 px-2 py-0.5 font-mono text-[11px] text-slate-300">
            {modelName}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line text-[15px] leading-7 text-slate-300">{content}</p>
      </CardContent>
    </Card>
  );
}
