# Synaptiq

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4-black.svg)](https://fastify.dev/)
[![Status](https://img.shields.io/badge/status-skeleton%20%2B%20hardened%20foundations-yellow.svg)](RELEASE_MEMORY.md)

AI agent debugging and cost-tracking backend with Fastify API, BullMQ worker, PostgreSQL audit storage, Redis queues, and OpenAI-powered loop-fix concepts.

> **Status:** Working skeleton with hardened foundations — fail-closed webhook auth, typed PostgreSQL audit log, graceful shutdown, Docker Compose for Postgres/Redis, and an 11-test Vitest suite covering the cost tracker and loop detector. The end-to-end path (create run → enqueue → worker executes → audit row written) needs a live integration smoke test against the Compose stack, and rate limits / observability are still TODO before treating this as a production service.

## Why This Exists

AI agent runs can loop, waste tokens, and fail without clear execution traces. Synaptiq explores an API/worker system that records agent runs, tracks steps and costs, and prepares the foundations for loop detection and review workflows.

## Status

| Item | State |
|---|---|
| Release type | Skeleton with hardened foundations |
| Runtime | ts-node TypeScript |
| Queue | Redis + BullMQ |
| Database | PostgreSQL schema included |
| Security | Webhook fail-closed without `WEBHOOK_API_KEY`; bearer header check on `/webhook/run` |
| Tests | 11 Vitest unit tests (cost tracker, loop detector) |
| Remaining | End-to-end smoke against Compose stack; rate limits; observability |

## Key Technical Decisions

**Fastify is used for the API.** The project needs a small, fast service for run creation, health checks, and webhook-triggered execution.

**BullMQ separates request handling from agent execution.** Agent work can be slow and expensive, so worker processing belongs outside the API request path.

**PostgreSQL stores run and step history.** Debugging agent behavior requires durable audit records, not only logs.

**Redis backs job orchestration.** Queue-based execution makes the worker/API split explicit and easier to deploy later.

**Webhook auth fails closed.** The API refuses to start without `WEBHOOK_API_KEY`, preventing accidental unauthenticated webhook exposure.

## Features

- Fastify API
- BullMQ worker
- PostgreSQL schema for runs and steps
- OpenAI LLM integration
- loop detector/fixer package area
- lightweight static web UI folder
- local Docker Compose infrastructure for Postgres/Redis

## Setup

```bash
pnpm install
cp .env.example .env
```

Environment:

```env
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
DATABASE_URL=postgres://postgres:postgres@localhost:5432/synaptiq
REDIS_HOST=localhost
REDIS_PORT=6379
WEBHOOK_API_KEY=YOUR_WEBHOOK_API_KEY
```

Start services:

```bash
docker-compose -f infra/docker-compose.yml up -d
```

Run API and worker in separate terminals:

```bash
pnpm api
pnpm worker
```

## Verification

```bash
pnpm check
```

Then smoke-test:

- `/health`
- `/run`
- `/runs`
- `/runs/:id`
- `/webhook/run`

## Known Limits

- No production auth on all public routes yet.
- No rate limit on run creation yet.
- No compiled `dist/` production pipeline yet.
- Postgres/Redis local smoke is still required.
- Monitoring and deployment runbook are still pending.

## Author

Built by **Sudarshan Chaudhari** — SudarshanTechLabs.
