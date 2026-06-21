# Status — Synaptiq

**Last updated:** 2026-06-21
**Maturity:** 🟡 `status-skeleton` (hardened foundations)

## What's done

- Fastify API with logger, error handler, graceful shutdown (SIGINT/SIGTERM)
- BullMQ worker with exponential backoff retry, removeOnComplete/Fail caps
- PostgreSQL audit storage (`agent_runs`, `steps`) via `pg` Pool
- Redis queue connection via `ioredis`
- OpenAI integration in `packages/llm/openai.ts`
- **Fail-closed webhook auth** — refuses to start without `WEBHOOK_API_KEY`
- Bearer-token check on `/webhook/run` (`x-api-key` header)
- Loop detector: Jaccard similarity ≥ 0.85, case/punctuation insensitive
- Loop fixer: LLM-driven prompt to break repeated outputs
- Cost tracker: prompt vs completion token pricing (2× ratio for completion)
- Audit logger
- Lightweight static web UI (`apps/web/`)
- Docker Compose for Postgres + Redis (`infra/`)
- Complete `.env.example` covering all 6 env vars
- `tsconfig.json skipLibCheck: true` (modern TS default) so vitest's transitive Vite types don't trip the typecheck
- 11 Vitest tests across 2 suites: cost tracker (4 cases) + loop detector (7 cases incl. Jaccard threshold edge)
- Typecheck and tests green

## What's left

- **Live end-to-end smoke** against the Compose stack: create run → enqueue → worker executes → audit row written → loop detector trips on a repeat. Documented but not yet executed.
- **Rate limiting** on `/run` and `/webhook/run`
- **Observability**: structured logging (currently `console.error` in places), Prometheus metrics, traces
- `services/agent-engine/runAgent.ts` and the fixer/reviewer flow are **thin** — the framework is there but the actual agent execution loop needs fleshing out
- API integration tests (currently only the pure helpers are tested)
- Deployment to a container host (Railway / Fly / VPS) — Compose ready

## Quality gates

| Gate | Status |
|---|---|
| Typecheck | ✅ |
| Tests | ✅ 11 / 2 suites |

## Deployment

Not yet deployed. `docker-compose.yml` is ready for Postgres + Redis + the app on any container host.

## File-by-file checklist

### API (`apps/api/`)
- [x] `server.ts` — Fastify API with `/run`, `/webhook/run`, `/runs`, `/runs/:id`, `/health`, static UI at `/` and `/runs/view/:id`. Fail-closed on missing `WEBHOOK_API_KEY`. Graceful shutdown.

### Worker (`services/worker/`)
- [x] `worker.ts` — BullMQ worker with exponential backoff retry

### Agent engine (`services/agent-engine/`)
- [~] `runAgent.ts` — `createQueuedRun()` exists; **actual execution loop is thin** (needs flesh-out)

### Packages
- [x] `packages/llm/openai.ts` — OpenAI client wrapper
- [x] `packages/cost/tracker.ts` — `calcCost()` for prompt vs completion tokens
- [x] `packages/audit/logger.ts` — `logStep()` writes to `steps` table
- [x] `packages/review/reviewer.ts` — review surface (skeleton)
- [x] `packages/db/index.ts` — `pg` Pool + `initDb`/`closeDb`
- [x] `packages/loop/detector.ts` — Jaccard ≥ 0.85 loop detection
- [x] `packages/loop/fixer.ts` — LLM-driven loop fix (skeleton; depends on `callLLM`)

### Web UI (`apps/web/`)
- [x] `index.html`, `run.html` — static UI served by API

### Infra (`infra/`)
- [x] `docker-compose.yml` — Postgres + Redis + app

### Tests
- [x] `packages/cost/tracker.test.ts` — 4 tests
- [x] `packages/loop/detector.test.ts` — 7 tests (including the 0.85 Jaccard threshold edge case)

### Tooling
- [x] `tsconfig.json` — `skipLibCheck: true` (modern default) to avoid vitest transitive Vite type breakage
- [x] Complete `.env.example` covering all 6 env vars
- [x] `vitest.config.ts`

### Quality
- [x] Typecheck green
- [x] 11 tests pass

### Not done
- [ ] **Live end-to-end smoke** against the Compose stack (create run → enqueue → worker executes → audit row written → loop detector trips on repeat)
- [ ] **Rate limiting** on `/run` and `/webhook/run`
- [ ] **Observability** — structured logging, Prometheus metrics, traces
- [ ] Flesh out `services/agent-engine/runAgent.ts` — actual agent execution loop
- [ ] Flesh out `packages/loop/fixer.ts` and `packages/review/reviewer.ts`
- [ ] API integration tests (only pure helpers tested so far)
