import { Worker } from "bullmq";
import { closeDb, initDb } from "../../packages/db";
import { runAgent } from "../agent-engine/runAgent";
import "dotenv/config";

async function startWorker() {
  await initDb();

  const worker = new Worker(
    "agent",
    async (job) => {
      try {
        const task = String(job.data?.task || "").trim();
        const runId = Number(job.data?.runId);

        if (!task) {
          throw new Error("Job task is required");
        }

        return await runAgent(task, Number.isNaN(runId) ? undefined : runId);
      } catch (error) {
        console.error("Worker job failed", error);
        throw error;
      }
    },
    {
      connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: Number(process.env.REDIS_PORT) || 6379
      },
      concurrency: 2
    }
  );

  worker.on("completed", (job) => {
    console.log(`Worker completed job ${job.id}`);
  });

  worker.on("failed", (job, error) => {
    console.error(`Worker failed job ${job?.id}`, error);
  });

  const shutdown = async () => {
    await worker.close();
    await closeDb();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startWorker().catch((error) => {
  console.error("Worker failed to start", error);
  process.exit(1);
});
