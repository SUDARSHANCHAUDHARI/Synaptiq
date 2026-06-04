# Synaptiq

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4-black.svg)](https://fastify.dev/)
[![Release](https://img.shields.io/badge/release-POC%20internal%20demo-orange.svg)](RELEASE_MEMORY.md)

AI agent debugging and cost-tracking backend with Fastify API, BullMQ worker, PostgreSQL audit storage, Redis queues, and OpenAI-powered loop-fix concepts.

> **Status:** POC/internal demo · not production-ready until build pipeline, auth, rate limits, Postgres/Redis smoke, and monitoring are complete

## Why This Exists

AI agent runs can loop, waste tokens, and fail without clear execution traces. Synaptiq explores an API/worker system that records agent runs, tracks steps and costs, and prepares the foundations for loop detection and review workflows.

## Status

| Item | State |
|---|---|
| Release type | POC/internal demo |
| Runtime | ts-node TypeScript |
| Queue | Redis + BullMQ |
| Database | PostgreSQL schema included |
| Production | Pending auth/rate limits/deployment |

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
