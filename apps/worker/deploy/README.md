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
| **Role**          | Bank sync + AI categorization + AI blog generation          |

## Why it exists

Bank sync + AI categorization used to run in a Next.js `after()` on Vercel,
bounded by the serverless execution ceiling — it only categorized ~100
transactions per dashboard visit, so a fresh connection needed several visits
to fully categorize. This worker has no timeout, so it drains the whole backlog
in one triggered run (`POST /sync/transactions`).

It also runs **AI blog generation** (`POST /generate/blog`), moved off
Vercel so the long multi-model pipeline (Claude text + Gemini image judge +
gpt-image-2 fallback + Sanity upload) runs on flat-cost box compute with no
serverless timeout. Vercel cron hits the thin web route
(`apps/web/app/api/blog/generate`, `CRON_SECRET` bearer) which hands off to
this worker (`WORKER_SECRET` bearer). The post is published to Sanity
(`status:'published'`); compliance lives entirely in the generation prompts.

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
- `WORKER_SECRET` — bearer token for `/sync/*` AND `/generate/*`; MUST match the
  value on the web app (Vercel + `apps/web/.env.local`, as `WORKER_SECRET`).
- `DATABASE_URL` — Neon **prod** URL (branch `br-hidden-violet-ahpayw2m`).
- `TRUELAYER_CLIENT_ID`, `TRUELAYER_CLIENT_SECRET`, `NEXT_PUBLIC_TRUELAYER_ENV=production`.
- `OPENAI_API_KEY` — categorization (gpt-5.6-luna) + blog gpt-image-2 fallback.
- `SENTRY_DSN` — `genwel-worker` Sentry project DSN (omit to disable).
- `ANTHROPIC_API_KEY` — blog meta + body + never-dry topic ideation
  (Claude Sonnet 5). Required for `/generate/blog`.
- `GOOGLE_GENERATIVE_AI_API_KEY` — blog featured-image vision judge (Gemini).
- `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION`,
  `SANITY_WRITE_TOKEN` — the blog CMS write path (create posts + upload image
  assets). Same values the web app reads as `NEXT_PUBLIC_SANITY_*` /
  `SANITY_API_TOKEN`.
- `PEXELS_API_KEY` — blog featured-image stock search (tried before
  gpt-image-2). Optional: unset = always generate.

The web app finds the worker via `GENWEL_WORKER_URL=http://157.90.168.197:3080`
(set in Vercel + `apps/web/.env.local`), used by both the transaction-sync
trigger and the blog cron handoff (`apps/web/lib/worker.ts`).

## Deploying changes

Push to `main` (touching `apps/worker/**` — which now includes the blog
pipeline under `apps/worker/src/blog/**` — `packages/banking/**`, or
`packages/db/**`) and the workflow at
`.github/workflows/deploy-genwel-worker.yml` SSHes in and runs
`git pull && pnpm install --filter "@genwel/worker..." && pnpm --filter @genwel/db db:generate && systemctl restart genwel-worker`.
