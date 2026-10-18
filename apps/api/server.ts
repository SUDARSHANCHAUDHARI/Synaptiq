import Fastify from "fastify";
import { readFile } from "node:fs/promises";
import { createHash, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { Queue } from "bullmq";
import { logStep } from "../../packages/audit/logger";
import { closeDb, initDb, pool } from "../../packages/db";
import { createQueuedRun } from "../../services/agent-engine/runAgent";
import "dotenv/config";

const app = Fastify({ logger: true });
const port = Number(process.env.PORT) || 3001;
const webhookApiKey = (process.env.WEBHOOK_API_KEY ?? "").trim();

if (!webhookApiKey) {
  // Fail closed — starting without a webhook API key is a misconfiguration.
  // Any request to /webhook/run would be unauthenticated, so we refuse to start.
  console.error(
    "[FATAL] WEBHOOK_API_KEY is not set or is empty. " +
    "Set a strong secret in your environment before starting the API."
  );
  process.exit(1);
}

const queue = new Queue("agent", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000
    },
    removeOnComplete: 50,
    removeOnFail: 50
  }
});

// Hash both sides so timingSafeEqual gets equal-length inputs and the key length is not leaked.
function hasValidApiKey(req: any): boolean {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(String(req.headers["x-api-key"] || "").trim()), digest(webhookApiKey));
}

app.post("/run", async (req: any, reply) => {
  if (!hasValidApiKey(req)) {
    return reply.code(401).send({ error: "Invalid API key" });
  }

  const task = String(req.body?.task || "").trim();
  if (!task) {
    return reply.code(400).send({ error: "Task is required" });
  }

  const runId = await createQueuedRun(task);

  try {
    const job = await queue.add("run", { task, runId });
    return reply.code(202).send({ jobId: job.id, runId, status: "queued" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to queue run";
    await pool.query(
      "UPDATE agent_runs SET status=$1 WHERE id=$2",
      ["failed", runId]
    );
    await logStep(runId, "queue", 0, task, message, 0, "failed");
    return reply.code(500).send({ error: "Failed to queue run", runId });
  }
});

app.post("/webhook/run", async (req: any, reply) => {
  if (!hasValidApiKey(req)) {
    return reply.code(401).send({ error: "Invalid API key" });
  }

  const task = String(req.body?.task || "").trim();
  if (!task) {
    return reply.code(400).send({ error: "Task is required" });
  }

  const runId = await createQueuedRun(task);

  try {
    await queue.add("run", { task, runId, source: "webhook" });
    return reply.code(202).send({ runId, status: "queued" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to queue webhook run";
    await pool.query(
      "UPDATE agent_runs SET status=$1 WHERE id=$2",
      ["failed", runId]
    );
    await logStep(runId, "webhook", 0, task, message, 0, "failed");
    return reply.code(500).send({ error: "Failed to queue run", runId });
  }
});

app.get("/runs", async () => {
  const res = await pool.query(
    `SELECT
        agent_runs.*,
        COUNT(steps.id)::int AS step_count,
        COALESCE(SUM(CASE WHEN steps.status = 'retry' THEN 1 ELSE 0 END), 0)::int AS retry_count,
        COALESCE(SUM(CASE WHEN steps.status = 'failed' THEN 1 ELSE 0 END), 0)::int AS failed_step_count,
        COALESCE(SUM(CASE WHEN steps.status = 'loop_detected' THEN 1 ELSE 0 END), 0)::int AS loop_count
     FROM agent_runs
     LEFT JOIN steps ON steps.run_id = agent_runs.id
     GROUP BY agent_runs.id
     ORDER BY agent_runs.id DESC`
  );
  return res.rows;
});

app.get("/runs/:id", async (req: any, reply) => {
  const runId = Number(req.params.id);
  if (Number.isNaN(runId)) {
    return reply.code(400).send({ error: "Run id must be a number" });
  }

  const runRes = await pool.query(
    "SELECT * FROM agent_runs WHERE id=$1",
    [runId]
  );
  if (!runRes.rows[0]) {
    return reply.code(404).send({ error: "Run not found" });
  }

  const stepsRes = await pool.query(
    "SELECT * FROM steps WHERE run_id=$1 ORDER BY id ASC",
    [runId]
  );
  const analyticsRes = await pool.query(
    `SELECT
        COUNT(*)::int AS total_steps,
        COALESCE(SUM(CASE WHEN status = 'retry' THEN 1 ELSE 0 END), 0)::int AS retry_count,
        COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0)::int AS failed_steps,
        COALESCE(SUM(CASE WHEN status = 'loop_detected' THEN 1 ELSE 0 END), 0)::int AS loop_count,
        COALESCE(SUM(cost), 0) AS total_cost
      FROM steps
      WHERE run_id=$1`,
    [runId]
  );
  return { run: runRes.rows[0], steps: stepsRes.rows, analytics: analyticsRes.rows[0] };
});

app.get("/health", async () => {
  await pool.query("SELECT 1");
  return { ok: true };
});

app.get("/", async (_req, reply) => {
  const uiPath = path.resolve(process.cwd(), "apps/web/index.html");
  const html = await readFile(uiPath, "utf8");
  reply.type("text/html").send(html);
});

app.get("/runs/view/:id", async (_req, reply) => {
  const uiPath = path.resolve(process.cwd(), "apps/web/run.html");
  const html = await readFile(uiPath, "utf8");
  reply.type("text/html").send(html);
});

app.setErrorHandler((error, req, reply) => {
  req.log.error(error);
  reply.code(500).send({ error: "Internal server error" });
});

async function startApi() {
  await initDb();
  queue.on("error", (error) => {
    app.log.error(error, "Queue connection error");
  });

  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`API running on http://localhost:${port}`);
}

async function shutdown() {
  await queue.close();
  await app.close();
  await closeDb();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startApi().catch((error) => {
  app.log.error(error);
  process.exit(1);
});
