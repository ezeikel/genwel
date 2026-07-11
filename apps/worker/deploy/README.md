# Genwel Worker — Hetzner deploy

This worker runs as a systemd service (`genwel-worker.service`) on the shared
Hetzner box at `157.90.168.197`, alongside the PTP, Chunky Crayon, Auntie
Marlene's, Ezeikel, Go Unbeaten, Outside-IR35 and Titrra workers. See the
repo-root [`HETZNER_BOX.md`](../../../HETZNER_BOX.md) for the full runbook.

## This worker

|                   |                                                             |
| ----------------- | ----------------------------------------------------------- |
| **Port**          | 3080                                                        |
| **Box dir**       | `/opt/genwel/` (full monorepo clone)                        |
| **Worker subdir** | `apps/worker/`                                              |
| **Systemd unit**  | `genwel-worker.service`                                     |
| **Runtime**       | Bun (no `xvfb-run` — no Playwright)                         |
| **Role**          | TrueLayer transaction sync + AI categorization (backlog)    |

## Why it exists

Bank sync + AI categorization used to run in a Next.js `after()` on Vercel,
bounded by the serverless execution ceiling — it only categorized ~100
transactions per dashboard visit, so a fresh connection needed several visits
to fully categorize. This worker has no timeout, so it drains the whole backlog
in one triggered run (`POST /sync/transactions`).

## First-time setup on the box

1. `cd /opt && git clone git@github.com:ezeikel/genwel.git genwel`
2. `cd /opt/genwel && /root/.local/share/pnpm/pnpm install --filter "@genwel/worker..."`
3. `pnpm --filter @genwel/db db:generate` (Prisma client the worker imports)
4. `vim apps/worker/.env` (copy from `.env.example`; see keys below) — `chmod 600 apps/worker/.env`
5. `cp apps/worker/deploy/genwel-worker.service /etc/systemd/system/`
6. `systemctl daemon-reload && systemctl enable --now genwel-worker`
7. `curl http://localhost:3080/health` — expect `{"status":"ok","service":"genwel-worker"}`

## Required env keys

- `PORT=3080`
- `WORKER_SECRET` — bearer token for `/sync/*`; MUST match the value on the web
  app (Vercel + `apps/web/.env.local`, as `WORKER_SECRET`).
- `DATABASE_URL` — Neon **prod** URL (branch `br-hidden-violet-ahpayw2m`).
- `TRUELAYER_CLIENT_ID`, `TRUELAYER_CLIENT_SECRET`, `NEXT_PUBLIC_TRUELAYER_ENV=production`.
- `OPENAI_API_KEY` — categorization (gpt-5.6-luna).
- `SENTRY_DSN` — `genwel-worker` Sentry project DSN (omit to disable).

The web app finds the worker via `GENWEL_WORKER_URL=http://157.90.168.197:3080`
(set in Vercel + `apps/web/.env.local`).

## Deploying changes

Push to `main` (touching `apps/worker/**`, `packages/banking/**`, or
`packages/db/**`) and the workflow at
`.github/workflows/deploy-genwel-worker.yml` SSHes in and runs
`git pull && pnpm install --filter "@genwel/worker..." && pnpm --filter @genwel/db db:generate && systemctl restart genwel-worker`.
