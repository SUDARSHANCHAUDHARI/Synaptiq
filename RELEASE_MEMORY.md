# Release Memory: Synaptiq
_Last updated: 2026-06-04_

## Current Status

Synaptiq is an AI agent debugging/cost-tracking system with Fastify API, BullMQ worker, PostgreSQL, Redis, and OpenAI integration.

## Release Target

Production API/worker deployment after infra, auth, and monitoring are added.

## Success Criteria

- TypeScript check passes.
- Postgres and Redis start locally.
- API and worker run together.
- `/run`, `/runs`, `/runs/:id`, `/webhook/run`, and `/health` work.
- Auth/rate limiting exists before public exposure.
- Deployment and monitoring path is documented.

## Ordered Plan

1. Install dependencies.
2. Run `pnpm check`.
3. Start Postgres/Redis via docker-compose.
4. Run API and worker in separate terminals.
5. Smoke test run creation and worker processing.
6. Add auth/rate limiting and deployment config.
7. Add monitoring/logging runbook.

## Risks

- Worker/API split requires reliable deployment orchestration.
- OpenAI costs need control.
- Public webhook must require authentication.

## First Task

Run `pnpm check`, then local API/worker smoke test with docker-compose services.

## Latest Prep Notes

- Updated `.env.example` and README environment examples to use `YOUR_OPENAI_API_KEY` and `YOUR_WEBHOOK_API_KEY`.
- Current release type remains POC/internal demo until build, Postgres/Redis smoke, auth, rate limits, and deployment monitoring are complete.
- Polished README with POC/internal status, technical decisions, setup, verification, known limits, and production blockers.
