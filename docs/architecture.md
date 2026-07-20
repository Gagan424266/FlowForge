# FlowForge architecture

## Services (production)

| Service | Port | Role |
|---------|------|------|
| Node Express (`backend-node`) | 4080 | CRUD workflows, DAG validate, execute, DLQ, NL→workflow, static UI |
| React UI (Vite dev) | 5174 | Builder + run viewer (proxies `/api` → 4080) |

## Reference (optional)

| Service | Port | Role |
|---------|------|------|
| Java engine (`backend-java`) | 8080 | Same engine API as Node |
| AIML (`aiml`) | 5001 | Same NL→workflow as Node |

## DSA

- **Cycle detection** — DFS 3-color in `dagEngine.js` / `DagEngine.java`
- **Topological sort** — Kahn's algorithm for run order
- **Retry backoff** — exponential sleep between attempts
