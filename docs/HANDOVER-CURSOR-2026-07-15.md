# Genwel — Cursor Handover (2026-07-15)

## Bottom line

The heavy product build is complete. Genwel now has a production web app and a
native Expo mobile app with real authenticated data, native bank selection,
interactive onboarding, a pre-sign-in paywall, five native product tabs,
RevenueCat client plumbing, notifications, and an account/settings hub.

The remaining work is release integration, safety work, and QA rather than a
new product build. A smaller model is suitable for these bounded tasks, but it
must not make destructive database, store, or standing-configuration changes
without explicit user approval.

**Current branch/deployment:** `main`, commit `9ef5850` (`feat(web): add public
support page`). The worktree was clean immediately after the push. Git pushes
to `main` deploy the web app through Vercel.

## What is complete

### Web product

- Live at `https://www.genwel.com`.
- Real TrueLayer production bank connections, sync, dashboard, subscriptions,
  budgets, insights, and Ask Genwel are working.
- Live Stripe Pro checkout and webhook entitlement flow were verified.
- The subscriptions detection rewrite is live and was validated against real
  data; use the shared `lib/subscriptions.ts` logic, never reimplement it.
- Insights chart Y-axis uses compact GBP ticks rather than clipped `000.00`.
- Magic-link users are prompted for their preferred name after sign-in.
- Public support page is live at `/support`; footer links to Support, Privacy,
  and Terms.

### Mobile product

- Expo SDK 57 / React Native 0.86 app at `apps/mobile`.
- Native auth: Apple, Google, Facebook when configured, and magic links.
- Bearer-authenticated mobile API layer in `apps/web/app/api/mobile/*`, sharing
  existing server-side logic rather than duplicating it.
- Five tabs: Overview, Accounts, Transactions, Subscriptions, Ask.
- Floating frosted tab bar, Font Awesome Pro icon set, shared Genwel brand
  palette, charts implemented with native libraries/Skia rather than Recharts.
- Accounts can select a bank natively and continue through TrueLayer in the
  system browser. This is the correct security UX: bank consent itself cannot
  be made native by Genwel.
- Development builds use localhost plus the Neon development branch and
  TrueLayer sandbox. Preview/production use `https://www.genwel.com`, the
  production database, and TrueLayer live.
- Pre-auth paywall appears in onboarding before sign-in; RevenueCat client
  configuration, entitlement (`genwel_pro`), default offering, monthly and
  annual package handling, restore, and billing reconciliation are wired.
- Notification permission/onboarding is present.
- The More sheet is intentionally the account/settings hub, not a sixth tab.
  It contains Insights, Budgets, Pro, notification settings, view onboarding,
  Support, Privacy, Terms, version/build, and sign out.
- “View onboarding” is non-destructive: closing it returns to the signed-in app
  without resetting onboarding state or changing subscription state.

## Important architecture

| Concern | Source of truth / implementation |
| --- | --- |
| Database | Neon + Prisma in `packages/db`; use migrations only |
| Mobile data | `apps/web/app/api/mobile/*` JSON routes, bearer-authenticated |
| Web deploy | Git push to `main` (Vercel Git deployment) |
| Mobile environments | `apps/mobile/eas.json` and EAS environments |
| Bank connection | TrueLayer consent in system browser; native bank picker before it |
| Mobile Pro | RevenueCat SDK; web Pro remains Stripe |
| User settings | `apps/mobile/components/MoreSheet.tsx` |

## Environment boundaries

| Environment | API | Database | Banking |
| --- | --- | --- | --- |
| Local/dev client | `http://localhost:3000` | Neon development | TrueLayer sandbox |
| EAS preview | `https://www.genwel.com` | production | TrueLayer live |
| EAS production | `https://www.genwel.com` | production | TrueLayer live |

Neon project: `frosty-violet-47225787`.

- Production branch: `br-hidden-violet-ahpayw2m`
- Development branch: `br-square-fire-ahs8zxcs`

Never point development at production merely to make the simulator show real
accounts. The clean sandbox user/data path is deliberate.

## What remains (recommended order)

1. **Verify infrastructure mapping.** Use the Neon MCP, if available in the
   current editor session, to confirm development and production branches and
   ensure EAS/Vercel environment values match the table above. The MCP was
   authenticated in the prior Codex environment, but that authentication may
   not transfer to Cursor: check rather than assume.

2. **Add account deletion.** This is the highest remaining mobile launch
   requirement for an app where users create accounts. Add a clear “Delete
   account & data” row in More, a typed confirmation flow, and a bearer-auth
   server route. It must revoke/disconnect bank access where the provider API
   supports it and delete/cascade the user’s stored data. Implement and verify
   against development first. Do not perform a production deletion test without
   explicit approval.

3. **Audit the remote RevenueCat configuration.** Inspect, do not guess:
   project, iOS/Android apps, entitlement `genwel_pro`, default offering, and
   `$rc_monthly`/`$rc_annual` packages. The repository has the client-side
   wiring, but remote state needs confirmation. Do not create store products or
   submit builds without approval.

4. **Create preview/internal builds and complete end-to-end QA.** Validate:
   native auth, magic link return, live TrueLayer connection, data sync,
   onboarding/paywall, RevenueCat purchase and restore, notification prompt,
   legal/support links, and account deletion.

5. **Store setup, then submission.** Create the App Store Connect and Google
   Play app records and subscription products using the existing Chewy Bytes
   naming/pricing conventions. This is standing external configuration; ask
   the user before doing it. Do not submit to review without a separate yes.

## Development commands

From repo root:

```bash
pnpm --filter @genwel/web check-types
pnpm --filter @genwel/web build
pnpm --filter @genwel/mobile check-types
pnpm --filter @genwel/mobile exec expo export
```

For local mobile work, start the web app on port 3000, then use the existing
Genwel dev client on Metro port 8082. Use Argent MCP for simulator interaction
and verify every visual/mobile change before committing. Do not use screenshot
coordinates to tap: discover UI elements first.

## Guardrails and gotchas

- Commits: `type(scope): message`, one line, no model attribution.
- Deploy web changes with `git push origin main`; do not use `vercel --prod`.
- Never run `prisma db push`. For schema changes use
  `cd packages/db && pnpm db:migrate`, then `pnpm build`, commit the migration,
  and push. Production migration deployment is CI/CD.
- Ask before store submissions, production migrations, deleting production
  data, or creating/altering external standing configuration.
- Genwel is not FCA-regulated. Keep “not regulated financial advice” language.
- Do not use the phrase “AI” in product or marketing copy; legal copy and the
  existing guidance disclaimer are the only exceptions.
- Use Font Awesome Pro consistently. Web and mobile currently share teal
  `#1a5a5a`, gold `#d4a03c`, and cream `#faf9f7`.
- The older `docs/LAUNCH-AUDIT-2026-07.md` and
  `docs/HANDOVER-CODEX-2026-07-14.md` describe the pre-mobile state and are
  historical. This document supersedes their completion status. `CLAUDE.md`
  remains authoritative for database migration rules.
- An Argent update from 0.8.1 to 0.15.0 was available but intentionally not
  installed. Ask before updating tooling.

## High-value files

- `apps/mobile/components/MoreSheet.tsx` — settings/account hub.
- `apps/mobile/components/onboarding/IntroCarousel.tsx` — interactive carousel.
- `apps/mobile/app/(onboarding)/index.tsx` — normal and preview onboarding
  behavior.
- `apps/mobile/lib/purchases.ts` and `apps/mobile/contexts/purchases.tsx` —
  RevenueCat integration.
- `apps/mobile/eas.json` and `apps/mobile/app.config.ts` — build variants,
  bundle IDs, environment boundaries.
- `apps/web/app/api/mobile/*` — mobile JSON API.
- `apps/web/app/api/mobile/billing/reconcile/route.ts` — mobile entitlement
  reconciliation.
- `apps/web/app/support/page.tsx` — mobile Support destination.
- `apps/web/components/dashboard/insights/SpendingTrendChart.tsx` — compact
  currency ticks.
- `apps/web/components/dashboard/NamePrompt.tsx` and `apps/web/actions/profile.ts`
  — magic-link name capture.

## Suggested first Cursor task

Start with the infrastructure audit and account deletion implementation. Keep
the work narrowly scoped; do not start store configuration until the user has
reviewed the RevenueCat audit and explicitly approved it.

## Paste this into a new Cursor conversation

```text
You are continuing Genwel, a live UK money app in this repository. Start by
reading docs/HANDOVER-CURSOR-2026-07-15.md and the root CLAUDE.md in full, then
run git status and inspect the relevant existing implementation before editing.

The heavy web/mobile build is complete. Your first task is to verify the
development vs production infrastructure mapping with Neon MCP if it is
available in this Cursor session; do not assume Codex MCP authentication carries
over. Then implement a safe in-app “Delete account & data” flow from the mobile
More sheet plus a bearer-authenticated API endpoint. Validate it only against
development/sandbox data. Before deleting production data, creating store
records/products, submitting builds, or making a production migration or other
standing external configuration change, stop and ask me.

Use the existing mobile API/data-layer patterns; do not duplicate dashboard
logic or access Prisma directly from the mobile app. Use Argent MCP for every
simulator interaction and visually verify mobile changes before committing.

Genwel constraints: commits are type(scope): message one-liners with no model
attribution; deploy web changes only by pushing main; never use prisma db push;
Genwel is not FCA-regulated; do not use “AI” in product/marketing copy. Keep
the five-tab navigation; More is the account/settings hub. Report the proposed
deletion-data scope before implementing irreversible server-side behavior.
```
