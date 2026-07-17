# Claude Code Context

## Current AI models
Use the latest model ids from `~/Development/Personal/scripts/model-registry/LATEST-MODELS.md`
(live provider snapshot — supersedes training data). Fleet defaults: text = claude-sonnet-5,
vision judge = claude-opus-4-8, image gen = gpt-image-2 (gpt-image-1.5 where speed matters),
search = sonar. Regenerate: `tsx ~/Development/Personal/scripts/model-registry/fetch-models.ts`.

## Database (Neon)

This project uses Neon PostgreSQL with branch-based development:

- **Project ID**: `frosty-violet-47225787`
- **Organization**: Chewy Bytes (`org-fragrant-frog-77141390`)

### Branches

| Branch | ID | Usage |
|--------|----|-------|
| production | `br-hidden-violet-ahpayw2m` | Production data. Used by Vercel + GitHub Actions. |
| development | `br-square-fire-ahs8zxcs` | Local development. Used in `.env.local`. |

**Important**: Always query the **development** branch when running locally. The production branch should only be accessed by CI/CD and the deployed app.

### Migrations

**CRITICAL: Never use `prisma db push`** - it causes schema drift between the database and migration history.

#### Workflow

1. **Make schema changes** in `packages/db/prisma/schema.prisma`
2. **Create migration locally**: `cd packages/db && pnpm db:migrate`
3. **Build the db package**: `pnpm build` (compiles TypeScript after Prisma generates client)
4. **Commit & push** migration files to `main` branch
5. **Auto-deploy**: GitHub Action runs `prisma migrate deploy` on production

#### Commands (run from `packages/db`)

| Command           | Purpose                  | When to Use                     |
| ----------------- | ------------------------ | ------------------------------- |
| `pnpm db:migrate` | Create + apply migration | After schema changes            |
| `pnpm build`      | Compile TypeScript       | After db:migrate or db:generate |
| `pnpm db:deploy`  | Apply existing migrations| CI/CD only                      |
| `pnpm db:generate`| Regenerate Prisma client | After pulling changes           |
| `pnpm db:push`    | **NEVER USE**            | Causes drift                    |
| `pnpm db:studio`  | Database GUI             | Debugging                       |

**Important**: Always run `pnpm build` after `db:migrate` or `db:generate` to compile the updated Prisma client.

## Project Structure

- **Monorepo** using Turborepo + pnpm workspaces
- `apps/web` - Next.js 16 marketing website
- `apps/mobile` - Placeholder for future React Native app
- `packages/db` - Prisma database client

### Monorepo Constraints

**React version must stay in sync** across all apps and packages. pnpm's strict dependency isolation means version mismatches cause multiple React instances, leading to "Invalid hook call" errors. When upgrading React, update all workspaces together.

## Web App (apps/web)

### Key Features

- Marketing site for Genwel (UK budgeting app)
- Blog with Sanity CMS backend
- AI-powered blog post generation
- Waitlist and launch pages

### Tech Stack

- **Framework**: Next.js 16 with Turbopack
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **CMS**: Sanity (headless)
- **Analytics**: PostHog, Plausible, Vercel Analytics
- **Error Tracking**: Sentry
- **AI**: Vercel AI SDK (OpenAI, Google)
- **Images**: Pexels API

## Sanity CMS

### Setup (One-time)

To create a new Sanity project:

```bash
cd apps/web
npx sanity init --create-project "Genwel Blog" --dataset production
```

Then add the project ID to your environment variables.

### Environment Variables

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-01-17
SANITY_API_TOKEN=<write-token>
SANITY_REVALIDATE_SECRET=<webhook-secret>
```

### Content Types

- **Post** - Blog posts with Portable Text body
- **Author** - Blog authors
- **Category** - Post categories

### Studio Access

Access the Sanity Studio at `/studio` when running the dev server.

## Analytics

### PostHog

- Server client: `lib/posthog-server.ts`
- Client hook: `utils/analytics-client.ts` - `useAnalytics()`
- Server tracking: `utils/analytics-server.ts` - `track()`, `trackWithUser()`

### Plausible

- Domain: `genwel.com`
- Proxied through Next.js for ad-blocker bypass

### Vercel Analytics

- Automatically included in layout

## Error Tracking (Sentry)

- **Org**: chewybytes
- **Project**: genwel-web
- **Tunnel Route**: `/monitoring`

### Configuration Files

- `sentry.server.config.ts` - Server-side
- `sentry.client.config.ts` - Client-side with replay
- `sentry.edge.config.ts` - Edge runtime
- `instrumentation.ts` - Runtime initialization

## Blog Generation

### Manual Generation

Trigger via API with authentication:

```bash
curl -X POST "http://localhost:3000/api/blog/generate" \
  -H "Authorization: Bearer $CRON_SECRET"
```

### With Specific Topic

```bash
curl -X POST "http://localhost:3000/api/blog/generate?topic=Building%20an%20emergency%20fund" \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Topics List

Topics are defined in `lib/ai/prompts.ts`. The system tracks which topics have been covered to avoid duplicates.

## Environment Variables

### Required for Development

```env
# Database (Neon)
DATABASE_URL=

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Email (Resend)
RESEND_API_KEY=
DEFAULT_FROM_EMAIL=

# TrueLayer (Open Banking)
TRUELAYER_CLIENT_ID=
TRUELAYER_CLIENT_SECRET=
TRUELAYER_REDIRECT_URI=http://localhost:3000/api/banking/callback
NEXT_PUBLIC_TRUELAYER_ENV=sandbox

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# Sentry
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=

# AI Generation (for blog)
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
PEXELS_API_KEY=

# Security
CRON_SECRET=
SANITY_REVALIDATE_SECRET=

# FontAwesome (in .npmrc)
FONTAWESOME_NPM_AUTH_TOKEN=
```

## Vercel Deployment

The web app will be deployed via Vercel. **Important**: The Vercel project should be linked in `apps/web`, not the repo root.

```bash
cd apps/web
vercel link
vercel env pull
```

## Commits

Use semantic commit style (`type(scope): message`). Keep messages as one-liners, succinct but covering work done. Do not attribute Claude in commit messages.

## GitHub CLI

Use `gh` CLI when referencing GitHub repos that I own or public repos (e.g., `gh repo view`, `gh issue list`, `gh pr list`).
