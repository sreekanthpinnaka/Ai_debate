export interface ModelPreset {
  id: string;
  name: string;
  category: "Fast & Efficient" | "Flagship" | "Reasoning" | "Deep Reasoning" | "Advanced" | "Dynamic";
  description: string;
}

export const AVAILABLE_MODELS: ModelPreset[] = [
  { id: "gpt-4o-mini", name: "GPT-4o Mini", category: "Fast & Efficient", description: "Fast, high-quality, cost-efficient default" },
  { id: "gpt-4o", name: "GPT-4o", category: "Flagship", description: "Flagship multi-modal debate intelligence" },
  { id: "o3-mini", name: "o3-mini", category: "Reasoning", description: "Next-gen deep logical deduction & step-by-step reasoning" },
  { id: "o1-mini", name: "o1-mini", category: "Reasoning", description: "Fast analytical chain-of-thought for STEM & debate logic" },
  { id: "o1", name: "o1", category: "Deep Reasoning", description: "Full deep reasoning model for complex propositions" },
  { id: "gpt-4.5-preview", name: "GPT-4.5 Preview", category: "Advanced", description: "Advanced nuanced debate reasoning & style" },
  { id: "chatgpt-4o-latest", name: "ChatGPT-4o Latest", category: "Dynamic", description: "Dynamic ChatGPT production model" },
];

export interface MatchupPreset {
  label: string;
  badge: string;
  pro: string;
  con: string;
  judge: string;
}

export const MATCHUP_PRESETS: MatchupPreset[] = [
  { label: "Default Mini", badge: "Fast & Light", pro: "gpt-4o-mini", con: "gpt-4o-mini", judge: "gpt-4o-mini" },
  { label: "Flagship vs Mini", badge: "Asymmetric", pro: "gpt-4o", con: "gpt-4o-mini", judge: "gpt-4o" },
  { label: "Reasoning Clash", badge: "Logic Faceoff", pro: "o3-mini", con: "o1-mini", judge: "gpt-4o" },
  { label: "Deep Deduction", badge: "Heavyweight", pro: "o3-mini", con: "gpt-4o", judge: "o3-mini" },
  { label: "Flagship Mirror", badge: "GPT-4o Duel", pro: "gpt-4o", con: "gpt-4o", judge: "gpt-4o" },
];
