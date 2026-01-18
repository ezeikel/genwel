# Claude Code Context

## Project Structure

- **Monorepo** using Turborepo + pnpm workspaces
- `apps/web` - Next.js 16 marketing website
- `apps/mobile` - Placeholder for future React Native app

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
