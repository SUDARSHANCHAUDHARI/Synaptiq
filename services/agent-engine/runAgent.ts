import { logStep } from "../../packages/audit/logger";
import { calcCost } from "../../packages/cost/tracker";
import { initDb, pool } from "../../packages/db";
import { callLLM } from "../../packages/llm/openai";
import { detectLoop } from "../../packages/loop/detector";
import { fixLoop } from "../../packages/loop/fixer";
import { reviewStepOutput } from "../../packages/review/reviewer";

type RunAgentResult = {
  runId: number;
  totalCost: number;
  status: "done";
};

const MAX_RETRIES = 2;

async function createRun(task: string) {
  const run = await pool.query(
    "INSERT INTO agent_runs(input,status) VALUES($1,$2) RETURNING id",
    [task, "queued"]
  );

  return run.rows[0].id as number;
}

export async function createQueuedRun(task: string) {
  await initDb();
  return createRun(task);
}

export async function runAgent(task: string, existingRunId?: number): Promise<RunAgentResult> {
  await initDb();
  const runId = existingRunId ?? await createRun(task);
  const history: string[] = [];
  const startedAt = Date.now();
  let totalCost = 0;
  let totalRetries = 0;
  let currentStep = "boot";

  const steps = [
    { name: "Analyze", objective: task },
    { name: "Execute", objective: task },
    { name: "Validate", objective: task }
  ];

  try {
    await pool.query(
      "UPDATE agent_runs SET status=$1 WHERE id=$2",
      ["running", runId]
    );

    for (const step of steps) {
      let approved = false;
      let attempt = 0;

      while (!approved && attempt <= MAX_RETRIES) {
        currentStep = `${step.name} (attempt ${attempt + 1})`;
        const prompt = buildStepPrompt(step.name, step.objective, history, attempt);
        const res = await callLLM(prompt);
        let output = res.text.trim() || `No output was returned for ${step.name}`;
        let cost = calcCost(res.usage);

        if (detectLoop(history, output)) {
          totalRetries += 1;
          await logStep(
            runId,
            `${step.name} (loop_detected)`,
            attempt,
            prompt,
            "Output was too similar to prior steps. Retrying with a loop-breaker prompt.",
            0,
            "loop_detected"
          );
          const fixedOutput = await fixLoop(`${step.name}: ${step.objective}`, history);
          output = fixedOutput.trim() || output;
        }

        const review = await reviewStepOutput(step.name, output);
        const reviewCost = calcCost({ prompt_tokens: 0, completion_tokens: 0 });
        cost += reviewCost;

        if (review.approved) {
          approved = true;
          await logStep(
            runId,
            attempt === 0 ? step.name : `${step.name} (retry ${attempt})`,
            attempt,
            prompt,
            output,
            cost,
            "done"
          );
          history.push(output);
        } else {
          totalRetries += 1;
          await logStep(
            runId,
            `${step.name} (retry ${attempt + 1})`,
            attempt + 1,
            prompt,
            `${output}\n\nReviewer reason: ${review.reason}`,
            cost,
            attempt === MAX_RETRIES ? "failed" : "retry"
          );

          if (attempt === MAX_RETRIES) {
            throw new Error(`${step.name} failed review after ${MAX_RETRIES + 1} attempts: ${review.reason}`);
          }
        }

        totalCost += cost;
        attempt += 1;
      }

      if (!approved) {
        throw new Error(`Step ${step.name} was not approved.`);
      }
    }

    await pool.query(
      "UPDATE agent_runs SET status=$1,total_cost=$2,total_retries=$3,completed_at=NOW(),execution_time_ms=$4 WHERE id=$5",
      ["done", totalCost, totalRetries, Date.now() - startedAt, runId]
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown agent execution error";
    await logStep(runId, currentStep, 0, currentStep, message, 0, "failed");
    await pool.query(
      "UPDATE agent_runs SET status=$1,total_cost=$2,total_retries=$3,completed_at=NOW(),execution_time_ms=$4 WHERE id=$5",
      ["failed", totalCost, totalRetries, Date.now() - startedAt, runId]
    );
    throw error;
  }

  return { runId, totalCost, status: "done" };
}

function buildStepPrompt(
  stepName: string,
  task: string,
  history: string[],
  attempt: number
) {
  const retryGuidance =
    attempt === 0
      ? "First attempt. Be specific and avoid generic filler."
      : `Retry attempt ${attempt}. Improve specificity, add concrete structure, and address prior weak spots.`;

  const historySection =
    history.length === 0
      ? "None"
      : history.map((entry, index) => `Previous ${index + 1}:\n${entry}`).join("\n\n");

  return [
    `${stepName}: ${task}`,
    `STEP TYPE: ${stepName}`,
    `TASK: ${task}`,
    `RETRY GUIDANCE: ${retryGuidance}`,
    "OUTPUT REQUIREMENTS:",
    "- Use clear headings.",
    "- Include concrete deliverables or actions.",
    "- Avoid vague phrases like 'done' or 'looks good'.",
    "- Make the response meaningfully different from previous outputs.",
    "PREVIOUS OUTPUTS:",
    historySection
  ].join("\n");
}
