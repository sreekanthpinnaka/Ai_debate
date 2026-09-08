import { Pause, Play, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { DebateData } from "@/types/debate";

interface DebateAudioPlayerProps {
  debate: DebateData;
}

interface AudioSegment {
  speaker: "Announcer" | "PRO" | "CON" | "Judge";
  label: string;
  text: string;
  pitch: number;
  rate: number;
}

export function DebateAudioPlayer({ debate }: DebateAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number | null>(null);
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);

  const segmentsRef = useRef<AudioSegment[]>([]);
  const currentIndexRef = useRef(0);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    if (!supported) {
      return;
    }

    const segments: AudioSegment[] = [
      {
        speaker: "Announcer",
        label: "Debate Proposition",
        text: `Welcome to the AI Debate Simulator. Today's proposition: ${debate.topic}. Let the debate begin.`,
        pitch: 1.0,
        rate: 1.0,
      },
    ];

    for (const round of debate.rounds) {
      const typeLabel =
        round.round_type === "opening"
          ? "Opening Arguments"
          : round.round_type === "rebuttal"
            ? "Rebuttals"
            : "Closing Arguments";

      segments.push({
        speaker: "PRO",
        label: `Round ${round.round_number}: PRO ${typeLabel}`,
        text: `PRO advocate: ${round.pro_response}`,
        pitch: 1.12,
        rate: 1.02,
      });

      segments.push({
        speaker: "CON",
        label: `Round ${round.round_number}: CON ${typeLabel}`,
        text: `CON advocate: ${round.con_response}`,
        pitch: 0.88,
        rate: 1.02,
      });
    }

    if (debate.judge_result) {
      segments.push({
        speaker: "Judge",
        label: "Judge's Verdict",
        text: `Judge's final evaluation. The declared winner is ${debate.judge_result.winner}. Decision rationale: ${debate.judge_result.decision_reason}. Overall scores: PRO ${debate.judge_result.pro_scores.overall.toFixed(1)}, CON ${debate.judge_result.con_scores.overall.toFixed(1)}.`,
        pitch: 0.98,
        rate: 0.96,
      });
    }

    segmentsRef.current = segments;

    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [debate, supported]);

  function speakNextSegment() {
    if (isCancelledRef.current) return;
    const segments = segmentsRef.current;
    const index = currentIndexRef.current;

    if (index >= segments.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentSegmentIndex(null);
      currentIndexRef.current = 0;
      return;
    }

    const segment = segments[index];
    setCurrentSegmentIndex(index);

    const utterance = new SpeechSynthesisUtterance(segment.text);
    utterance.pitch = segment.pitch;
    utterance.rate = segment.rate;

    utterance.onend = () => {
      if (isCancelledRef.current) return;
      currentIndexRef.current += 1;
      speakNextSegment();
    };

    utterance.onerror = (e) => {
      if (e.error === "canceled" || e.error === "interrupted") return;
      currentIndexRef.current += 1;
      speakNextSegment();
    };

    window.speechSynthesis.speak(utterance);
  }

  function handlePlay() {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    isCancelledRef.current = false;
    setIsPlaying(true);
    setIsPaused(false);
    currentIndexRef.current = 0;
    speakNextSegment();
  }

  function handlePause() {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }

  function handleStop() {
    isCancelledRef.current = true;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentSegmentIndex(null);
    currentIndexRef.current = 0;
  }

  if (!supported) return null;

  const currentSegment =
    currentSegmentIndex !== null ? segmentsRef.current[currentSegmentIndex] : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-violet-400/20 bg-slate-900/80 p-4 shadow-lg backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl border border-violet-400/30 bg-violet-500/10 text-violet-300">
          <Volume2 className="size-5 animate-pulse" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
            Audio Narration
          </p>
          <p className="text-sm text-slate-300">
            {currentSegment ? (
              <span>
                Speaking:{" "}
                <strong
                  className={
                    currentSegment.speaker === "PRO"
                      ? "text-emerald-300"
                      : currentSegment.speaker === "CON"
                        ? "text-amber-300"
                        : currentSegment.speaker === "Judge"
                          ? "text-violet-300"
                          : "text-slate-200"
                  }
                >
                  {currentSegment.label}
                </strong>
              </span>
            ) : (
              "Listen to the full debate narrated with distinct participant voices"
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!isPlaying ? (
          <Button
            onClick={handlePlay}
            size="sm"
            className="gap-2 bg-violet-600 text-white hover:bg-violet-500"
          >
            <Play className="size-3.5 fill-current" />
            {isPaused ? "Resume" : "Listen to Debate"}
          </Button>
        ) : (
          <Button
            onClick={handlePause}
            size="sm"
            variant="outline"
            className="gap-2 border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            <Pause className="size-3.5" />
            Pause
          </Button>
        )}

        {(isPlaying || isPaused) && (
          <Button
            onClick={handleStop}
            size="sm"
            variant="ghost"
            className="gap-1.5 text-slate-400 hover:text-slate-200"
          >
            <Square className="size-3.5 fill-current" />
            Stop
          </Button>
        )}
      </div>
    </div>
  );
}
