# FlowForge

Zapier-style **workflow automation platform** — personal MNC-grade project.

**Production stack (no Java required):** React (Vite) · Node/Express (engine + NL→workflow) · Redis/PostgreSQL ready

Reference implementations kept at `backend-java/` (Spring Boot) and `aiml/` (FastAPI).

## Features

- Visual DAG workflow builder
- Triggers: webhook, cron, manual
- Actions: HTTP, email mock, delay, condition
- Async execution with retries + DLQ pattern
- Natural language → workflow (rule-based AIML, embedded in Node)
- Cycle detection + topological run order (DSA)

## Layout

```
FlowForge/
├── frontend/          # React + Vite workflow UI
├── backend-node/      # Express API + DAG engine + NL builder (production)
├── backend-java/      # Spring Boot reference (optional)
├── aiml/              # FastAPI NL reference (optional)
├── workflows/         # Sample workflow JSON
├── Procfile           # Heroku-style: web: npm start
└── docker-compose.yml # Postgres + Redis sidecars
```

## Quick start (Node — recommended)

Requires **Node 18+**. No Java/Maven/Python needed.

```bash
# Install deps + build frontend + run API (serves UI in production)
npm run install:all
npm run build
npm start
# → http://localhost:4080
```

### Development (API + Vite hot reload)

```bash
npm run install:all
# Terminal 1 — API on :4080
npm run dev:api
# Terminal 2 — UI on :5174 (proxies /api → :4080)
npm run dev:web
```

Or `npm run dev` to start both (backgrounds the API).

### API surface

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/health` | Liveness |
| GET/POST | `/api/workflows` | List / create (cycle-checked) |
| GET | `/api/workflows/:id` | Fetch one |
| POST | `/api/workflows/:id/trigger` | Run with retries → DLQ |
| GET | `/api/runs`, `/api/runs/:id` | Execution history |
| GET | `/api/dlq` | Dead-letter run ids |
| POST | `/api/nl-to-workflow` | NL → workflow JSON |

Default port: **4080** (`PORT` env overrides).

## Optional: Java + Python references

```bash
# AIML (port 5001)
cd aiml && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && uvicorn app.main:app --reload --port 5001

# Java (needs JDK 17+ and Maven, port 8080)
cd backend-java && mvn spring-boot:run
```

## Resume one-liner

> Designed a multi-step automation engine with DAG execution, retry/DLQ semantics, and NL→workflow generation.
