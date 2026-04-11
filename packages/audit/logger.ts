import { pool } from "../db";

export async function logStep(
  runId: number,
  step: string,
  retryCount: number,
  input: string,
  output: string,
  cost: number,
  status = "done"
) {
  await pool.query(
    "INSERT INTO steps(run_id,step_name,retry_count,input,output,cost,status) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [runId, step, retryCount, input, output, cost, status]
  );
}
