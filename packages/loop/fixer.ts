import { callLLM } from "../llm/openai";

export async function fixLoop(step: string, history: string[]) {
  const res = await callLLM(
    `You are fixing repeated AI output. Improve this step:\n${step}\nHistory:\n${history.join("\n")}`
  );

  return res.text.trim() || `Adjusted output for step: ${step}`;
}
