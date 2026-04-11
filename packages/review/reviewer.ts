import { callLLM } from "../llm/openai";

export type ReviewResult = {
  approved: boolean;
  reason: string;
};

function fallbackReview(output: string): ReviewResult {
  const lines = output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const hasStructure = lines.length >= 3;
  const hasSpecificMarkers = /goal:|plan|checklist|risk|deliverable|1\.|2\.|3\./i.test(output);
  const tooGeneric = /completed step for|looks good|done|ok/i.test(output);

  if (hasStructure && hasSpecificMarkers && !tooGeneric) {
    return {
      approved: true,
      reason: "Output is structured and specific enough to keep."
    };
  }

  return {
    approved: false,
    reason: "Output is too generic or insufficiently structured. Add concrete sections, numbered actions, and validation detail."
  };
}

export async function reviewStepOutput(step: string, output: string): Promise<ReviewResult> {
  const reviewPrompt = [
    "You are a strict reviewer for AI task execution.",
    "Approve only if the output is structured, specific, and actionable.",
    "Reject generic or vague responses.",
    'Return exactly two lines: "APPROVED: yes|no" and "FEEDBACK: ...".',
    `STEP: ${step}`,
    `OUTPUT:\n${output}`
  ].join("\n");

  const result = await callLLM(reviewPrompt);
  const reviewText = result.text.trim();
  const approved = /APPROVED:\s*yes/i.test(reviewText);
  const feedbackMatch = reviewText.match(/FEEDBACK:\s*(.*)/i);

  if (!/APPROVED:\s*(yes|no)/i.test(reviewText)) {
    return fallbackReview(output);
  }

  return {
    approved,
    reason: feedbackMatch?.[1]?.trim() || "No feedback provided."
  };
}
