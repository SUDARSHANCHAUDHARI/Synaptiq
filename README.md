# Synaptiq

Production-ready AI agent debugging, loop fixing, cost tracking, and execution visibility.

## Overview

Synaptiq is a TypeScript-based AI agent system with:

- a Fastify API for submitting agent runs
- a BullMQ worker for background execution
- PostgreSQL-backed audit and run tracking
- OpenAI-powered execution and loop fixing
- lightweight cost accounting per run

## Project Structure

```text
synaptiq/
├── apps/
│   ├── api/
│   │   └── server.ts
│   └── web/
│       └── index.html
├── services/
│   ├── agent-engine/
│   │   └── runAgent.ts
│   └── worker/
│       └── worker.ts
├── packages/
│   ├── audit/
│   │   └── logger.ts
│   ├── cost/
│   │   └── tracker.ts
│   ├── db/
│   │   ├── index.ts
│   │   └── schema.sql
│   ├── llm/
│   │   └── openai.ts
│   ├── loop/
│   │   ├── detector.ts
│   │   └── fixer.ts
│   └── review/
│       └── reviewer.ts
├── infra/
│   └── docker-compose.yml
├── .env.example
├── package.json
└── tsconfig.json
```

## Environment

Copy `.env.example` and provide values for:

```env
OPENAI_API_KEY=
DATABASE_URL=postgres://postgres:postgres@localhost:5432/synaptiq
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Database

Apply the schema in `packages/db/schema.sql` to create:

- `agent_runs` for top-level task tracking
- `steps` for per-step audit logs and costs

## Running The Project

Start Postgres and Redis first:

```bash
docker-compose -f infra/docker-compose.yml up -d
```

Then in two separate terminals:

```bash
pnpm api       # Fastify on :3001
pnpm worker    # BullMQ background processor
```

Open `http://localhost:3001` in a browser to use the dashboard.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/run` | Queue an agent run |
| `GET` | `/runs` | List all runs |
| `GET` | `/runs/:id` | Run detail + step timeline |
| `POST` | `/webhook/run` | n8n/external trigger (requires `x-api-key` header) |
| `GET` | `/health` | Health check |

## Execution Flow

1. API receives task → inserts `agent_runs` row → enqueues BullMQ job
2. Worker picks up job → runs `Analyze → Execute → Validate` steps via LLM
3. After each step the reviewer checks output quality; rejects trigger retry
4. Loop detector compares output tokens (85% similarity threshold); loops trigger LLM-based prompt rewriting
5. Every step (including retries and loop events) is written to `steps` table
6. Run is marked `done` or `failed` with total cost and execution time
