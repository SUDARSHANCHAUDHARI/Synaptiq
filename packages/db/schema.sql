CREATE TABLE IF NOT EXISTS agent_runs (
  id SERIAL PRIMARY KEY,
  input TEXT NOT NULL,
  status TEXT NOT NULL,
  total_cost FLOAT DEFAULT 0,
  total_retries INT DEFAULT 0,
  completed_at TIMESTAMP,
  execution_time_ms INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS steps (
  id SERIAL PRIMARY KEY,
  run_id INT REFERENCES agent_runs(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  retry_count INT DEFAULT 0,
  input TEXT NOT NULL DEFAULT '',
  output TEXT NOT NULL,
  cost FLOAT DEFAULT 0,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS steps_run_id_idx ON steps(run_id);
