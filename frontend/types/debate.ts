export type DebateStatus = "created" | "in_progress" | "completed" | "failed";
export type RoundType = "opening" | "rebuttal" | "closing";
export type Winner = "PRO" | "CON" | "TIE";

export interface DebateRound {
  round_number: number;
  round_type: RoundType;
  pro_response: string;
  con_response: string;
}

export interface ScoreBreakdown {
  argument_quality: number;
  logical_consistency: number;
  rebuttal_quality: number;
  clarity: number;
  persuasiveness: number;
  overall: number;
}

export interface JudgeResultData {
  winner: Winner;
  pro_scores: ScoreBreakdown;
  con_scores: ScoreBreakdown;
  pro_strengths: string[];
  con_strengths: string[];
  pro_weaknesses: string[];
  con_weaknesses: string[];
  pro_logical_issues: string[];
  con_logical_issues: string[];
  strongest_argument: string;
  debate_summary: string;
  decision_reason: string;
}

export interface ModelConfig {
  pro_model?: string;
  con_model?: string;
  judge_model?: string;
}

export interface DebateData {
  id: string;
  topic: string;
  status: DebateStatus;
  created_at: string;
  pro_model?: string;
  con_model?: string;
  judge_model?: string;
  rounds: DebateRound[];
  judge_result: JudgeResultData | null;
  user_vote?: Winner | null;
}

export type DebateEventType =
  | "debate_started"
  | "round_started"
  | "agent_started"
  | "agent_chunk"
  | "agent_completed"
  | "judge_started"
  | "judge_completed"
  | "debate_completed"
  | "debate_failed";

export interface DebateEvent {
  type: DebateEventType;
  debate_id?: string | null;
  topic?: string | null;
  round_number?: number | null;
  round_type?: RoundType | null;
  side?: "PRO" | "CON" | null;
  delta?: string | null;
  content?: string | null;
  pro_model?: string | null;
  con_model?: string | null;
  judge_model?: string | null;
  judge_result?: JudgeResultData | null;
  debate?: DebateData | null;
  message?: string | null;
}
