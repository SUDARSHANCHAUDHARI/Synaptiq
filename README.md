# Synaptiq

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4-black.svg)](https://fastify.dev/)
[![Status](https://img.shields.io/badge/status-skeleton%20%2B%20hardened%20foundations-yellow.svg)](RELEASE_MEMORY.md)

AI agent debugging and cost-tracking backend with Fastify API, BullMQ worker, PostgreSQL audit storage, Redis queues, and OpenAI-powered loop-fix concepts.

> **Status:** Working skeleton with hardened foundations — fail-closed webhook auth, typed PostgreSQL audit log, graceful shutdown, Docker Compose for Postgres/Redis, and an 11-test Vitest suite covering the cost tracker and loop detector. The end-to-end path (create run → enqueue → worker executes → audit row written) needs a live integration smoke test against the Compose stack, and rate limits / observability are still TODO before treating this as a production service.

## Table of Contents

- [Why This Exists](#why-this-exists)
- [Status](#status)
- [Key Technical Decisions](#key-technical-decisions)
- [Features](#features)
- [Setup](#setup)
- [Verification](#verification)
- [Known Limits](#known-limits)
- [About](#about)

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

---

## About

I'm Sudarshan Chaudhari, a Senior Quality Engineer, Test Automation specialist, and AI systems builder based in Bangkok, Thailand.

I have 13+ years of experience in software quality engineering, working across SaaS, fintech, gaming, web, mobile, cloud, and digital signage platforms. My background combines hands-on test automation with QA leadership, test strategy, CI/CD, release quality, production investigation, and cross-platform validation.

Alongside my professional QA career, I run [SudarshanTechLabs](https://sudarshantechlabs.com/), my independent engineering and product lab where I design, build, test, and ship software across Android, web, AI, cybersecurity, developer tooling, and cross-platform applications.

### What I work on

- ⚙️ **Quality Engineering & Test Automation** — Playwright, Selenium, Cypress, Appium, API testing, automation frameworks, end-to-end testing, CI/CD, release gates, GitHub Actions, risk-based testing, and production validation
- 🤖 **AI Systems & Automation** — AI agents, multi-agent orchestration, MCP servers, AI-assisted QA, prompt tooling, developer workflows, automation systems, and Claude Code plugins
- 📱 **Mobile & Cross-Platform Applications** — Android applications built with Kotlin and Jetpack Compose, Google Play releases, automated build and publishing pipelines, and cross-platform development spanning iOS, web, Windows, and macOS
- 🌐 **Web Applications & Platforms** — Full-stack applications using Next.js, TypeScript, Firebase, Cloudflare, REST APIs, and modern web infrastructure
- 🛠️ **Developer Tooling & CLI Engineering** — Rust, Python, TypeScript, CLI utilities, multi-repository tooling, build automation, release tooling, and engineering productivity systems
- 🛡️ **Cybersecurity & Observability** — Threat detection, log analysis, security auditing, vulnerability assessment, monitoring, and security-focused developer tools
- 📺 **Digital Signage & Device Platforms** — Content validation, playback testing, device compatibility, production investigation, monitoring, and QA across diverse hardware and operating-system environments

My work sits at the intersection of quality engineering, automation, AI, and software development. I approach products with a QA mindset from the beginning: understanding failure modes, designing for testability, automating repetitive work, and building release confidence into the engineering process.

Through SudarshanTechLabs, I also build products and tools from idea to production, covering architecture, development, testing, CI/CD, release automation, monitoring, and ongoing maintenance.

🌐 [sudarshantechlabs.com](https://sudarshantechlabs.com/) · 💼 [LinkedIn](https://linkedin.com/in/sudarshan-chaudhari) · 🐙 [GitHub](https://github.com/SUDARSHANCHAUDHARI) · ✉️ [sunny.sudarshan@gmail.com](mailto:sunny.sudarshan@gmail.com)
