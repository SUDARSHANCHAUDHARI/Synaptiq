import OpenAI from "openai";
import "dotenv/config";

let client: OpenAI | null = null;

type Usage = {
  prompt_tokens: number;
  completion_tokens: number;
};

type LLMResponse = {
  text: string;
  usage: Usage;
  provider: "openai" | "local";
};

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  return client;
}

function estimateTokens(value: string) {
  return Math.max(1, Math.ceil(value.length / 4));
}

function extractTask(prompt: string) {
  const splitPrompt = prompt.split(":");
  return splitPrompt.length > 1 ? splitPrompt.slice(1).join(":").trim() : prompt.trim();
}

function buildLocalResponse(prompt: string): LLMResponse {
  const task = extractTask(prompt);
  let text = `Completed step for: ${task}`;

  if (prompt.includes("Return exactly two lines: \"APPROVED: yes|no\"")) {
    text = [
      "APPROVED: yes",
      "FEEDBACK: Output is structured, specific, and ready for the next stage."
    ].join("\n");
  } else if (prompt.startsWith("Analyze:") || prompt.includes("STEP TYPE: Analyze")) {
    text = [
      `Goal: ${task}`,
      "Deliverables:",
      "1. Define the primary workflow and user outcome.",
      "2. Identify required backend, frontend, and data components.",
      "Risks:",
      "- authentication and permissions",
      "- persistence and state consistency",
      "- validation and release readiness"
    ].join("\n");
  } else if (prompt.startsWith("Execute:") || prompt.includes("STEP TYPE: Execute")) {
    text = [
      `Implementation plan for ${task}:`,
      "Actions:",
      "1. Define entities and API contracts.",
      "2. Build the UI flow and persistence layer.",
      "3. Add validation, error handling, and tests.",
      "Expected output:",
      "- a working feature slice with observable state transitions"
    ].join("\n");
  } else if (prompt.startsWith("Validate:") || prompt.includes("STEP TYPE: Validate")) {
    text = [
      `Validation checklist for ${task}:`,
      "- happy path tested",
      "- failure states handled",
      "- release readiness confirmed",
      "Decision:",
      "Approve for rollout when all checks pass."
    ].join("\n");
  } else if (prompt.includes("fixing repeated AI output")) {
    text = [
      "Adjusted output to break repetition:",
      `- Reframed the step with fresh detail for ${task}`,
      "- Added a different action sequence and validation checkpoint",
      "- Included concrete deliverables instead of repeating prior wording"
    ].join("\n");
  }

  return {
    text,
    usage: {
      prompt_tokens: estimateTokens(prompt),
      completion_tokens: estimateTokens(text)
    },
    provider: "local"
  };
}

export async function callLLM(prompt: string): Promise<LLMResponse> {
  const activeClient = getClient();
  if (!activeClient) {
    return buildLocalResponse(prompt);
  }

  const res = await activeClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  const text = res.choices[0]?.message?.content?.trim() || "The model returned an empty response.";

  return {
    text,
    usage: {
      prompt_tokens: res.usage?.prompt_tokens || 0,
      completion_tokens: res.usage?.completion_tokens || 0
    },
    provider: "openai"
  };
}
