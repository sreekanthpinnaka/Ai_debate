import type { DebateData, DebateEvent, ModelConfig } from "@/types/debate";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string | Array<{ msg: string }> };
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) return data.detail.map((item) => item.msg).join("; ");
  } catch {
    // The fallback below covers non-JSON provider and proxy errors.
  }
  return "The debate could not be completed. Please try again.";
}

export async function healthCheck(): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/health`);
  return response.ok;
}

export async function fetchModelPresets(): Promise<{
  default_model: string;
  presets: Array<{ id: string; name: string; description: string }>;
}> {
  try {
    const response = await fetch(`${API_URL}/api/models`);
    if (response.ok) {
      return (await response.json()) as {
        default_model: string;
        presets: Array<{ id: string; name: string; description: string }>;
      };
    }
  } catch {
    // Fallback
  }
  return {
    default_model: "gpt-4o-mini",
    presets: [
      { id: "gpt-4o-mini", name: "GPT-4o Mini", description: "Fast, high-quality default" },
      { id: "gpt-4o", name: "GPT-4o", description: "Flagship multi-modal reasoning" },
      { id: "o3-mini", name: "o3-mini", description: "Advanced logical depth" },
      { id: "o1-mini", name: "o1-mini", description: "Analytical reasoning" },
    ],
  };
}

export async function startDebate(topic: string, models?: ModelConfig): Promise<DebateData> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/debates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, ...models }),
    });
  } catch {
    throw new ApiError("Could not reach the debate API. Make sure the backend is running.", 0);
  }
  if (!response.ok) throw new ApiError(await parseError(response), response.status);
  return response.json() as Promise<DebateData>;
}

export async function streamDebate(
  topic: string,
  onEvent: (event: DebateEvent) => void,
  models?: ModelConfig,
): Promise<DebateData> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/debates/stream`, {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic, ...models }),
    });
  } catch {
    throw new ApiError("Could not reach the debate API. Make sure the backend is running.", 0);
  }

  if (!response.ok) throw new ApiError(await parseError(response), response.status);
  if (!response.body) throw new ApiError("The debate stream was not available.", 0);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";

      for (const block of blocks) {
        const payload = block
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");
        if (!payload) continue;

        const event = JSON.parse(payload) as DebateEvent;
        onEvent(event);
        if (event.type === "debate_failed") {
          throw new ApiError(event.message ?? "The debate could not be completed.", 502);
        }
        if (event.type === "debate_completed" && event.debate) return event.debate;
      }

      if (done) break;
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("The live debate connection was interrupted. Please try again.", 0);
  } finally {
    reader.releaseLock();
  }

  throw new ApiError("The debate ended before a final result was received.", 502);
}
